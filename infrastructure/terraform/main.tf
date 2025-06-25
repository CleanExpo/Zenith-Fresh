# Zenith Global Scale Infrastructure
# Enterprise SaaS Multi-Region Deployment
# Terraform Infrastructure as Code

terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.15"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "zenith-terraform-state"
    key            = "global-infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "zenith-terraform-locks"
  }
}

# ==================== VARIABLES ====================

variable "environment" {
  description = "Environment (production, staging, development)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "zenith"
}

variable "regions" {
  description = "AWS regions for multi-region deployment"
  type        = list(string)
  default     = [
    "us-east-1",
    "us-west-2", 
    "eu-west-1",
    "ap-southeast-1",
    "ap-northeast-1"
  ]
}

variable "auto_scaling_config" {
  description = "Auto-scaling configuration"
  type = object({
    min_capacity = number
    max_capacity = number
    target_cpu   = number
    target_memory = number
  })
  default = {
    min_capacity  = 2
    max_capacity  = 100
    target_cpu    = 70
    target_memory = 80
  }
}

# ==================== LOCALS ====================

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    CreatedAt   = timestamp()
  }
}

# ==================== PROVIDERS ====================

provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "us_west"
  region = "us-west-2"
  
  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "eu_west"
  region = "eu-west-1"
  
  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "ap_southeast"
  region = "ap-southeast-1"
  
  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  alias  = "ap_northeast"
  region = "ap-northeast-1"
  
  default_tags {
    tags = local.common_tags
  }
}

# ==================== DATA SOURCES ====================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ==================== NETWORKING ====================

module "vpc_us_east" {
  source = "./modules/vpc"
  
  region             = "us-east-1"
  environment        = var.environment
  project_name       = var.project_name
  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)
  
  tags = local.common_tags
}

module "vpc_us_west" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.us_west
  }
  
  region             = "us-west-2"
  environment        = var.environment
  project_name       = var.project_name
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
  
  tags = local.common_tags
}

module "vpc_eu_west" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.eu_west
  }
  
  region             = "eu-west-1"
  environment        = var.environment
  project_name       = var.project_name
  availability_zones = ["eu-west-1a", "eu-west-1b", "eu-west-1c"]
  
  tags = local.common_tags
}

# ==================== DATABASE CLUSTER ====================

module "rds_global_cluster" {
  source = "./modules/rds-global"
  
  cluster_identifier     = "${var.project_name}-global-cluster"
  engine                = "aurora-postgresql"
  engine_version        = "15.4"
  database_name         = "zenith"
  master_username       = "zenith_admin"
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  
  # Primary cluster in us-east-1
  primary_region = "us-east-1"
  primary_vpc_id = module.vpc_us_east.vpc_id
  primary_subnet_ids = module.vpc_us_east.database_subnet_ids
  
  # Secondary clusters
  secondary_regions = [
    {
      region     = "us-west-2"
      vpc_id     = module.vpc_us_west.vpc_id
      subnet_ids = module.vpc_us_west.database_subnet_ids
    },
    {
      region     = "eu-west-1"
      vpc_id     = module.vpc_eu_west.vpc_id
      subnet_ids = module.vpc_eu_west.database_subnet_ids
    }
  ]
  
  tags = local.common_tags
}

# ==================== REDIS CLUSTER ====================

module "redis_global" {
  source = "./modules/redis-global"
  
  cluster_id                = "${var.project_name}-redis-global"
  node_type                = "cache.r7g.large"
  num_cache_clusters       = 3
  parameter_group_name     = "default.redis7"
  port                     = 6379
  
  # Multi-region setup
  regions = [
    {
      region             = "us-east-1"
      vpc_id            = module.vpc_us_east.vpc_id
      subnet_ids        = module.vpc_us_east.cache_subnet_ids
      availability_zones = module.vpc_us_east.availability_zones
    },
    {
      region             = "us-west-2"
      vpc_id            = module.vpc_us_west.vpc_id
      subnet_ids        = module.vpc_us_west.cache_subnet_ids
      availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
    }
  ]
  
  tags = local.common_tags
}

# ==================== COMPUTE (ECS/EKS) ====================

module "ecs_clusters" {
  source = "./modules/ecs-multi-region"
  
  cluster_name = "${var.project_name}-cluster"
  
  regions = [
    {
      region              = "us-east-1"
      vpc_id             = module.vpc_us_east.vpc_id
      private_subnet_ids = module.vpc_us_east.private_subnet_ids
      public_subnet_ids  = module.vpc_us_east.public_subnet_ids
    },
    {
      region              = "us-west-2"
      vpc_id             = module.vpc_us_west.vpc_id
      private_subnet_ids = module.vpc_us_west.private_subnet_ids
      public_subnet_ids  = module.vpc_us_west.public_subnet_ids
    },
    {
      region              = "eu-west-1"
      vpc_id             = module.vpc_eu_west.vpc_id
      private_subnet_ids = module.vpc_eu_west.private_subnet_ids
      public_subnet_ids  = module.vpc_eu_west.public_subnet_ids
    }
  ]
  
  auto_scaling_config = var.auto_scaling_config
  
  tags = local.common_tags
}

# ==================== LOAD BALANCING ====================

module "global_load_balancer" {
  source = "./modules/alb-global"
  
  name = "${var.project_name}-global-alb"
  
  regions = [
    {
      region            = "us-east-1"
      vpc_id           = module.vpc_us_east.vpc_id
      public_subnet_ids = module.vpc_us_east.public_subnet_ids
    },
    {
      region            = "us-west-2"
      vpc_id           = module.vpc_us_west.vpc_id
      public_subnet_ids = module.vpc_us_west.public_subnet_ids
    },
    {
      region            = "eu-west-1"
      vpc_id           = module.vpc_eu_west.vpc_id
      public_subnet_ids = module.vpc_eu_west.public_subnet_ids
    }
  ]
  
  health_check_path = "/api/health"
  
  tags = local.common_tags
}

# ==================== CDN & EDGE ====================

module "cloudfront_distribution" {
  source = "./modules/cloudfront"
  
  distribution_name = "${var.project_name}-global-cdn"
  
  origins = [
    for region, config in module.global_load_balancer.load_balancers : {
      domain_name = config.dns_name
      origin_id   = "ALB-${region}"
      region      = region
    }
  ]
  
  price_class = "PriceClass_All"
  
  cache_behaviors = [
    {
      path_pattern     = "/api/*"
      ttl_default     = 0
      ttl_max         = 0
      allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods  = ["GET", "HEAD"]
    },
    {
      path_pattern     = "/_next/static/*"
      ttl_default     = 31536000
      ttl_max         = 31536000
      allowed_methods = ["GET", "HEAD"]
      cached_methods  = ["GET", "HEAD"]
    }
  ]
  
  tags = local.common_tags
}

# ==================== MONITORING & OBSERVABILITY ====================

module "monitoring_stack" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  # CloudWatch setup across regions
  regions = var.regions
  
  # Metrics configuration
  custom_metrics = [
    "API/ResponseTime",
    "API/ErrorRate", 
    "API/Throughput",
    "Database/ConnectionCount",
    "Database/QueryTime",
    "Cache/HitRate",
    "Infrastructure/CPUUtilization",
    "Infrastructure/MemoryUtilization"
  ]
  
  # Alert configuration
  alert_endpoints = [
    "ops-team@zenith.engineer",
    "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  ]
  
  tags = local.common_tags
}

# ==================== SECURITY ====================

module "security_stack" {
  source = "./modules/security"
  
  project_name = var.project_name
  environment  = var.environment
  
  # WAF configuration
  enable_waf = true
  waf_rules = [
    "AWSManagedRulesCommonRuleSet",
    "AWSManagedRulesKnownBadInputsRuleSet",
    "AWSManagedRulesSQLiRuleSet",
    "AWSManagedRulesLinuxRuleSet",
    "AWSManagedRulesUnixRuleSet"
  ]
  
  # Shield Advanced for DDoS protection
  enable_shield_advanced = true
  
  tags = local.common_tags
}

# ==================== OUTPUTS ====================

output "vpc_ids" {
  description = "VPC IDs by region"
  value = {
    "us-east-1"      = module.vpc_us_east.vpc_id
    "us-west-2"      = module.vpc_us_west.vpc_id
    "eu-west-1"      = module.vpc_eu_west.vpc_id
  }
}

output "database_endpoints" {
  description = "Database cluster endpoints"
  value = module.rds_global_cluster.cluster_endpoints
  sensitive = true
}

output "redis_endpoints" {
  description = "Redis cluster endpoints"
  value = module.redis_global.cluster_endpoints
  sensitive = true
}

output "load_balancer_dns" {
  description = "Load balancer DNS names by region"
  value = {
    for region, config in module.global_load_balancer.load_balancers : 
    region => config.dns_name
  }
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value = module.cloudfront_distribution.domain_name
}

output "monitoring_dashboard_urls" {
  description = "CloudWatch dashboard URLs"
  value = module.monitoring_stack.dashboard_urls
}