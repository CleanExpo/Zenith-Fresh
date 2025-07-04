#!/bin/bash

# Infrastructure Health Check Script
# Comprehensive health monitoring for global infrastructure
# Version: 1.0.0

set -euo pipefail

# ==================== CONFIGURATION ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HEALTH_CHECK_CONFIG="$PROJECT_ROOT/infrastructure/health-check-config.json"
RESULTS_DIR="$PROJECT_ROOT/health-check-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Global variables
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Health check categories
declare -A HEALTH_CATEGORIES=(
    ["networking"]="VPC, Subnets, Route Tables, NAT Gateways"
    ["compute"]="ECS Clusters, Load Balancers, Auto Scaling Groups"
    ["database"]="RDS Clusters, ElastiCache, Connection Pools"
    ["storage"]="S3 Buckets, EBS Volumes, File Systems"
    ["cdn"]="CloudFront Distributions, Edge Locations"
    ["monitoring"]="CloudWatch, Alarms, Dashboards"
    ["security"]="Security Groups, WAF, SSL Certificates"
    ["dns"]="Route53, Health Checks, Failover"
)

# Regions to check
REGIONS=(
    "us-east-1"
    "us-west-2"
    "eu-west-1"
    "ap-southeast-1"
    "ap-northeast-1"
)

# ==================== UTILITY FUNCTIONS ====================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
    ((WARNING_CHECKS++))
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    ((FAILED_CHECKS++))
}

log_info() {
    echo -e "${PURPLE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

increment_total() {
    ((TOTAL_CHECKS++))
}

# ==================== NETWORKING HEALTH CHECKS ====================

check_vpc_health() {
    log "Checking VPC health across regions..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        local vpc_count=$(aws ec2 describe-vpcs --region "$region" \
            --filters "Name=tag:Project,Values=zenith" \
            --query 'Vpcs | length(@)' --output text 2>/dev/null || echo "0")
        
        if [ "$vpc_count" -gt 0 ]; then
            log_success "VPC health check passed in $region ($vpc_count VPCs)"
            
            # Check VPC subnets
            increment_total
            local subnet_count=$(aws ec2 describe-subnets --region "$region" \
                --filters "Name=tag:Project,Values=zenith" \
                --query 'Subnets | length(@)' --output text 2>/dev/null || echo "0")
            
            if [ "$subnet_count" -gt 0 ]; then
                log_success "Subnet health check passed in $region ($subnet_count subnets)"
            else
                log_warning "No subnets found in $region"
            fi
            
            # Check NAT Gateways
            increment_total
            local nat_count=$(aws ec2 describe-nat-gateways --region "$region" \
                --filter "Name=tag:Project,Values=zenith" \
                --query 'NatGateways[?State==`available`] | length(@)' --output text 2>/dev/null || echo "0")
            
            if [ "$nat_count" -gt 0 ]; then
                log_success "NAT Gateway health check passed in $region ($nat_count NAT gateways)"
            else
                log_warning "No active NAT gateways found in $region"
            fi
            
        else
            log_error "No VPCs found in $region"
        fi
    done
}

check_load_balancer_health() {
    log "Checking load balancer health..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        # Check Application Load Balancers
        local alb_info=$(aws elbv2 describe-load-balancers --region "$region" \
            --query 'LoadBalancers[?Type==`application`].[LoadBalancerName,State.Code]' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$alb_info" ]; then
            local healthy_albs=0
            local total_albs=0
            
            while IFS=$'\t' read -r name state; do
                ((total_albs++))
                if [ "$state" = "active" ]; then
                    ((healthy_albs++))
                fi
            done <<< "$alb_info"
            
            if [ $healthy_albs -eq $total_albs ] && [ $total_albs -gt 0 ]; then
                log_success "Load balancer health check passed in $region ($healthy_albs/$total_albs active)"
            elif [ $healthy_albs -gt 0 ]; then
                log_warning "Some load balancers unhealthy in $region ($healthy_albs/$total_albs active)"
            else
                log_error "All load balancers unhealthy in $region"
            fi
            
            # Check target group health
            increment_total
            local target_groups=$(aws elbv2 describe-target-groups --region "$region" \
                --query 'TargetGroups[].TargetGroupArn' --output text 2>/dev/null || echo "")
            
            if [ -n "$target_groups" ]; then
                local healthy_targets=0
                local total_targets=0
                
                for tg_arn in $target_groups; do
                    local targets=$(aws elbv2 describe-target-health --region "$region" \
                        --target-group-arn "$tg_arn" \
                        --query 'TargetHealthDescriptions[].TargetHealth.State' \
                        --output text 2>/dev/null || echo "")
                    
                    for state in $targets; do
                        ((total_targets++))
                        if [ "$state" = "healthy" ]; then
                            ((healthy_targets++))
                        fi
                    done
                done
                
                if [ $total_targets -gt 0 ]; then
                    local health_percentage=$((healthy_targets * 100 / total_targets))
                    if [ $health_percentage -ge 80 ]; then
                        log_success "Target group health check passed in $region ($healthy_targets/$total_targets healthy)"
                    elif [ $health_percentage -ge 50 ]; then
                        log_warning "Target group health degraded in $region ($healthy_targets/$total_targets healthy)"
                    else
                        log_error "Target group health critical in $region ($healthy_targets/$total_targets healthy)"
                    fi
                else
                    log_warning "No targets found in target groups for $region"
                fi
            else
                log_warning "No target groups found in $region"
            fi
        else
            log_warning "No load balancers found in $region"
        fi
    done
}

# ==================== COMPUTE HEALTH CHECKS ====================

check_ecs_health() {
    log "Checking ECS cluster health..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        local clusters=$(aws ecs list-clusters --region "$region" \
            --query 'clusterArns' --output text 2>/dev/null || echo "")
        
        if [ -n "$clusters" ]; then
            local healthy_clusters=0
            local total_clusters=0
            
            for cluster_arn in $clusters; do
                ((total_clusters++))
                local cluster_status=$(aws ecs describe-clusters --region "$region" \
                    --clusters "$cluster_arn" \
                    --query 'clusters[0].status' --output text 2>/dev/null || echo "")
                
                if [ "$cluster_status" = "ACTIVE" ]; then
                    ((healthy_clusters++))
                    
                    # Check running tasks
                    local running_tasks=$(aws ecs list-tasks --region "$region" \
                        --cluster "$cluster_arn" \
                        --desired-status RUNNING \
                        --query 'taskArns | length(@)' --output text 2>/dev/null || echo "0")
                    
                    local cluster_name=$(basename "$cluster_arn")
                    log_info "Cluster $cluster_name has $running_tasks running tasks"
                fi
            done
            
            if [ $healthy_clusters -eq $total_clusters ] && [ $total_clusters -gt 0 ]; then
                log_success "ECS health check passed in $region ($healthy_clusters/$total_clusters active)"
            elif [ $healthy_clusters -gt 0 ]; then
                log_warning "Some ECS clusters unhealthy in $region ($healthy_clusters/$total_clusters active)"
            else
                log_error "All ECS clusters unhealthy in $region"
            fi
        else
            log_warning "No ECS clusters found in $region"
        fi
    done
}

check_autoscaling_health() {
    log "Checking Auto Scaling Group health..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        local asgs=$(aws autoscaling describe-auto-scaling-groups --region "$region" \
            --query 'AutoScalingGroups[?Tags[?Key==`Project` && Value==`zenith`]].[AutoScalingGroupName,DesiredCapacity,Instances[?LifecycleState==`InService`] | length(@)]' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$asgs" ]; then
            local healthy_asgs=0
            local total_asgs=0
            
            while IFS=$'\t' read -r asg_name desired_capacity healthy_instances; do
                ((total_asgs++))
                local health_ratio=$((healthy_instances * 100 / desired_capacity))
                
                if [ $health_ratio -ge 80 ]; then
                    ((healthy_asgs++))
                    log_info "ASG $asg_name: $healthy_instances/$desired_capacity instances healthy"
                else
                    log_warning "ASG $asg_name: $healthy_instances/$desired_capacity instances healthy ($health_ratio%)"
                fi
            done <<< "$asgs"
            
            if [ $healthy_asgs -eq $total_asgs ] && [ $total_asgs -gt 0 ]; then
                log_success "Auto Scaling health check passed in $region ($healthy_asgs/$total_asgs healthy)"
            elif [ $healthy_asgs -gt 0 ]; then
                log_warning "Some Auto Scaling Groups unhealthy in $region ($healthy_asgs/$total_asgs healthy)"
            else
                log_error "All Auto Scaling Groups unhealthy in $region"
            fi
        else
            log_warning "No Auto Scaling Groups found in $region"
        fi
    done
}

# ==================== DATABASE HEALTH CHECKS ====================

check_rds_health() {
    log "Checking RDS cluster health..."
    
    # Check global clusters
    increment_total
    local global_clusters=$(aws rds describe-global-clusters \
        --query 'GlobalClusters[?GlobalClusterIdentifier!=null].[GlobalClusterIdentifier,Status]' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$global_clusters" ]; then
        local healthy_global=0
        local total_global=0
        
        while IFS=$'\t' read -r cluster_id status; do
            ((total_global++))
            if [ "$status" = "available" ]; then
                ((healthy_global++))
            fi
        done <<< "$global_clusters"
        
        if [ $healthy_global -eq $total_global ] && [ $total_global -gt 0 ]; then
            log_success "RDS global cluster health check passed ($healthy_global/$total_global available)"
        elif [ $healthy_global -gt 0 ]; then
            log_warning "Some RDS global clusters unhealthy ($healthy_global/$total_global available)"
        else
            log_error "All RDS global clusters unhealthy"
        fi
    else
        log_warning "No RDS global clusters found"
    fi
    
    # Check regional clusters
    for region in "${REGIONS[@]}"; do
        increment_total
        
        local clusters=$(aws rds describe-db-clusters --region "$region" \
            --query 'DBClusters[?DBClusterIdentifier!=null].[DBClusterIdentifier,Status]' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$clusters" ]; then
            local healthy_clusters=0
            local total_clusters=0
            
            while IFS=$'\t' read -r cluster_id status; do
                ((total_clusters++))
                if [ "$status" = "available" ]; then
                    ((healthy_clusters++))
                    
                    # Check cluster members
                    local members=$(aws rds describe-db-clusters --region "$region" \
                        --db-cluster-identifier "$cluster_id" \
                        --query 'DBClusters[0].DBClusterMembers | length(@)' \
                        --output text 2>/dev/null || echo "0")
                    
                    log_info "Cluster $cluster_id has $members members"
                fi
            done <<< "$clusters"
            
            if [ $healthy_clusters -eq $total_clusters ] && [ $total_clusters -gt 0 ]; then
                log_success "RDS cluster health check passed in $region ($healthy_clusters/$total_clusters available)"
            elif [ $healthy_clusters -gt 0 ]; then
                log_warning "Some RDS clusters unhealthy in $region ($healthy_clusters/$total_clusters available)"
            else
                log_error "All RDS clusters unhealthy in $region"
            fi
        else
            log_warning "No RDS clusters found in $region"
        fi
    done
}

check_elasticache_health() {
    log "Checking ElastiCache cluster health..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        # Check Redis clusters
        local redis_clusters=$(aws elasticache describe-cache-clusters --region "$region" \
            --query 'CacheClusters[?Engine==`redis`].[CacheClusterId,CacheClusterStatus]' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$redis_clusters" ]; then
            local healthy_redis=0
            local total_redis=0
            
            while IFS=$'\t' read -r cluster_id status; do
                ((total_redis++))
                if [ "$status" = "available" ]; then
                    ((healthy_redis++))
                fi
            done <<< "$redis_clusters"
            
            if [ $healthy_redis -eq $total_redis ] && [ $total_redis -gt 0 ]; then
                log_success "ElastiCache Redis health check passed in $region ($healthy_redis/$total_redis available)"
            elif [ $healthy_redis -gt 0 ]; then
                log_warning "Some ElastiCache Redis clusters unhealthy in $region ($healthy_redis/$total_redis available)"
            else
                log_error "All ElastiCache Redis clusters unhealthy in $region"
            fi
        else
            log_warning "No ElastiCache Redis clusters found in $region"
        fi
    done
}

# ==================== CDN HEALTH CHECKS ====================

check_cloudfront_health() {
    log "Checking CloudFront distribution health..."
    
    increment_total
    
    local distributions=$(aws cloudfront list-distributions \
        --query 'DistributionList.Items[?Enabled==`true`].[Id,Status,DomainName]' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$distributions" ]; then
        local healthy_distributions=0
        local total_distributions=0
        
        while IFS=$'\t' read -r dist_id status domain_name; do
            ((total_distributions++))
            if [ "$status" = "Deployed" ]; then
                ((healthy_distributions++))
                
                # Test distribution endpoint
                increment_total
                local response_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain_name/health" || echo "000")
                
                if [[ "$response_code" =~ ^[23] ]]; then
                    log_success "CloudFront distribution $dist_id endpoint test passed (HTTP $response_code)"
                else
                    log_warning "CloudFront distribution $dist_id endpoint test failed (HTTP $response_code)"
                fi
            fi
        done <<< "$distributions"
        
        if [ $healthy_distributions -eq $total_distributions ] && [ $total_distributions -gt 0 ]; then
            log_success "CloudFront health check passed ($healthy_distributions/$total_distributions deployed)"
        elif [ $healthy_distributions -gt 0 ]; then
            log_warning "Some CloudFront distributions unhealthy ($healthy_distributions/$total_distributions deployed)"
        else
            log_error "All CloudFront distributions unhealthy"
        fi
    else
        log_warning "No CloudFront distributions found"
    fi
}

# ==================== MONITORING HEALTH CHECKS ====================

check_cloudwatch_health() {
    log "Checking CloudWatch monitoring health..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        # Check CloudWatch alarms
        local alarms=$(aws cloudwatch describe-alarms --region "$region" \
            --query 'MetricAlarms[?ActionsEnabled==`true`].[AlarmName,StateValue]' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$alarms" ]; then
            local ok_alarms=0
            local alarm_alarms=0
            local insufficient_alarms=0
            local total_alarms=0
            
            while IFS=$'\t' read -r alarm_name state; do
                ((total_alarms++))
                case "$state" in
                    "OK") ((ok_alarms++)) ;;
                    "ALARM") ((alarm_alarms++)) ;;
                    "INSUFFICIENT_DATA") ((insufficient_alarms++)) ;;
                esac
            done <<< "$alarms"
            
            log_info "CloudWatch alarms in $region: OK=$ok_alarms, ALARM=$alarm_alarms, INSUFFICIENT=$insufficient_alarms"
            
            if [ $alarm_alarms -eq 0 ]; then
                log_success "CloudWatch alarms healthy in $region (no active alarms)"
            elif [ $alarm_alarms -le 2 ]; then
                log_warning "Some CloudWatch alarms active in $region ($alarm_alarms alarms)"
            else
                log_error "Many CloudWatch alarms active in $region ($alarm_alarms alarms)"
            fi
        else
            log_warning "No CloudWatch alarms found in $region"
        fi
        
        # Check CloudWatch dashboards
        increment_total
        local dashboards=$(aws cloudwatch list-dashboards --region "$region" \
            --query 'DashboardEntries | length(@)' --output text 2>/dev/null || echo "0")
        
        if [ "$dashboards" -gt 0 ]; then
            log_success "CloudWatch dashboards found in $region ($dashboards dashboards)"
        else
            log_warning "No CloudWatch dashboards found in $region"
        fi
    done
}

# ==================== SECURITY HEALTH CHECKS ====================

check_security_groups() {
    log "Checking security group configurations..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        # Check for overly permissive security groups
        local open_sg_count=$(aws ec2 describe-security-groups --region "$region" \
            --query 'SecurityGroups[?IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`] && (FromPort==`22` || FromPort==`3389` || FromPort==`80` || FromPort==`443`)]] | length(@)' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$open_sg_count" -eq 0 ]; then
            log_success "Security group check passed in $region (no overly permissive groups)"
        else
            log_warning "Found $open_sg_count potentially risky security groups in $region"
        fi
        
        # Check default security groups
        increment_total
        local default_sgs=$(aws ec2 describe-security-groups --region "$region" \
            --group-names "default" \
            --query 'SecurityGroups[?IpPermissions != `[]` || IpPermissionsEgress[?IpRanges[?CidrIp==`0.0.0.0/0`] && IpProtocol==`-1`] | []]' \
            --output text 2>/dev/null || echo "")
        
        if [ -z "$default_sgs" ]; then
            log_success "Default security groups properly configured in $region"
        else
            log_warning "Default security groups have rules in $region"
        fi
    done
}

check_ssl_certificates() {
    log "Checking SSL certificate health..."
    
    for region in "${REGIONS[@]}"; do
        increment_total
        
        local certificates=$(aws acm list-certificates --region "$region" \
            --query 'CertificateSummaryList[?Status==`ISSUED`].[CertificateArn,DomainName]' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$certificates" ]; then
            local expiring_soon=0
            local total_certs=0
            
            while IFS=$'\t' read -r cert_arn domain_name; do
                ((total_certs++))
                
                local not_after=$(aws acm describe-certificate --region "$region" \
                    --certificate-arn "$cert_arn" \
                    --query 'Certificate.NotAfter' --output text 2>/dev/null || echo "")
                
                if [ -n "$not_after" ]; then
                    local expiry_epoch=$(date -d "$not_after" +%s 2>/dev/null || echo "0")
                    local now_epoch=$(date +%s)
                    local days_until_expiry=$(( (expiry_epoch - now_epoch) / 86400 ))
                    
                    if [ $days_until_expiry -lt 30 ]; then
                        ((expiring_soon++))
                        log_warning "Certificate for $domain_name expires in $days_until_expiry days"
                    fi
                fi
            done <<< "$certificates"
            
            if [ $expiring_soon -eq 0 ]; then
                log_success "SSL certificate health check passed in $region ($total_certs certificates, none expiring soon)"
            else
                log_warning "SSL certificates expiring soon in $region ($expiring_soon/$total_certs)"
            fi
        else
            log_warning "No SSL certificates found in $region"
        fi
    done
}

# ==================== STORAGE HEALTH CHECKS ====================

check_s3_health() {
    log "Checking S3 bucket health..."
    
    increment_total
    
    local buckets=$(aws s3api list-buckets --query 'Buckets[].Name' --output text 2>/dev/null || echo "")
    
    if [ -n "$buckets" ]; then
        local healthy_buckets=0
        local total_buckets=0
        
        for bucket in $buckets; do
            ((total_buckets++))
            
            # Check bucket accessibility
            if aws s3api head-bucket --bucket "$bucket" >/dev/null 2>&1; then
                ((healthy_buckets++))
                
                # Check bucket versioning and encryption
                local versioning=$(aws s3api get-bucket-versioning --bucket "$bucket" \
                    --query 'Status' --output text 2>/dev/null || echo "Disabled")
                
                local encryption=$(aws s3api get-bucket-encryption --bucket "$bucket" \
                    --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
                    --output text 2>/dev/null || echo "None")
                
                if [ "$encryption" != "None" ]; then
                    log_info "Bucket $bucket: versioning=$versioning, encryption=$encryption"
                else
                    log_warning "Bucket $bucket has no encryption enabled"
                fi
            else
                log_error "Cannot access bucket $bucket"
            fi
        done
        
        if [ $healthy_buckets -eq $total_buckets ] && [ $total_buckets -gt 0 ]; then
            log_success "S3 bucket health check passed ($healthy_buckets/$total_buckets accessible)"
        elif [ $healthy_buckets -gt 0 ]; then
            log_warning "Some S3 buckets inaccessible ($healthy_buckets/$total_buckets accessible)"
        else
            log_error "All S3 buckets inaccessible"
        fi
    else
        log_warning "No S3 buckets found"
    fi
}

# ==================== ENDPOINT HEALTH CHECKS ====================

check_application_endpoints() {
    log "Checking application endpoint health..."
    
    # Define critical endpoints to check
    local endpoints=(
        "https://zenith.engineer/health"
        "https://api.zenith.engineer/health"
        "https://zenith.engineer/api/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        increment_total
        
        local response=$(curl -s -w "%{http_code}|%{time_total}" -o /dev/null "$endpoint" 2>/dev/null || echo "000|0")
        local http_code=$(echo "$response" | cut -d'|' -f1)
        local response_time=$(echo "$response" | cut -d'|' -f2)
        
        if [[ "$http_code" =~ ^[23] ]]; then
            if (( $(echo "$response_time < 2.0" | bc -l) )); then
                log_success "Endpoint $endpoint healthy (HTTP $http_code, ${response_time}s)"
            else
                log_warning "Endpoint $endpoint slow (HTTP $http_code, ${response_time}s)"
            fi
        else
            log_error "Endpoint $endpoint unhealthy (HTTP $http_code)"
        fi
    done
}

# ==================== REPORTING FUNCTIONS ====================

generate_health_report() {
    log "Generating health check report..."
    
    mkdir -p "$RESULTS_DIR"
    local report_file="$RESULTS_DIR/health_check_$TIMESTAMP.md"
    local json_file="$RESULTS_DIR/health_check_$TIMESTAMP.json"
    
    # Calculate health percentage
    local health_percentage=0
    if [ $TOTAL_CHECKS -gt 0 ]; then
        health_percentage=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
    fi
    
    # Determine overall status
    local overall_status="HEALTHY"
    if [ $FAILED_CHECKS -gt 0 ]; then
        overall_status="CRITICAL"
    elif [ $WARNING_CHECKS -gt $((TOTAL_CHECKS / 4)) ]; then
        overall_status="DEGRADED"
    elif [ $WARNING_CHECKS -gt 0 ]; then
        overall_status="WARNING"
    fi
    
    # Generate Markdown report
    cat > "$report_file" << EOF
# Infrastructure Health Check Report

**Date:** $(date)  
**Environment:** $ENVIRONMENT  
**Overall Status:** $overall_status  
**Health Score:** $health_percentage%  

## Summary

- **Total Checks:** $TOTAL_CHECKS
- **Passed:** $PASSED_CHECKS (${GREEN}✅${NC})
- **Warnings:** $WARNING_CHECKS (${YELLOW}⚠️${NC})
- **Failed:** $FAILED_CHECKS (${RED}❌${NC})

## Health Categories

$(for category in "${!HEALTH_CATEGORIES[@]}"; do
    echo "### $category"
    echo "${HEALTH_CATEGORIES[$category]}"
    echo ""
done)

## Recommendations

$(if [ $FAILED_CHECKS -gt 0 ]; then
    echo "### Critical Issues"
    echo "- $FAILED_CHECKS critical issues require immediate attention"
    echo "- Review failed checks and implement fixes"
    echo ""
fi)

$(if [ $WARNING_CHECKS -gt 0 ]; then
    echo "### Warnings"
    echo "- $WARNING_CHECKS warnings detected"
    echo "- Monitor these issues and plan improvements"
    echo ""
fi)

### Next Steps

1. Address any critical issues immediately
2. Plan remediation for warnings
3. Set up automated monitoring for detected issues
4. Schedule regular health checks
5. Review and update health check thresholds

## Technical Details

- Script: $0
- Timestamp: $TIMESTAMP
- Regions Checked: ${REGIONS[*]}
- Results Directory: $RESULTS_DIR

EOF

    # Generate JSON report
    cat > "$json_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "environment": "$ENVIRONMENT",
  "overall_status": "$overall_status",
  "health_percentage": $health_percentage,
  "summary": {
    "total_checks": $TOTAL_CHECKS,
    "passed_checks": $PASSED_CHECKS,
    "warning_checks": $WARNING_CHECKS,
    "failed_checks": $FAILED_CHECKS
  },
  "regions_checked": [$(printf '"%s",' "${REGIONS[@]}" | sed 's/,$//')]
}
EOF

    log_success "Health check reports generated:"
    log_success "  Markdown: $report_file"
    log_success "  JSON: $json_file"
    
    # Show summary
    echo
    echo "========================================"
    echo "       HEALTH CHECK SUMMARY"
    echo "========================================"
    echo "Overall Status: $overall_status"
    echo "Health Score: $health_percentage%"
    echo "Passed: $PASSED_CHECKS | Warnings: $WARNING_CHECKS | Failed: $FAILED_CHECKS"
    echo "========================================"
    echo
}

# ==================== MAIN EXECUTION ====================

show_health_check_banner() {
    echo
    echo "========================================"
    echo "    INFRASTRUCTURE HEALTH CHECK"
    echo "========================================"
    echo "Environment: $ENVIRONMENT"
    echo "Regions: ${REGIONS[*]}"
    echo "Timestamp: $TIMESTAMP"
    echo "========================================"
    echo
}

main() {
    show_health_check_banner
    
    # Initialize counters
    TOTAL_CHECKS=0
    PASSED_CHECKS=0
    FAILED_CHECKS=0
    WARNING_CHECKS=0
    
    # Run health checks
    log "Starting comprehensive infrastructure health check..."
    
    # Networking checks
    log "=== NETWORKING HEALTH CHECKS ==="
    check_vpc_health
    check_load_balancer_health
    
    # Compute checks
    log "=== COMPUTE HEALTH CHECKS ==="
    check_ecs_health
    check_autoscaling_health
    
    # Database checks
    log "=== DATABASE HEALTH CHECKS ==="
    check_rds_health
    check_elasticache_health
    
    # CDN checks
    log "=== CDN HEALTH CHECKS ==="
    check_cloudfront_health
    
    # Monitoring checks
    log "=== MONITORING HEALTH CHECKS ==="
    check_cloudwatch_health
    
    # Security checks
    log "=== SECURITY HEALTH CHECKS ==="
    check_security_groups
    check_ssl_certificates
    
    # Storage checks
    log "=== STORAGE HEALTH CHECKS ==="
    check_s3_health
    
    # Endpoint checks
    log "=== ENDPOINT HEALTH CHECKS ==="
    check_application_endpoints
    
    # Generate reports
    generate_health_report
    
    # Exit with appropriate code
    if [ $FAILED_CHECKS -gt 0 ]; then
        exit 1
    elif [ $WARNING_CHECKS -gt $((TOTAL_CHECKS / 2)) ]; then
        exit 2
    else
        exit 0
    fi
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env ENV    Set environment (default: production)"
            echo "  --help       Show this help message"
            echo ""
            echo "Exit codes:"
            echo "  0  All checks passed"
            echo "  1  Critical issues found"
            echo "  2  Many warnings found"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Execute main function
main "$@"