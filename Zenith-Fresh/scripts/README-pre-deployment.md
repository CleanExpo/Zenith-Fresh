# Pre-Deployment Validation Script

## Overview

The comprehensive pre-deployment validation script (`pre-deployment-check.js`) is the final gate before production deployment. It combines all previous checks (cleanup, health check, security audit) into a single workflow that provides a clear go/no-go decision with detailed scoring and recommendations.

## Features

### 🔍 Comprehensive Validation
- **Cleanup Check** - Removes development artifacts and temporary files
- **Build Validation** - Verifies production build success and bundle sizes
- **Test Suite** - Runs tests with coverage requirements
- **Security Audit** - Scans for vulnerabilities and sensitive data
- **Performance Check** - Measures API response times and memory usage
- **Code Quality** - Linting, TypeScript validation, and duplication analysis

### 📊 Scoring System
- **Weighted Scoring** - Each category has different importance weights
- **Deployment Readiness Score** - 0-100 scale with clear thresholds
- **Category Breakdown** - Individual scores for each validation area
- **Critical Issue Detection** - Immediate failure for security/test issues

### 🚀 Deployment Decision Logic
- **GO (90-100%)** - Ready for production deployment
- **CONDITIONAL (70-89%)** - Can deploy with caution (fails in strict mode)
- **NO-GO (<70%)** - Critical issues must be resolved before deployment

## Usage

### Basic Validation
```bash
# Run complete validation
node scripts/pre-deployment-check.js

# Run with automatic fixes
node scripts/pre-deployment-check.js --fix

# Run in strict mode (fail on warnings)
node scripts/pre-deployment-check.js --strict

# Generate detailed HTML report
node scripts/pre-deployment-check.js --report

# CI/CD mode (simplified output)
node scripts/pre-deployment-check.js --ci
```

### Common Workflows

#### Development Workflow
```bash
# Before committing changes
node scripts/pre-deployment-check.js --fix

# Before creating pull request
node scripts/pre-deployment-check.js --strict --report
```

#### CI/CD Pipeline
```bash
# In GitHub Actions or similar
node scripts/pre-deployment-check.js --ci --strict
```

#### Production Deployment
```bash
# Final validation before deployment
node scripts/pre-deployment-check.js --strict --report
```

## Validation Categories

### 1. Cleanup (Weight: 10%)
- Removes temporary files and build artifacts
- Checks for empty directories
- Cleans development cache files
- **Threshold**: 100% for production deployment

### 2. Build (Weight: 20%)
- Verifies Next.js production build
- Measures build time (<5 minutes)
- Checks bundle sizes (<5MB main bundle)
- Identifies build warnings
- **Threshold**: 80% minimum score

### 3. Tests (Weight: 20%)
- Runs complete test suite
- Validates test coverage (>80%)
- Ensures no failing tests
- Generates coverage reports
- **Threshold**: 100% passing tests required

### 4. Security (Weight: 25%)
- npm audit for vulnerabilities
- Scans for sensitive data patterns
- Checks environment variable exposure
- Validates dependency security
- **Threshold**: No critical vulnerabilities

### 5. Performance (Weight: 15%)
- API response time testing (<200ms)
- Memory usage monitoring (<512MB)
- Lighthouse audit (if available)
- Bundle size optimization
- **Threshold**: 80% performance score

### 6. Code Quality (Weight: 10%)
- ESLint validation
- TypeScript type checking
- Code duplication analysis
- TODO comment tracking
- **Threshold**: No linting errors

## Scoring Algorithm

```javascript
Overall Score = (
  cleanup_score * 10% +
  build_score * 20% +
  tests_score * 20% +
  security_score * 25% +
  performance_score * 15% +
  code_quality_score * 10%
)
```

### Decision Matrix
| Score Range | Status | Action |
|-------------|--------|--------|
| 90-100% | GO | ✅ Deploy to production |
| 70-89% | CONDITIONAL | ⚠️ Deploy with caution |
| 0-69% | NO-GO | ❌ Fix issues before deployment |

## Configuration

### Thresholds (Customizable)
```javascript
const config = {
  health: {
    buildTime: 300000,        // 5 minutes max
    bundleSize: 5 * 1024 * 1024, // 5MB max
    testCoverage: 80,         // 80% minimum
    apiResponseTime: 200,     // 200ms max
    memoryUsage: 512 * 1024 * 1024 // 512MB max
  }
};
```

### Security Patterns
- API keys and secrets detection
- Sensitive data exposure scanning
- Environment variable validation
- Dependency vulnerability checking

## Output Formats

### Terminal Output
```
ZENITH PLATFORM - PRE-DEPLOYMENT VALIDATION REPORT
===============================================

Category Scores:
Cleanup        ████████████████████ 100.0% (weight: 10%)
Build          ███████████████░░░░░  85.2% (weight: 20%)
Tests          ████████████████████  95.5% (weight: 20%)
Security       ██████████████░░░░░░  78.9% (weight: 25%)
Performance    ████████████████░░░░  82.1% (weight: 15%)
Code Quality   ████████████████████  92.3% (weight: 10%)

Overall Score: 86.7/100
Status:        CONDITIONAL

Recommendation:
Codebase can be deployed with caution. Consider addressing warnings.

Recommendations:
• Address security vulnerabilities and sensitive data exposure
• Optimize application performance and response times
```

### HTML Report
- Visual dashboard with charts and graphs
- Detailed issue breakdown by category
- Metrics visualization
- Actionable recommendations
- Export capability for stakeholder review

## Integration

### package.json Scripts
```json
{
  "scripts": {
    "pre-deploy": "node scripts/pre-deployment-check.js",
    "pre-deploy:fix": "node scripts/pre-deployment-check.js --fix",
    "pre-deploy:strict": "node scripts/pre-deployment-check.js --strict --report",
    "validate": "node scripts/pre-deployment-check.js --ci"
  }
}
```

### GitHub Actions
```yaml
name: Pre-Deployment Validation

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run validate
```

### Railway Deployment Hooks
```bash
# In Railway, add as pre-deploy command
node scripts/pre-deployment-check.js --ci --strict
```

## Error Handling

### Critical Failures
- **Build Errors**: Immediate NO-GO status
- **Test Failures**: Immediate NO-GO status
- **Critical Security Vulnerabilities**: Immediate NO-GO status
- **Missing Dependencies**: Graceful degradation with warnings

### Automatic Recovery
- **File Cleanup**: Automatic removal with `--fix` flag
- **Cache Clearing**: Automatic cache invalidation
- **Dependency Updates**: Suggestions for vulnerability fixes

## Monitoring Integration

### Metrics Collection
- Validation timing and performance
- Success/failure rates by category
- Historical score tracking
- Team deployment patterns

### Alert Integration
- Slack/Discord notifications for validation failures
- Email reports for stakeholder review
- Dashboard integration for real-time monitoring

## Best Practices

### Development Workflow
1. Run validation locally before committing
2. Use `--fix` flag during development
3. Generate reports for code reviews
4. Validate on feature branch before merging

### Production Deployment
1. Always run in strict mode for production
2. Generate and review detailed reports
3. Ensure 90%+ score for critical deployments
4. Document any conditional deployments

### Team Collaboration
1. Share HTML reports with stakeholders
2. Track improvement over time
3. Set team standards for minimum scores
4. Use in CI/CD pipeline for quality gates

## Troubleshooting

### Common Issues
- **Build timeouts**: Increase `buildTime` threshold
- **Memory issues**: Check for memory leaks in tests
- **Security false positives**: Update sensitive patterns
- **Performance variations**: Account for CI environment differences

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* node scripts/pre-deployment-check.js

# Check specific category
node scripts/pre-deployment-check.js --category=security
```

## Advanced Features

### Custom Validation Rules
Extend the script with project-specific validation:
```javascript
// Add custom category
const customChecks = {
  accessibility: async () => {
    // Custom accessibility validation
  },
  
  compliance: async () => {
    // Regulatory compliance checks
  }
};
```

### Integration APIs
```javascript
// Use validation results in other tools
const results = require('./scripts/pre-deployment-check.js');
const score = results.overall.score;

if (score < 90) {
  // Notify team, block deployment, etc.
}
```

---

**🎯 The pre-deployment validation script ensures consistent, reliable deployments by providing comprehensive quality gates and clear decision criteria for production readiness.**