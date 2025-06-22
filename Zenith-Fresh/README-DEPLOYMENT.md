# Zenith Fresh SaaS - Production Deployment Guide

## 🚀 Quick Start

### Production Deployment
```bash
# 1. Clone the repository
git clone https://github.com/your-org/zenith-fresh.git
cd zenith-fresh

# 2. Run the deployment script
./scripts/deploy.sh
```

### Development Environment
```bash
# Start development environment
./scripts/dev-start.sh
```

## 📋 Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 80, 3000, 5432, 6379 available

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   Next.js App   │    │   PostgreSQL    │
│  (Load Balancer)│◄──►│    (Main App)   │◄──►│   (Database)    │
│     Port 80     │    │    Port 3000    │    │    Port 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │      Redis      │
                       │     (Cache)     │
                       │    Port 6379    │
                       └─────────────────┘
```

## 🐳 Container Services

### Production Stack (`docker-compose.yml`)
- **zenith-app**: Main Next.js application
- **postgres**: PostgreSQL database with initialized schema
- **redis**: Redis cache for sessions and performance
- **nginx**: Reverse proxy with rate limiting and SSL termination
- **health-monitor**: Continuous health monitoring

### Development Stack (`docker-compose.dev.yml`)
- **zenith-app-dev**: Development server with hot reload
- **postgres**: Same database setup as production
- **redis**: Cache service
- **pgadmin**: Database administration interface
- **redis-commander**: Redis administration interface

## 🔧 Configuration

### Environment Variables
Create `.env` file with:
```bash
NODE_ENV=production
MASTER_USERNAME=zenith_master
MASTER_PASSWORD=YourSecurePassword123!
DATABASE_URL=postgresql://zenith_user:zenith_password@postgres:5432/zenith_db
REDIS_URL=redis://redis:6379
```

### SSL Configuration (Production)
1. Place SSL certificates in `nginx/ssl/`:
   - `cert.pem`
   - `key.pem`
2. Uncomment HTTPS server block in `nginx/nginx.conf`
3. Update domain names in configuration

## 🎯 Access Points

### Production
- **Main Application**: http://localhost:3000
- **Load Balancer**: http://localhost:80
- **Health Check**: http://localhost:3000/api/health

### Development
- **Application**: http://localhost:3000
- **PgAdmin**: http://localhost:5050
  - Email: admin@zenithfresh.com
  - Password: admin123
- **Redis Commander**: http://localhost:8081

## 🔐 Default Credentials

### Master Admin
- **Username**: zenith_master
- **Password**: ZenithMaster2024!
- **Role**: master_admin
- **Access**: All features unlocked

### Staff Accounts
- **staff_1** / StaffTest2024!
- **qa_lead** / QALead2024!

## 📊 Monitoring & Health Checks

### Built-in Health Monitoring
- Automatic health checks every 30 seconds
- Real-time container monitoring
- Database connection verification
- Redis connectivity checks

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f zenith-app

# Health monitor
docker-compose logs -f health-monitor
```

## 🔄 Maintenance Commands

### Start/Stop Services
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart zenith-app
```

### Database Maintenance
```bash
# Backup database
docker-compose exec postgres pg_dump -U zenith_user zenith_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U zenith_user -d zenith_db < backup.sql

# Connect to database
docker-compose exec postgres psql -U zenith_user -d zenith_db
```

### Application Updates
```bash
# Rebuild and deploy new version
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🛡️ Security Features

### Nginx Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Rate Limiting
- API endpoints: 10 requests/second
- Auth endpoints: 5 requests/second
- Burst protection enabled

### Database Security
- Isolated network
- User-specific database access
- Connection pooling

## 📈 Performance Optimization

### Caching Strategy
- Redis for session storage
- Static asset caching via Nginx
- Database query optimization

### Resource Management
- Container resource limits
- Memory optimization
- CPU usage monitoring

## 🚨 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Find and kill process using port
sudo lsof -i :3000
sudo kill -9 <PID>
```

**Database Connection Issues**
```bash
# Check database status
docker-compose exec postgres pg_isready -U zenith_user

# Reset database
docker-compose down
docker volume rm zenith-fresh_postgres_data
docker-compose up -d
```

**Application Not Starting**
```bash
# Check logs
docker-compose logs zenith-app

# Rebuild container
docker-compose build --no-cache zenith-app
docker-compose up -d zenith-app
```

### Health Check Failures
```bash
# Manual health check
curl http://localhost:3000/api/health

# Check all container status
docker-compose ps

# View resource usage
docker stats
```

## 🔧 Development Workflow

### Local Development
1. Start services: `./scripts/dev-start.sh`
2. Choose local or container development
3. Access PgAdmin for database management
4. Use Redis Commander for cache inspection

### Production Testing
1. Build production image locally
2. Test with production docker-compose
3. Verify all health checks pass
4. Load test critical endpoints

## 📞 Support

For deployment issues:
1. Check container logs first
2. Verify all ports are available
3. Ensure Docker has sufficient resources
4. Review configuration files

The deployment includes comprehensive monitoring and health checks to ensure your SaaS platform runs reliably in production.