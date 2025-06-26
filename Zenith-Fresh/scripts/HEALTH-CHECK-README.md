# Zenith Platform Health Check System

A comprehensive pre-deployment health check system that verifies all critical aspects of the Zenith Platform before deployment.

## Overview

The health check system performs thorough validation of:

- **Database Connectivity** - PostgreSQL connection, schema integrity, migrations
- **API Endpoints** - Critical API routes and functionality 
- **Authentication Flow** - NextAuth configuration and security
- **Environment Variables** - Required and recommended configuration
- **Build Integrity** - TypeScript compilation, linting, dependencies
- **Security Configuration** - Security headers, HTTPS, sensitive files
- **File Permissions** - Critical file access permissions
- **External Services** - Redis, Stripe, email, AI services
- **Performance Metrics** - Memory usage, build size, optimization
- **Dependency Security** - npm audit, vulnerability scanning

## Usage

### Quick Health Check
```bash
npm run health-check
```

### Alternative Execution Methods
```bash
# Direct execution
node scripts/health-check.js

# Make executable and run
chmod +x scripts/health-check.js
./scripts/health-check.js
```

### API Health Check (Runtime)
```bash
npm run health-check:api
```

## Exit Codes

- **0** - All checks passed (deployment ready)
- **1** - Critical failures or failed checks (do not deploy)

## Output

### Console Output
The health check provides real-time colored console output showing:
- Progress of each check
- Success/warning/error indicators
- Detailed failure reasons
- Performance timing
- Final summary and recommendations

### Report File
Detailed JSON report saved to: `health-check-report.json`

## Check Categories

### 🔴 Critical Checks (Must Pass for Deployment)
- `database` - Database connectivity and schema
- `authentication` - Auth configuration and security  
- `build_integrity` - Build process and compilation
- `security_config` - Security settings and headers
- `api_endpoints` - Critical API route availability

### 🟡 Important Checks (Warnings OK)
- `environment_variables` - Configuration completeness
- `file_permissions` - File system access
- `external_services` - Third-party service configuration
- `performance_metrics` - System performance
- `dependency_security` - Package vulnerabilities

## Configuration

### Required Environment Variables
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

### Recommended Environment Variables
```bash
REDIS_URL=redis://...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
RESEND_API_KEY=re_...
OPENAI_API_KEY=sk-...
```

## Detailed Check Descriptions

### Database Connectivity
- Tests PostgreSQL connection
- Verifies critical tables exist
- Checks migration status
- Validates query execution

**Common Issues:**
- `DATABASE_URL` not set or incorrect
- Database server not running
- Network connectivity issues
- Missing migrations

**Solutions:**
```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Test connection manually
npx prisma db execute --file=test-query.sql
```

### Authentication
- Validates NextAuth configuration
- Checks required secrets
- Verifies OAuth provider setup
- Tests auth route availability

**Common Issues:**
- Missing `NEXTAUTH_SECRET`
- Incorrect `NEXTAUTH_URL`
- Missing auth configuration files

**Solutions:**
```bash
# Generate auth secret
openssl rand -base64 32

# Set environment variables
export NEXTAUTH_SECRET="your-generated-secret"
export NEXTAUTH_URL="https://your-domain.com"
```

### Build Integrity
- TypeScript compilation check
- ESLint validation
- Dependency verification
- Critical file existence

**Common Issues:**
- TypeScript compilation errors
- Missing dependencies
- Linting failures

**Solutions:**
```bash
# Install dependencies
npm install

# Fix TypeScript errors
npm run type-check

# Fix linting issues
npm run lint
```

### Security Configuration
- HTTPS enforcement
- Security headers
- Sensitive file detection
- API key management

**Common Issues:**
- Missing security headers
- HTTP in production
- Exposed sensitive files

**Solutions:**
```bash
# Add security headers to next.config.js
# Use HTTPS in production
# Add sensitive files to .gitignore
```

### External Services
- Redis connectivity
- Stripe configuration
- Email service setup
- AI service integration

**Common Issues:**
- Service credentials not configured
- Network connectivity issues
- Incorrect API keys

**Solutions:**
```bash
# Configure each service with proper credentials
# Test connectivity manually
# Check service status dashboards
```

## Troubleshooting

### Common Error Patterns

#### Database Connection Failed
```
✗ Database connectivity failed: Connection refused
```
**Solution:** Verify DATABASE_URL and ensure database is running

#### Build Compilation Failed  
```
✗ TypeScript compilation check failed
```
**Solution:** Run `npm run type-check` and fix reported errors

#### Missing Environment Variables
```
✗ NEXTAUTH_SECRET missing
```
**Solution:** Set required environment variables

#### Permission Denied
```
✗ File permissions incorrect
```
**Solution:** Check file system permissions and ownership

### Manual Verification

If automated checks fail, manually verify:

1. **Database Connection**
   ```bash
   npx prisma db execute --file=<(echo "SELECT 1")
   ```

2. **Build Process**
   ```bash
   npm run build
   ```

3. **Environment Configuration**
   ```bash
   env | grep -E "(DATABASE_URL|NEXTAUTH_)"
   ```

4. **File Permissions**
   ```bash
   ls -la package.json next.config.js
   ```

## Integration

### CI/CD Pipeline
Add to your deployment pipeline:

```yaml
# GitHub Actions example
- name: Health Check
  run: npm run health-check
  
- name: Block Deployment on Failure
  if: failure()
  run: exit 1
```

### Pre-commit Hook
```json
{
  "pre-push": "npm run health-check"
}
```

### Staging Environment
Run before promoting to production:
```bash
NODE_ENV=production npm run health-check
```

## Performance Benchmarks

### Expected Check Times
- Database Connectivity: < 2 seconds
- API Endpoints: < 1 second  
- Authentication: < 500ms
- Build Integrity: < 30 seconds
- Security Config: < 1 second
- File Permissions: < 500ms
- External Services: < 2 seconds
- Performance Metrics: < 1 second
- Dependency Security: < 10 seconds

### Total Runtime
- **Fast**: < 45 seconds (all services available)
- **Typical**: < 60 seconds (some timeouts)
- **Slow**: < 90 seconds (network issues)

## Customization

### Adding Custom Checks
Extend the health check system by adding new check functions:

```javascript
async function checkCustomService() {
  const startTime = Date.now();
  
  try {
    // Your custom check logic here
    const result = await performCustomCheck();
    
    const duration = Date.now() - startTime;
    return recordResult('custom_service', 'pass', {
      duration,
      details: result
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    return recordResult('custom_service', 'fail', {
      error: error.message,
      duration
    }, ['Fix custom service configuration']);
  }
}
```

### Modifying Thresholds
Update performance and security thresholds in the script:

```javascript
// Memory usage thresholds
const MEMORY_WARNING_MB = 200;
const MEMORY_CRITICAL_MB = 500;

// Security score minimum
const SECURITY_SCORE_MINIMUM = 70;
```

## Best Practices

### Before Deployment
1. Run health check in staging environment
2. Address all critical failures
3. Review and address warnings
4. Verify external service connectivity
5. Confirm security configuration

### Regular Monitoring
1. Run health checks on schedule
2. Monitor performance trends
3. Update security configurations
4. Review dependency vulnerabilities
5. Validate environment configurations

### Emergency Response
1. If health check fails in production, investigate immediately
2. Check recent changes and rollback if necessary
3. Verify external service status
4. Monitor error logs and metrics
5. Communicate status to stakeholders

## Support

For issues with the health check system:

1. **Check the JSON report** - `health-check-report.json` contains detailed information
2. **Review console output** - Look for specific error messages and recommendations
3. **Verify environment** - Ensure all required variables are set correctly
4. **Test manually** - Use individual check commands to isolate issues
5. **Check service status** - Verify external services are operational

## Version History

- **v1.0** - Initial comprehensive health check system
- **v1.1** - Added performance metrics and security scanning
- **v1.2** - Enhanced external service validation
- **v1.3** - Added dependency security checks and reporting

---

**⚡ Zenith Platform Health Check System - Ensuring deployment readiness and system reliability**