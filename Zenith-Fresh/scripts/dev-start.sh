#!/bin/bash
# Zenith Fresh SaaS - Development Environment Startup

set -e

echo "🔧 Starting Zenith Fresh development environment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Create development directories
mkdir -p logs

# Start development environment
print_warning "Starting development services..."
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d postgres redis pgadmin redis-commander

print_warning "Waiting for database to be ready..."
sleep 10

# Check if we want to run the app in container or locally
read -p "Run app in container (c) or locally (l)? [c/l]: " choice
case "$choice" in
    l|L )
        print_success "Database and cache services started"
        echo ""
        echo "🌐 Development Services:"
        echo "   • PostgreSQL: localhost:5432"
        echo "   • Redis: localhost:6379"
        echo "   • PgAdmin: http://localhost:5050 (admin@zenithfresh.com / admin123)"
        echo "   • Redis Commander: http://localhost:8081"
        echo ""
        echo "🔧 To start the app locally:"
        echo "   npm run dev"
        echo ""
        echo "📊 Service Status:"
        docker-compose -f docker-compose.dev.yml ps
        ;;
    c|C|* )
        print_warning "Starting application container..."
        docker-compose -f docker-compose.dev.yml up -d
        
        print_warning "Waiting for application to be ready..."
        sleep 20
        
        print_success "Development environment started!"
        echo ""
        echo "🌐 Development Services:"
        echo "   • Main App: http://localhost:3000"
        echo "   • PostgreSQL: localhost:5432"
        echo "   • Redis: localhost:6379"
        echo "   • PgAdmin: http://localhost:5050 (admin@zenithfresh.com / admin123)"
        echo "   • Redis Commander: http://localhost:8081"
        echo ""
        echo "📊 Service Status:"
        docker-compose -f docker-compose.dev.yml ps
        ;;
esac