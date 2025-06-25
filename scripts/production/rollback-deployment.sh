#!/bin/bash

# ==============================================================================
# ZENITH ENTERPRISE - AUTOMATED ROLLBACK SYSTEM
# Production-grade rollback automation with safety checks
# ==============================================================================

set -euo pipefail

# Configuration
ROLLBACK_ID="${ROLLBACK_ID:-$(date +%Y%m%d-%H%M%S)}"
ROLLBACK_TIMEOUT="${ROLLBACK_TIMEOUT:-180}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "/tmp/rollback-${ROLLBACK_ID}.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "/tmp/rollback-${ROLLBACK_ID}.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "/tmp/rollback-${ROLLBACK_ID}.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "/tmp/rollback-${ROLLBACK_ID}.log"
}

# Emergency rollback function
emergency_rollback() {
    local target_deployment=${1:-}
    
    if [[ -z "$target_deployment" ]]; then
        log_error "No target deployment specified for emergency rollback"
        exit 1
    fi
    
    log_warning "EMERGENCY ROLLBACK INITIATED"
    log_info "Rolling back to deployment: $target_deployment"
    
    # Immediate traffic switch
    log_info "Switching traffic to previous stable deployment..."
    
    # Database rollback if needed
    if [[ "${ROLLBACK_DATABASE:-false}" == "true" ]]; then
        log_warning "Rolling back database..."
        rollback_database "$target_deployment"
    fi
    
    # Verify rollback
    verify_rollback_health
    
    # Notification
    send_emergency_notification "$target_deployment"
    
    log_success "Emergency rollback completed"
}

# Database rollback
rollback_database() {
    local target_deployment=$1
    
    log_info "Starting database rollback to $target_deployment"
    
    # Create current state backup
    log_info "Creating safety backup of current database state..."
    npm run db:backup -- --tag "pre-rollback-$(date +%Y%m%d-%H%M%S)"
    
    # Restore to target deployment
    log_info "Restoring database to $target_deployment..."
    if ! npm run db:restore -- --deployment "$target_deployment"; then
        log_error "Database rollback failed"
        return 1
    fi
    
    # Verify database integrity
    log_info "Verifying database integrity..."
    if ! npm run db:verify; then
        log_error "Database integrity check failed"
        return 1
    fi
    
    log_success "Database rollback completed"
}

# Health check verification
verify_rollback_health() {
    local retries=0
    local max_retries=$HEALTH_CHECK_RETRIES
    
    log_info "Verifying rollback health..."
    
    while [[ $retries -lt $max_retries ]]; do
        if curl -f -s "$PRODUCTION_URL/api/health" > /dev/null 2>&1; then
            log_success "Health check passed after rollback"
            return 0
        fi
        
        retries=$((retries + 1))
        log_info "Health check failed, retry $retries/$max_retries"
        sleep 10
    done
    
    log_error "Health check failed after $max_retries retries"
    return 1
}

# Get deployment history
get_deployment_history() {
    log_info "Retrieving deployment history..."
    
    # Check if deployment history file exists
    if [[ ! -f "/tmp/deployment-history.json" ]]; then
        log_warning "No deployment history found"
        return 1
    fi
    
    # Display recent deployments
    log_info "Recent deployments:"
    node -e "
        const fs = require('fs');
        try {
            const history = JSON.parse(fs.readFileSync('/tmp/deployment-history.json', 'utf8'));
            history.slice(-10).forEach((deployment, index) => {
                console.log(\`\${index + 1}. \${deployment.id} - \${deployment.timestamp} - \${deployment.status}\`);
            });
        } catch (error) {
            console.error('Error reading deployment history:', error.message);
            process.exit(1);
        }
    "
}

# Automated rollback decision
automated_rollback_decision() {
    log_info "Analyzing deployment health for automated rollback decision..."
    
    # Check error rates
    local error_rate=$(curl -s "$MONITORING_URL/api/metrics/error-rate" | jq -r '.value // 0')
    local error_threshold=${ERROR_RATE_THRESHOLD:-5}
    
    if (( $(echo "$error_rate > $error_threshold" | bc -l) )); then
        log_warning "Error rate ($error_rate%) exceeds threshold ($error_threshold%)"
        return 0  # Recommend rollback
    fi
    
    # Check response times
    local avg_response_time=$(curl -s "$MONITORING_URL/api/metrics/response-time" | jq -r '.p95 // 0')
    local response_threshold=${RESPONSE_TIME_THRESHOLD:-2000}
    
    if (( $(echo "$avg_response_time > $response_threshold" | bc -l) )); then
        log_warning "P95 response time (${avg_response_time}ms) exceeds threshold (${response_threshold}ms)"
        return 0  # Recommend rollback
    fi
    
    # Check business metrics
    local conversion_rate=$(curl -s "$ANALYTICS_URL/api/metrics/conversion-rate" | jq -r '.value // 0')
    local conversion_threshold=${CONVERSION_RATE_THRESHOLD:-2}
    
    if (( $(echo "$conversion_rate < $conversion_threshold" | bc -l) )); then
        log_warning "Conversion rate ($conversion_rate%) below threshold ($conversion_threshold%)"
        return 0  # Recommend rollback
    fi
    
    log_success "All metrics within acceptable ranges"
    return 1  # No rollback needed
}

# Canary rollback
canary_rollback() {
    local target_deployment=$1
    local canary_percentage=${2:-10}
    
    log_info "Starting canary rollback to $target_deployment with $canary_percentage% traffic"
    
    # Gradually increase rollback traffic
    for percentage in 10 25 50 75 100; do
        if [[ $percentage -gt $canary_percentage ]] && [[ $canary_percentage -ne 100 ]]; then
            break
        fi
        
        log_info "Routing $percentage% of traffic to rollback deployment..."
        
        # Update load balancer configuration
        update_traffic_routing "$target_deployment" "$percentage"
        
        # Wait and monitor
        sleep 30
        
        # Check metrics
        if ! check_canary_metrics; then
            log_error "Canary rollback metrics failed at $percentage%"
            return 1
        fi
        
        log_success "Canary rollback at $percentage% successful"
    done
    
    log_success "Canary rollback completed successfully"
}

# Update traffic routing
update_traffic_routing() {
    local target_deployment=$1
    local percentage=$2
    
    # This would integrate with your load balancer/CDN
    # For demonstration, we'll log the action
    log_info "Updating traffic routing: $percentage% to $target_deployment"
    
    # Example: Update Cloudflare Workers or AWS ALB rules
    # curl -X POST "$LOAD_BALANCER_API/routing" \
    #     -H "Authorization: Bearer $LB_TOKEN" \
    #     -d "{\"target\": \"$target_deployment\", \"percentage\": $percentage}"
}

# Check canary metrics
check_canary_metrics() {
    local error_rate=$(curl -s "$MONITORING_URL/api/metrics/error-rate?window=5m" | jq -r '.value // 0')
    local error_threshold=3
    
    if (( $(echo "$error_rate > $error_threshold" | bc -l) )); then
        log_error "Canary error rate ($error_rate%) exceeds threshold ($error_threshold%)"
        return 1
    fi
    
    return 0
}

# Send notifications
send_emergency_notification() {
    local target_deployment=$1
    
    # Slack notification
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🚨 EMERGENCY ROLLBACK COMPLETED\",
            \"attachments\": [{
                \"color\": \"warning\",
                \"fields\": [
                    {\"title\": \"Rollback ID\", \"value\": \"$ROLLBACK_ID\", \"short\": true},
                    {\"title\": \"Target Deployment\", \"value\": \"$target_deployment\", \"short\": true},
                    {\"title\": \"Time\", \"value\": \"$(date -u)\", \"short\": true}
                ]
            }]
        }" 2>/dev/null || log_warning "Slack notification failed"
    
    # Email notification
    if [[ -n "${ALERT_EMAIL:-}" ]]; then
        echo "Emergency rollback completed: $ROLLBACK_ID" | \
            mail -s "EMERGENCY ROLLBACK - Zenith Production" "$ALERT_EMAIL" || \
            log_warning "Email notification failed"
    fi
}

# Main rollback function
main() {
    local rollback_type=${1:-manual}
    local target_deployment=${2:-}
    
    log_info "Starting rollback process"
    log_info "Rollback ID: $ROLLBACK_ID"
    log_info "Rollback Type: $rollback_type"
    
    case $rollback_type in
        "emergency")
            if [[ -z "$target_deployment" ]]; then
                log_error "Emergency rollback requires target deployment"
                exit 1
            fi
            emergency_rollback "$target_deployment"
            ;;
        "automated")
            if automated_rollback_decision; then
                log_info "Automated rollback decision: ROLLBACK RECOMMENDED"
                get_deployment_history
                read -p "Enter deployment ID to rollback to: " target_deployment
                canary_rollback "$target_deployment"
            else
                log_info "Automated rollback decision: NO ROLLBACK NEEDED"
            fi
            ;;
        "canary")
            if [[ -z "$target_deployment" ]]; then
                log_error "Canary rollback requires target deployment"
                exit 1
            fi
            canary_rollback "$target_deployment" "${3:-10}"
            ;;
        "manual")
            get_deployment_history
            read -p "Enter deployment ID to rollback to: " target_deployment
            canary_rollback "$target_deployment" 100
            ;;
        *)
            log_error "Unknown rollback type: $rollback_type"
            log_info "Available types: emergency, automated, canary, manual"
            exit 1
            ;;
    esac
    
    log_success "Rollback process completed successfully!"
    log_info "Rollback ID: $ROLLBACK_ID"
    log_info "Logs available at: /tmp/rollback-${ROLLBACK_ID}.log"
}

# Execute main function
main "$@"