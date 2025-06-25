# Enhanced CI/CD Pipeline Setup Guide

This document provides instructions for setting up and configuring the enhanced GitHub Actions CI/CD pipeline with advanced security scanning, performance testing, database migration verification, automated rollback, and comprehensive notifications.

## 📋 Overview

The enhanced CI/CD pipeline includes:

1. **Security Scanning** - Dependency vulnerability checks and CodeQL analysis
2. **Performance Testing** - Lighthouse audits and response time monitoring
3. **Database Migration Verification** - Safe migration deployment with verification
4. **Automated Rollback** - Automatic rollback on deployment failures
5. **Deployment Notifications** - Slack, Discord, and email notifications
6. **Staging Environment Health Monitoring** - Continuous health checks

## 🔧 Required GitHub Secrets

Configure these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Essential Secrets
```bash
# Vercel deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Database connections
DATABASE_URL=your_production_database_url
STAGING_DATABASE_URL=your_staging_database_url

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_production_url
```

### Optional Notification Secrets
```bash
# Slack notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url

# Discord notifications  
DISCORD_WEBHOOK_URL=your_discord_webhook_url

# Email notifications
NOTIFICATION_EMAIL=your_email@example.com

# Lighthouse CI (optional - for advanced reporting)
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

### Additional Environment URLs
```bash
# Staging environment
STAGING_URL=your_staging_deployment_url
```

## 🚀 Workflow Features

### 1. Security Scanning

**What it does:**
- Runs npm audit for dependency vulnerabilities
- Performs CodeQL static analysis
- Scans for exposed secrets and sensitive files
- Generates security reports

**Triggers:**
- Every push to main branch
- Every pull request to main branch

**Artifacts:**
- Security scan results (`security-scan-results`)
- CodeQL SARIF reports

### 2. Performance Testing

**What it does:**
- Runs Lighthouse audits on deployed applications
- Measures response times and Core Web Vitals
- Tests performance on both staging and production
- Generates performance reports with scoring

**Configuration files:**
- `lighthouserc.json` - CI-specific Lighthouse configuration
- `lighthouse.config.js` - Detailed desktop configuration

**Thresholds:**
- Performance: 75%+ score
- Accessibility: 90%+ score (required)
- Best Practices: 85%+ score
- SEO: 80%+ score

### 3. Database Migration Verification

**What it does:**
- Validates Prisma schema before migration
- Creates database backups (when possible)
- Runs migrations with verification
- Tests database connectivity post-migration
- Provides rollback information

**Health checks:**
- Database connection verification
- Schema validation
- Query performance testing

### 4. Automated Rollback

**What it does:**
- Monitors deployment health checks
- Automatically rolls back failed deployments
- Sends emergency notifications
- Provides detailed failure reports

**Trigger conditions:**
- Health check failures
- Response time degradation
- Critical errors in smoke tests

### 5. Enhanced Notifications

**Notification types:**
- ✅ **Success**: Deployment completed successfully
- ⚠️ **Warning**: Deployment completed with issues
- ❌ **Failure**: Deployment failed
- 🚨 **Emergency**: Rollback executed

**Slack notification format:**
```json
{
  "text": "🚀 **Zenith Platform Deployed Successfully**",
  "attachments": [{
    "color": "good",
    "fields": [
      {"title": "Environment", "value": "Production"},
      {"title": "URL", "value": "https://your-domain.com"},
      {"title": "Commit", "value": "abc123..."},
      {"title": "Status", "value": "✅ All checks passed"}
    ]
  }]
}
```

### 6. Staging Health Monitoring

**What it does:**
- Continuous health checks every 30 seconds
- Response time monitoring
- Endpoint availability testing
- Performance degradation detection
- Automated reporting

## 📊 Available Artifacts

Each workflow run generates downloadable artifacts:

### Production Pipeline
- `test-coverage` - Unit test coverage reports
- `lighthouse-results` - Performance audit results
- `security-scan-results` - Security scan outputs
- `deployment-health-report` - Comprehensive deployment report

### Staging Pipeline
- `staging-test-results` - Staging-specific test results
- `staging-performance-results` - Staging performance data
- `e2e-test-results` - End-to-end test reports
- `staging-deployment-report` - Staging deployment summary

## 🛠️ Local Development Scripts

Test the pipeline components locally:

```bash
# Security audit
npm run security:audit

# Performance testing
npm run lighthouse

# Health check
npm run health-check

# E2E testing
npm run test:e2e

# Database operations
npm run prisma:generate
npm run prisma:migrate
```

## 🔄 Workflow Structure

### Production Deploy Workflow (`deploy.yml`)
```
Security Scan → Quality Check → Performance Test
                     ↓
Database Migration → Production Deploy → Health Monitoring
                     ↓
              Notifications & Cleanup
                     ↓
              (Rollback if failed)
```

### Staging Deploy Workflow (`staging-deploy.yml`)
```
Security Scan → Quality Check → Database Migration
                     ↓
              Staging Deploy → E2E Tests
                     ↓
              Health Monitoring → Reports
```

## 🚨 Troubleshooting

### Common Issues

**1. Health checks failing**
```bash
# Check if health endpoint exists
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": {"status": "healthy"},
    "memory": {"status": "healthy"}
  }
}
```

**2. Lighthouse tests timing out**
- Ensure application starts within 30 seconds
- Check for memory issues during build
- Verify all dependencies are properly installed

**3. Database migration failures**
- Verify DATABASE_URL is correctly set
- Check for schema conflicts
- Ensure Prisma client is up to date

**4. Notification delivery issues**
- Verify webhook URLs are active
- Check secret values are correctly set
- Test webhooks independently

### Pipeline Debugging

**View detailed logs:**
1. Go to Actions tab in GitHub
2. Select the failed workflow run
3. Click on the failed job
4. Expand the failed step

**Download artifacts:**
1. Go to the workflow run summary
2. Scroll to "Artifacts" section
3. Download relevant reports

**Manual testing:**
```bash
# Test health endpoint
curl -f https://your-domain.com/api/health

# Test performance
npx @lhci/cli@0.12.x autorun --collect.url=https://your-domain.com

# Test database connection
npx prisma db pull --print
```

## 📈 Performance Optimization

### Lighthouse Optimization Tips

**Improve Performance Score:**
- Optimize images (use Next.js Image component)
- Minimize JavaScript bundles
- Use appropriate caching headers
- Implement lazy loading

**Improve Accessibility Score:**
- Add alt text to images
- Ensure proper heading structure
- Maintain sufficient color contrast
- Add ARIA labels where needed

**Improve Best Practices Score:**
- Use HTTPS everywhere
- Avoid deprecated APIs
- Implement proper error handling
- Follow security best practices

## 🔐 Security Considerations

**Secret Management:**
- Rotate secrets regularly
- Use environment-specific secrets
- Never commit secrets to code
- Implement least-privilege access

**Access Control:**
- Limit GitHub Actions permissions
- Use branch protection rules
- Require status checks before merge
- Enable signed commits

**Monitoring:**
- Set up alerts for failed deployments
- Monitor unusual activity patterns
- Regular security audits
- Dependency vulnerability scanning

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Next.js Performance Guide](https://nextjs.org/docs/advanced-features/measuring-performance)

---

## 🆘 Support

If you encounter issues with the CI/CD pipeline:

1. Check this troubleshooting guide
2. Review workflow logs and artifacts
3. Test components locally
4. Verify all secrets are configured
5. Check application health endpoints

The enhanced CI/CD pipeline is designed to catch issues early and provide comprehensive feedback for reliable deployments.