# VPC Module for Multi-Region Deployment

variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

# ==================== VPC ====================

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-${var.region}"
  })
}

# ==================== INTERNET GATEWAY ====================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-igw-${var.region}"
  })
}

# ==================== PUBLIC SUBNETS ====================

resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}-${var.region}"
    Type = "public"
  })
}

# ==================== PRIVATE SUBNETS ====================

resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}-${var.region}"
    Type = "private"
  })
}

# ==================== DATABASE SUBNETS ====================

resource "aws_subnet" "database" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 20}.0/24"
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-db-subnet-${count.index + 1}-${var.region}"
    Type = "database"
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group-${var.region}"
  subnet_ids = aws_subnet.database[*].id
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-db-subnet-group-${var.region}"
  })
}

# ==================== CACHE SUBNETS ====================

resource "aws_subnet" "cache" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 30}.0/24"
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-cache-subnet-${count.index + 1}-${var.region}"
    Type = "cache"
  })
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-cache-subnet-group-${var.region}"
  subnet_ids = aws_subnet.cache[*].id
}

# ==================== NAT GATEWAYS ====================

resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain = "vpc"
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-eip-${count.index + 1}-${var.region}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}-${var.region}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# ==================== ROUTE TABLES ====================

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-public-rt-${var.region}"
  })
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route tables
resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}-${var.region}"
  })
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database route tables
resource "aws_route_table" "database" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-db-rt-${count.index + 1}-${var.region}"
  })
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}

# ==================== SECURITY GROUPS ====================

resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg-${var.region}"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-web-sg-${var.region}"
  })
}

resource "aws_security_group" "database" {
  name        = "${var.project_name}-db-sg-${var.region}"
  description = "Security group for database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-db-sg-${var.region}"
  })
}

resource "aws_security_group" "cache" {
  name        = "${var.project_name}-cache-sg-${var.region}"
  description = "Security group for cache"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-cache-sg-${var.region}"
  })
}

# ==================== OUTPUTS ====================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "cache_subnet_ids" {
  description = "Cache subnet IDs"
  value       = aws_subnet.cache[*].id
}

output "database_subnet_group_name" {
  description = "Database subnet group name"
  value       = aws_db_subnet_group.main.name
}

output "cache_subnet_group_name" {
  description = "Cache subnet group name"
  value       = aws_elasticache_subnet_group.main.name
}

output "availability_zones" {
  description = "Availability zones"
  value       = var.availability_zones
}

output "security_group_web_id" {
  description = "Web security group ID"
  value       = aws_security_group.web.id
}

output "security_group_database_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "security_group_cache_id" {
  description = "Cache security group ID"
  value       = aws_security_group.cache.id
}