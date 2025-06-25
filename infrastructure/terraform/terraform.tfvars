# Zenith Global Scale Infrastructure Configuration
# Production Environment Variables

environment  = "production"
project_name = "zenith"

# Multi-region deployment configuration
regions = [
  "us-east-1",      # Primary - North America East
  "us-west-2",      # Secondary - North America West  
  "eu-west-1",      # Europe - GDPR compliance
  "ap-southeast-1", # Asia Pacific - Singapore
  "ap-northeast-1"  # Asia Pacific - Tokyo
]

# Auto-scaling configuration for enterprise scale
auto_scaling_config = {
  min_capacity  = 3      # Minimum instances per region
  max_capacity  = 200    # Maximum instances per region
  target_cpu    = 70     # Target CPU utilization %
  target_memory = 80     # Target memory utilization %
}

# Database configuration
database_config = {
  engine_version          = "15.4"
  instance_class         = "db.r6g.2xlarge"
  allocated_storage      = 1000
  max_allocated_storage  = 10000
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  deletion_protection    = true
  
  # Performance insights
  performance_insights_enabled = true
  performance_insights_retention_period = 93
  
  # Monitoring
  monitoring_interval = 60
  enabled_cloudwatch_logs_exports = ["postgresql"]
}

# Cache configuration
cache_config = {
  node_type                = "cache.r7g.xlarge"
  num_cache_clusters      = 3
  parameter_group_name    = "default.redis7"
  engine_version          = "7.0"
  port                    = 6379
  
  # Backup configuration
  snapshot_retention_limit = 30
  snapshot_window         = "03:00-05:00"
  
  # Maintenance
  maintenance_window = "sun:05:00-sun:06:00"
  
  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = true
}

# Load balancer configuration
load_balancer_config = {
  internal                   = false
  load_balancer_type        = "application"
  enable_deletion_protection = true
  enable_http2              = true
  idle_timeout              = 60
  
  # Health check configuration
  health_check = {
    enabled             = true
    path               = "/api/health"
    port               = "traffic-port"
    protocol           = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout            = 5
    interval           = 30
    matcher            = "200"
  }
  
  # Stickiness
  stickiness = {
    enabled         = false
    type           = "lb_cookie"
    cookie_duration = 86400
  }
}

# CDN configuration
cdn_config = {
  price_class                = "PriceClass_All"
  minimum_protocol_version   = "TLSv1.2_2021"
  ssl_support_method        = "sni-only"
  
  # Caching configuration
  default_cache_behavior = {
    target_origin_id         = "primary"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods         = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods          = ["GET", "HEAD"]
    compress               = true
    
    # TTL settings
    default_ttl = 300
    min_ttl     = 0
    max_ttl     = 31536000
    
    # Forward headers
    forward_headers = ["Authorization", "CloudFront-Forwarded-Proto"]
  }
  
  # Additional cache behaviors
  ordered_cache_behaviors = [
    {
      path_pattern           = "/api/*"
      target_origin_id       = "primary"
      viewer_protocol_policy = "https-only"
      allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods         = ["GET", "HEAD"]
      compress              = true
      default_ttl           = 0
      min_ttl               = 0
      max_ttl               = 0
      forward_headers       = ["*"]
    },
    {
      path_pattern           = "/_next/static/*"
      target_origin_id       = "primary"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD"]
      cached_methods         = ["GET", "HEAD"]
      compress              = true
      default_ttl           = 31536000
      min_ttl               = 31536000
      max_ttl               = 31536000
      forward_headers       = []
    }
  ]
}

# Monitoring configuration
monitoring_config = {
  # CloudWatch configuration
  cloudwatch = {
    retention_in_days = 90
    log_group_class  = "STANDARD"
  }
  
  # Metrics collection
  detailed_monitoring = true
  
  # Alarms configuration
  alarms = {
    cpu_utilization_threshold    = 80
    memory_utilization_threshold = 85
    disk_utilization_threshold   = 90
    error_rate_threshold        = 5
    response_time_threshold     = 2000
    
    # Database alarms
    db_cpu_threshold            = 75
    db_connection_threshold     = 80
    db_freeable_memory_threshold = 104857600 # 100MB
    
    # Cache alarms
    cache_cpu_threshold         = 80
    cache_memory_threshold      = 90
    cache_evictions_threshold   = 1000
  }
  
  # Notification endpoints
  notification_endpoints = [
    "ops-team@zenith.engineer",
    "arn:aws:sns:us-east-1:123456789012:zenith-alerts"
  ]
}

# Security configuration
security_config = {
  # WAF configuration
  waf = {
    enabled = true
    rules = [
      "AWSManagedRulesCommonRuleSet",
      "AWSManagedRulesKnownBadInputsRuleSet",
      "AWSManagedRulesSQLiRuleSet",
      "AWSManagedRulesLinuxRuleSet",
      "AWSManagedRulesUnixRuleSet",
      "AWSManagedRulesAmazonIpReputationList",
      "AWSManagedRulesAnonymousIpList"
    ]
    
    # Rate limiting
    rate_limit = {
      enabled = true
      limit   = 2000
      window  = 300 # 5 minutes
    }
    
    # Geo blocking (optional)
    geo_blocking = {
      enabled = false
      blocked_countries = []
    }
  }
  
  # Shield Advanced for DDoS protection
  shield = {
    enabled = true
    emergency_contact = {
      email_address = "security@zenith.engineer"
      phone_number  = "+1-555-0123"
      contact_notes = "24/7 security team"
    }
  }
  
  # Certificate configuration
  certificate = {
    domain_name               = "zenith.engineer"
    subject_alternative_names = ["*.zenith.engineer", "api.zenith.engineer"]
    validation_method        = "DNS"
  }
  
  # KMS encryption
  kms = {
    enabled                = true
    key_rotation_enabled   = true
    deletion_window_in_days = 30
  }
}

# Cost optimization configuration
cost_optimization = {
  # Auto-scaling schedule for non-production hours
  scheduled_scaling = {
    enabled = true
    scale_down = {
      recurrence = "0 18 * * MON-FRI"  # 6 PM weekdays
      min_size   = 1
      max_size   = 10
      desired_capacity = 2
    }
    scale_up = {
      recurrence = "0 8 * * MON-FRI"   # 8 AM weekdays
      min_size   = 3
      max_size   = 200
      desired_capacity = 5
    }
  }
  
  # Spot instance configuration
  spot_instances = {
    enabled                = true
    spot_allocation_strategy = "diversified"
    spot_instance_pools    = 3
    on_demand_percentage   = 20  # 20% on-demand, 80% spot
  }
  
  # Storage optimization
  storage = {
    # S3 lifecycle policies
    s3_lifecycle = {
      enabled = true
      transitions = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        },
        {
          days          = 365
          storage_class = "DEEP_ARCHIVE"
        }
      ]
    }
    
    # EBS optimization
    ebs_optimization = {
      enabled = true
      volume_type = "gp3"
      iops = 3000
      throughput = 125
    }
  }
}

# Compliance configuration
compliance_config = {
  # GDPR settings for EU regions
  gdpr = {
    enabled = true
    data_retention_days = 1825  # 5 years
    right_to_erasure_enabled = true
    data_portability_enabled = true
    consent_management_enabled = true
  }
  
  # SOC2 compliance
  soc2 = {
    enabled = true
    audit_logging_enabled = true
    encryption_at_rest_required = true
    encryption_in_transit_required = true
    access_logging_enabled = true
  }
  
  # HIPAA (if applicable)
  hipaa = {
    enabled = false
    baa_required = false
  }
  
  # PCI DSS (if handling payments)
  pci_dss = {
    enabled = true
    level = 1
    tokenization_required = true
    network_segmentation_required = true
  }
}