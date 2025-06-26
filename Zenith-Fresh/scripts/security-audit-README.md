# Zenith Platform Security Audit Tool

A comprehensive security auditing tool that performs deep analysis of your Node.js project dependencies to identify vulnerabilities, outdated packages, license compliance issues, malicious packages, and performance bottlenecks.

## Features

### 🛡️ Vulnerability Detection
- **npm audit integration**: Leverages npm's built-in security audit
- **Severity classification**: Critical, High, Moderate, Low vulnerabilities
- **Fix availability**: Identifies which vulnerabilities can be automatically fixed
- **Transitive dependency analysis**: Examines indirect dependencies

### 📦 Package Analysis
- **Outdated package detection**: Identifies major, minor, and patch updates
- **Critical package tracking**: Special attention to core dependencies (React, Next.js, Prisma)
- **Large package identification**: Flags packages over 5MB that may impact performance
- **Version compatibility analysis**: Uses semantic versioning to assess update risks

### ⚖️ License Compliance
- **License scanning**: Checks all dependencies for license compatibility
- **Whitelist enforcement**: Ensures only approved licenses are used
- **Repository tracking**: Links to package repositories for manual review

### 🔍 Malicious Code Detection
- **Pattern matching**: Scans for suspicious code patterns including:
  - `eval()` usage
  - `Function()` constructor calls
  - Child process execution
  - Environment variable access patterns
  - Base64 encoded payloads
  - File system access to sensitive paths

### 📊 Comprehensive Reporting
- **JSON reports**: Machine-readable detailed analysis
- **Markdown reports**: Human-readable formatted reports
- **Terminal output**: Color-coded summary with recommendations
- **Historical tracking**: Timestamps for trend analysis

### 🔧 Automated Fixes
- **Safe patching**: Automatically applies patch-level updates
- **Vulnerability fixes**: Runs `npm audit fix` when safe
- **Package lock updates**: Ensures lockfile consistency
- **Breaking change detection**: Warns about major version updates

## Usage

### Basic Security Audit
```bash
npm run security:scan
```

### Security Audit with Automated Fixes
```bash
npm run security:scan:fix
```

### Direct Script Execution
```bash
node scripts/security-audit.js
node scripts/security-audit.js --fix
```

## Configuration

The tool can be configured by modifying the `config` object in `security-audit.js`:

```javascript
const config = {
  // Allowed licenses (packages with other licenses will be flagged)
  allowedLicenses: [
    'MIT', 'ISC', 'BSD-3-Clause', 'BSD-2-Clause', 'Apache-2.0', 
    'CC0-1.0', 'Unlicense', '0BSD', 'CC-BY-4.0', 'CC-BY-SA-4.0'
  ],
  
  // Critical packages that require special attention
  criticalPackages: [
    'react', 'next', 'prisma', 'stripe', 'next-auth', '@auth/prisma-adapter'
  ],
  
  // Suspicious code patterns to detect
  maliciousPatterns: [
    /eval\s*\(/,
    /Function\s*\(/,
    /child_process/,
    // ... more patterns
  ]
};
```

## Report Output

The tool generates three types of reports:

### 1. Terminal Output
- Color-coded summary
- Severity-based vulnerability counts
- Prioritized recommendations
- Progress indicators

### 2. JSON Report (`security-audit-report.json`)
```json
{
  "timestamp": "2025-06-26T01:01:21.076Z",
  "summary": {
    "totalPackages": 1198,
    "vulnerabilities": { "critical": 0, "high": 7, "moderate": 0, "low": 2 },
    "outdated": { "major": 13, "minor": 2, "patch": 0 },
    "licenseIssues": 0,
    "maliciousRisk": 28,
    "largePackages": 1
  },
  "details": {
    "vulnerabilities": [...],
    "outdated": [...],
    "licenseIssues": [...],
    "maliciousRisk": [...],
    "largePackages": [...]
  },
  "recommendations": [...],
  "fixes": [...]
}
```

### 3. Markdown Report (`security-audit-report.md`)
- Human-readable format
- Organized sections
- Actionable recommendations
- Perfect for team sharing and documentation

## Understanding the Results

### Vulnerability Severity Levels
- **Critical**: Immediate action required, potential for system compromise
- **High**: Should be fixed soon, significant security risk
- **Moderate**: Should be addressed in regular maintenance
- **Low**: Monitor and fix when convenient

### Package Update Types
- **Major**: Breaking changes likely, requires testing
- **Minor**: New features, should be backward compatible
- **Patch**: Bug fixes, safe to update

### Suspicious Pattern Categories
- **Code Execution**: `eval()`, `Function()` constructor
- **Process Control**: `child_process`, `.exec()`, `.spawn()`
- **Environment Access**: Reading sensitive environment variables
- **File System**: Accessing system files or directories
- **Encoded Payloads**: Base64 or other encoded content

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Security Audit
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run security:scan
      - uses: actions/upload-artifact@v4
        with:
          name: security-reports
          path: |
            security-audit-report.json
            security-audit-report.md
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit
npm run security:scan
if [ $? -ne 0 ]; then
  echo "Security audit failed. Please review and fix issues."
  exit 1
fi
```

## Best Practices

### Regular Auditing
- Run security audits weekly or before releases
- Monitor for new vulnerabilities in existing dependencies
- Keep package-lock.json under version control

### Vulnerability Management
- Prioritize critical and high-severity vulnerabilities
- Test major version updates in staging environments
- Document accepted risks for false positives

### License Compliance
- Review new dependencies before adding them
- Maintain an approved license list
- Document license exceptions with legal team approval

### Performance Optimization
- Monitor package sizes and bundle impact
- Consider lighter alternatives for large packages
- Use tree-shaking and code splitting

## Troubleshooting

### Common Issues

**"No package-lock.json found"**
- Solution: Run `npm install` to generate the lock file

**"Failed to parse npm audit output"**
- Solution: Ensure npm is updated to latest version
- Try: `npm install -g npm@latest`

**"Undici engine mismatch warnings"**
- Solution: Update Node.js to version 20.18.1 or higher
- Alternative: Add engine override in package.json

**"High number of suspicious packages"**
- Note: Many patterns are legitimate in their context
- Review the specific patterns and files flagged
- Consider whitelisting known-safe packages

### Performance Optimization

For large codebases:
- The tool limits scans to first 50 files per package
- Package size checks are limited to top 20 dependencies
- License checks may be rate-limited by npm registry

## Security Considerations

This tool itself follows security best practices:
- No external API calls beyond npm registry
- No sensitive data storage or transmission
- Read-only file system access for analysis
- Sandboxed execution environment

## Contributing

To add new security patterns or improve detection:

1. Update `maliciousPatterns` array in config
2. Add corresponding documentation
3. Test against known safe and unsafe packages
4. Consider false positive rates

## Support

For issues or feature requests:
1. Check existing security reports for similar cases
2. Review the generated JSON report for details
3. Consider if the issue is a false positive
4. Update configuration as needed

---

**Security Notice**: This tool provides analysis and recommendations but cannot guarantee complete security. Always review findings manually and follow your organization's security policies.