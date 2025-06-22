#!/bin/bash
# Zenith Fresh SaaS - Production Deployment Script

set -e

echo "🚀 Starting Zenith Fresh deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it and try again."
    exit 1
fi

print_success "docker-compose is available"

# Create necessary directories
mkdir -p logs/nginx
mkdir -p nginx/ssl

print_success "Created necessary directories"

# Build and start services
echo "🔨 Building and starting services..."

# Stop any existing containers
docker-compose down

# Build the application
print_warning "Building application..."
docker-compose build --no-cache

# Start services
print_warning "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🔍 Performing health checks..."

# Check if app is responding
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Application is responding on port 3000"
else
    print_error "Application is not responding on port 3000"
    echo "Checking logs..."
    docker-compose logs zenith-app
    exit 1
fi

# Check if nginx is responding
if curl -f http://localhost:80/health > /dev/null 2>&1; then
    print_success "Nginx is responding on port 80"
else
    print_warning "Nginx health check failed, but this might be expected"
fi

# Check database connection
if docker-compose exec -T postgres pg_isready -U zenith_user > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
    exit 1
fi

# Check Redis connection
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_error "Redis is not ready"
    exit 1
fi

# Display service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
print_success "Deployment completed successfully!"
echo ""
echo "🌐 Access your application:"
echo "   • Main App: http://localhost:3000"
echo "   • Via Nginx: http://localhost:80"
echo "   • Health Check: http://localhost:3000/api/health"
echo ""
echo "🔐 Admin Credentials:"
echo "   • Username: zenith_master"
echo "   • Password: ZenithMaster2024!"
echo ""
echo "📝 Useful commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart: docker-compose restart"
echo ""

# Show container resource usage
echo "💻 Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"