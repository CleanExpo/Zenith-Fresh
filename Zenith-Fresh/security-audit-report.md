# Security Audit Report

**Generated:** 6/26/2025, 11:02:18 AM

## Summary

- **Total Packages:** 0
- **Vulnerabilities:** 18
- **Outdated Packages:** 15
- **License Issues:** 0
- **Suspicious Packages:** 28
- **Large Packages:** 1

## Vulnerabilities

### @lhci/cli
- **Severity:** high
- **Title:** N/A
- **Fix Available:** Yes

### @lhci/utils
- **Severity:** high
- **Title:** N/A
- **Fix Available:** Yes

### @puppeteer/browsers
- **Severity:** high
- **Title:** N/A
- **Fix Available:** Yes

### @sentry/node
- **Severity:** low
- **Title:** N/A
- **Fix Available:** Yes

### cookie
- **Severity:** low
- **Title:** N/A
- **Fix Available:** Yes

### lighthouse
- **Severity:** high
- **Title:** N/A
- **Fix Available:** Yes

### puppeteer-core
- **Severity:** high
- **Title:** N/A
- **Fix Available:** Yes

### tar-fs
- **Severity:** high
- **Title:** N/A
- **Fix Available:** Yes

### ws
- **Severity:** high
- **Title:** N/A
- **Fix Available:** Yes

## Recommendations

1. **[HIGH]** Address 7 high severity vulnerabilities
   - Action: Run: npm audit fix

2. **[MEDIUM]** 13 packages have major version updates available
   - Action: Review breaking changes before updating

3. **[CRITICAL]** 28 packages contain suspicious code patterns
   - Action: Investigate and consider removing these packages

4. **[LOW]** 1 packages are unusually large (>5MB)
   - Action: Consider lighter alternatives for better performance

