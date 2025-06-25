#!/bin/bash

# Global Infrastructure Deployment Script
# Enterprise-grade multi-region deployment automation
# Version: 1.0.0

set -euo pipefail

# ==================== CONFIGURATION ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
DRY_RUN="${DRY_RUN:-false}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"
PARALLEL_DEPLOYMENT="${PARALLEL_DEPLOYMENT:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
REGIONS=(
    "us-east-1"
    "us-west-2" 
    "eu-west-1"
    "ap-southeast-1"
    "ap-northeast-1"
)

DEPLOYMENT_STEPS=(
    "validate"
    "plan"
    "networking"
    "security"
    "databases"
    "compute"
    "cdn"
    "monitoring"
    "verification"
)

# ==================== UTILITY FUNCTIONS ====================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

check_dependencies() {
    log "Checking deployment dependencies..."
    
    local missing_deps=()
    
    # Check for required tools
    command -v terraform >/dev/null 2>&1 || missing_deps+=("terraform")
    command -v aws >/dev/null 2>&1 || missing_deps+=("aws-cli")
    command -v jq >/dev/null 2>&1 || missing_deps+=("jq")
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install missing dependencies and try again"
        exit 1
    fi
    
    # Check Terraform version
    local terraform_version=$(terraform version -json | jq -r '.terraform_version')
    local required_version="1.5.0"
    
    if ! command -v dpkg >/dev/null 2>&1 || ! dpkg --compare-versions "$terraform_version" "ge" "$required_version"; then
        log_warning "Terraform version $terraform_version may not be compatible (required: $required_version+)"
    fi
    
    log_success "All dependencies satisfied"
}

check_aws_credentials() {
    log "Verifying AWS credentials..."
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured or invalid"
        log_error "Please run 'aws configure' or set AWS environment variables"
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local user_arn=$(aws sts get-caller-identity --query Arn --output text)
    
    log_success "AWS credentials valid - Account: $account_id, User: $user_arn"
}

initialize_terraform() {
    log "Initializing Terraform configuration..."
    
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    if ! terraform init -upgrade; then
        log_error "Terraform initialization failed"
        exit 1
    fi
    
    # Select or create workspace
    if terraform workspace list | grep -q "$DEPLOYMENT_ENV"; then
        terraform workspace select "$DEPLOYMENT_ENV"
    else
        terraform workspace new "$DEPLOYMENT_ENV"
    fi
    
    log_success "Terraform initialized for environment: $DEPLOYMENT_ENV"
}

# ==================== VALIDATION FUNCTIONS ====================

validate_configuration() {
    log "Validating deployment configuration..."
    
    cd "$TERRAFORM_DIR"
    
    # Validate Terraform configuration
    if ! terraform validate; then
        log_error "Terraform configuration validation failed"
        exit 1
    fi
    
    # Check for required variables
    if [ ! -f "terraform.tfvars" ] && [ ! -f "$DEPLOYMENT_ENV.tfvars" ]; then
        log_error "No terraform variables file found (terraform.tfvars or $DEPLOYMENT_ENV.tfvars)"
        exit 1
    fi
    
    # Validate AWS regions
    for region in "${REGIONS[@]}"; do
        if ! aws ec2 describe-regions --region-names "$region" >/dev/null 2>&1; then
            log_error "Invalid AWS region: $region"
            exit 1
        fi
    done
    
    log_success "Configuration validation passed"
}

generate_deployment_plan() {
    log "Generating deployment plan..."
    
    cd "$TERRAFORM_DIR"
    
    local plan_file="deployment-plan-$DEPLOYMENT_ENV.tfplan"
    local vars_file=""
    
    # Use environment-specific vars file if it exists
    if [ -f "$DEPLOYMENT_ENV.tfvars" ]; then
        vars_file="-var-file=$DEPLOYMENT_ENV.tfvars"
    elif [ -f "terraform.tfvars" ]; then
        vars_file="-var-file=terraform.tfvars"
    fi
    
    # Generate plan
    if ! terraform plan $vars_file -out="$plan_file"; then
        log_error "Terraform plan generation failed"
        exit 1
    fi
    
    # Show plan summary
    terraform show -no-color "$plan_file" | grep -E "(Plan:|Changes to Outputs:)" || true
    
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN MODE - Deployment plan generated but not executed"
        return 0
    fi
    
    log_success "Deployment plan generated: $plan_file"
}

# ==================== DEPLOYMENT FUNCTIONS ====================

deploy_networking() {
    log "Deploying networking infrastructure..."
    
    local start_time=$(date +%s)
    
    # Deploy VPCs, subnets, and networking components
    terraform apply -target=module.vpc_us_east -auto-approve
    terraform apply -target=module.vpc_us_west -auto-approve
    terraform apply -target=module.vpc_eu_west -auto-approve
    
    # Deploy VPC peering and transit gateways
    terraform apply -target=aws_vpc_peering_connection -auto-approve || true
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Networking deployment completed in ${duration}s"
}

deploy_security() {
    log "Deploying security infrastructure..."
    
    local start_time=$(date +%s)
    
    # Deploy security groups, NACLs, and WAF
    terraform apply -target=module.security_stack -auto-approve
    
    # Deploy KMS keys and IAM roles
    terraform apply -target=aws_kms_key -auto-approve
    terraform apply -target=aws_iam_role -auto-approve
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Security deployment completed in ${duration}s"
}

deploy_databases() {
    log "Deploying database infrastructure..."
    
    local start_time=$(date +%s)
    
    # Deploy RDS global clusters
    terraform apply -target=module.rds_global_cluster -auto-approve
    
    # Deploy Redis clusters
    terraform apply -target=module.redis_global -auto-approve
    
    # Wait for databases to be available
    log "Waiting for databases to become available..."
    sleep 30
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Database deployment completed in ${duration}s"
}

deploy_compute() {
    log "Deploying compute infrastructure..."
    
    local start_time=$(date +%s)
    
    # Deploy ECS clusters
    terraform apply -target=module.ecs_clusters -auto-approve
    
    # Deploy load balancers
    terraform apply -target=module.global_load_balancer -auto-approve
    
    # Deploy auto-scaling configurations
    terraform apply -target=aws_autoscaling_group -auto-approve
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Compute deployment completed in ${duration}s"
}

deploy_cdn() {
    log "Deploying CDN and edge infrastructure..."
    
    local start_time=$(date +%s)
    
    # Deploy CloudFront distributions
    terraform apply -target=module.cloudfront_distribution -auto-approve
    
    # Deploy edge functions
    terraform apply -target=aws_cloudfront_function -auto-approve || true
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "CDN deployment completed in ${duration}s"
}

deploy_monitoring() {
    log "Deploying monitoring infrastructure..."
    
    local start_time=$(date +%s)
    
    # Deploy CloudWatch resources
    terraform apply -target=module.monitoring_stack -auto-approve
    
    # Deploy alarms and dashboards
    terraform apply -target=aws_cloudwatch_dashboard -auto-approve
    terraform apply -target=aws_cloudwatch_metric_alarm -auto-approve
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Monitoring deployment completed in ${duration}s"
}

# ==================== VERIFICATION FUNCTIONS ====================

verify_deployment() {
    log "Verifying deployment..."
    
    local failed_checks=0
    
    # Check infrastructure health
    log "Checking infrastructure health..."
    
    # Verify VPCs
    for region in "${REGIONS[@]}"; do
        if aws ec2 describe-vpcs --region "$region" --filters "Name=tag:Project,Values=zenith" >/dev/null 2>&1; then
            log_success "VPC verified in $region"
        else
            log_error "VPC verification failed in $region"
            ((failed_checks++))
        fi
    done
    
    # Verify load balancers
    for region in "${REGIONS[@]}"; do
        if aws elbv2 describe-load-balancers --region "$region" >/dev/null 2>&1; then
            local lb_count=$(aws elbv2 describe-load-balancers --region "$region" --query 'LoadBalancers | length(@)')
            if [ "$lb_count" -gt 0 ]; then
                log_success "Load balancers verified in $region ($lb_count found)"
            else
                log_warning "No load balancers found in $region"
            fi
        else
            log_error "Load balancer verification failed in $region"
            ((failed_checks++))
        fi
    done
    
    # Verify databases
    log "Checking database connectivity..."
    if aws rds describe-global-clusters >/dev/null 2>&1; then
        local cluster_count=$(aws rds describe-global-clusters --query 'GlobalClusters | length(@)')
        if [ "$cluster_count" -gt 0 ]; then
            log_success "RDS global clusters verified ($cluster_count found)"
        else
            log_warning "No RDS global clusters found"
        fi
    else
        log_error "RDS verification failed"
        ((failed_checks++))
    fi
    
    # Verify CloudFront
    log "Checking CDN distribution..."
    if aws cloudfront list-distributions >/dev/null 2>&1; then
        local dist_count=$(aws cloudfront list-distributions --query 'DistributionList.Items | length(@)')
        if [ "$dist_count" -gt 0 ]; then
            log_success "CloudFront distributions verified ($dist_count found)"
        else
            log_warning "No CloudFront distributions found"
        fi
    else
        log_error "CloudFront verification failed"
        ((failed_checks++))
    fi
    
    # Health check endpoints
    log "Performing health checks..."
    
    # Get load balancer DNS names
    local health_endpoints=()
    for region in "${REGIONS[@]}"; do
        local dns_names=$(aws elbv2 describe-load-balancers --region "$region" --query 'LoadBalancers[].DNSName' --output text 2>/dev/null || true)
        if [ -n "$dns_names" ]; then
            for dns_name in $dns_names; do
                health_endpoints+=("https://$dns_name/health")
            done
        fi
    done
    
    # Test health endpoints
    for endpoint in "${health_endpoints[@]}"; do
        if curl -s -o /dev/null -w "%{http_code}" "$endpoint" | grep -q "200"; then
            log_success "Health check passed: $endpoint"
        else
            log_warning "Health check failed: $endpoint"
        fi
    done
    
    if [ $failed_checks -eq 0 ]; then
        log_success "All deployment verifications passed"
    else
        log_error "$failed_checks verification(s) failed"
        return 1
    fi
}

# ==================== ROLLBACK FUNCTIONS ====================

create_rollback_plan() {
    log "Creating rollback plan..."
    
    local rollback_dir="$PROJECT_ROOT/deployment-rollbacks"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local rollback_file="$rollback_dir/rollback_${DEPLOYMENT_ENV}_${timestamp}.json"
    
    mkdir -p "$rollback_dir"
    
    # Capture current state
    cd "$TERRAFORM_DIR"
    terraform show -json > "$rollback_file"
    
    log_success "Rollback plan created: $rollback_file"
}

# ==================== MAIN DEPLOYMENT ORCHESTRATION ====================

show_deployment_banner() {
    echo
    echo "=================================================================="
    echo "           ZENITH GLOBAL INFRASTRUCTURE DEPLOYMENT"
    echo "=================================================================="
    echo "Environment: $DEPLOYMENT_ENV"
    echo "Regions: ${REGIONS[*]}"
    echo "Dry Run: $DRY_RUN"
    echo "Parallel: $PARALLEL_DEPLOYMENT"
    echo "=================================================================="
    echo
}

execute_deployment() {
    local deployment_start=$(date +%s)
    
    log "Starting global infrastructure deployment..."
    
    # Create rollback plan before deployment
    create_rollback_plan
    
    if [ "$PARALLEL_DEPLOYMENT" = "true" ]; then
        log "Executing parallel deployment..."
        
        # Deploy networking in parallel across regions
        (deploy_networking) &
        
        # Wait for networking to complete before proceeding
        wait
        
        # Deploy other components in parallel
        (deploy_security) &
        (deploy_databases) &
        
        wait
        
        (deploy_compute) &
        (deploy_cdn) &
        (deploy_monitoring) &
        
        wait
        
    else
        log "Executing sequential deployment..."
        
        # Sequential deployment for better error handling
        deploy_networking
        deploy_security  
        deploy_databases
        deploy_compute
        deploy_cdn
        deploy_monitoring
    fi
    
    # Always run verification sequentially
    verify_deployment
    
    local deployment_end=$(date +%s)
    local total_duration=$((deployment_end - deployment_start))
    
    log_success "Global infrastructure deployment completed in ${total_duration}s"
}

# ==================== CLEANUP AND REPORTING ====================

generate_deployment_report() {
    log "Generating deployment report..."
    
    local report_dir="$PROJECT_ROOT/deployment-reports"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="$report_dir/deployment_${DEPLOYMENT_ENV}_${timestamp}.md"
    
    mkdir -p "$report_dir"
    
    cat > "$report_file" << EOF
# Global Infrastructure Deployment Report

**Environment:** $DEPLOYMENT_ENV  
**Date:** $(date)  
**Duration:** ${total_duration:-0}s  

## Regions Deployed
$(printf "- %s\n" "${REGIONS[@]}")

## Infrastructure Components

### Networking
- VPCs: $(aws ec2 describe-vpcs --query 'Vpcs | length(@)' 2>/dev/null || echo "N/A")
- Subnets: $(aws ec2 describe-subnets --query 'Subnets | length(@)' 2>/dev/null || echo "N/A")

### Compute
- ECS Clusters: $(aws ecs list-clusters --query 'clusterArns | length(@)' 2>/dev/null || echo "N/A")
- Load Balancers: $(aws elbv2 describe-load-balancers --query 'LoadBalancers | length(@)' 2>/dev/null || echo "N/A")

### Databases
- RDS Clusters: $(aws rds describe-db-clusters --query 'DBClusters | length(@)' 2>/dev/null || echo "N/A")
- ElastiCache Clusters: $(aws elasticache describe-cache-clusters --query 'CacheClusters | length(@)' 2>/dev/null || echo "N/A")

### CDN
- CloudFront Distributions: $(aws cloudfront list-distributions --query 'DistributionList.Items | length(@)' 2>/dev/null || echo "N/A")

## Terraform Outputs
\`\`\`
$(cd "$TERRAFORM_DIR" && terraform output 2>/dev/null || echo "No outputs available")
\`\`\`

## Next Steps
1. Configure application deployment
2. Set up monitoring alerts
3. Test disaster recovery procedures
4. Review security configurations
5. Optimize costs based on usage patterns

EOF

    log_success "Deployment report generated: $report_file"
}

cleanup_deployment_artifacts() {
    log "Cleaning up deployment artifacts..."
    
    cd "$TERRAFORM_DIR"
    
    # Clean up plan files older than 7 days
    find . -name "*.tfplan" -type f -mtime +7 -delete 2>/dev/null || true
    
    # Clean up temporary files
    rm -f .terraform.lock.hcl.tmp 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# ==================== ERROR HANDLING ====================

handle_deployment_error() {
    local exit_code=$?
    local line_number=$1
    
    log_error "Deployment failed at line $line_number with exit code $exit_code"
    
    # Capture error context
    log "Capturing error context..."
    
    # Save Terraform state
    cd "$TERRAFORM_DIR"
    terraform show > "error_state_$(date +%Y%m%d_%H%M%S).txt" 2>/dev/null || true
    
    # Show recent Terraform logs
    log "Recent Terraform operations:"
    tail -n 20 .terraform/terraform.log 2>/dev/null || log "No Terraform logs available"
    
    log_error "Deployment aborted. Check logs and error state files for details."
    
    exit $exit_code
}

# Set error trap
trap 'handle_deployment_error $LINENO' ERR

# ==================== MAIN EXECUTION ====================

main() {
    show_deployment_banner
    
    # Pre-deployment checks
    if [ "$SKIP_VALIDATION" != "true" ]; then
        check_dependencies
        check_aws_credentials
        validate_configuration
    fi
    
    # Initialize Terraform
    initialize_terraform
    
    # Generate and optionally execute deployment plan
    generate_deployment_plan
    
    if [ "$DRY_RUN" != "true" ]; then
        # Execute deployment
        execute_deployment
        
        # Post-deployment tasks
        generate_deployment_report
        cleanup_deployment_artifacts
        
        log_success "🎉 Global infrastructure deployment completed successfully!"
        log "Next steps:"
        log "1. Configure application deployment"
        log "2. Set up monitoring and alerting"
        log "3. Test disaster recovery procedures"
        log "4. Review and optimize costs"
    fi
}

# ==================== SCRIPT ENTRY POINT ====================

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --parallel)
            PARALLEL_DEPLOYMENT=true
            shift
            ;;
        --env)
            DEPLOYMENT_ENV="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run          Generate plan without executing"
            echo "  --skip-validation  Skip pre-deployment validation"
            echo "  --parallel         Enable parallel deployment"
            echo "  --env ENV          Set deployment environment"
            echo "  --help             Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  DEPLOYMENT_ENV     Deployment environment (default: production)"
            echo "  DRY_RUN           Dry run mode (default: false)"
            echo "  SKIP_VALIDATION   Skip validation (default: false)"
            echo "  PARALLEL_DEPLOYMENT Parallel deployment (default: false)"
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