#!/usr/bin/env node

/**
 * Quick Security Check - Simplified wrapper for security audit
 * Provides a fast overview of security status
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function quickSecurityCheck() {
  console.log(`${colors.bright}${colors.blue}⚡ Quick Security Check${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    // Check if we can run npm audit
    console.log(`${colors.cyan}Checking for vulnerabilities...${colors.reset}`);
    
    let vulnerabilities = { critical: 0, high: 0, moderate: 0, low: 0 };
    let hasIssues = false;
    
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.metadata && auditData.metadata.vulnerabilities) {
        vulnerabilities = auditData.metadata.vulnerabilities;
        hasIssues = Object.values(vulnerabilities).some(count => count > 0);
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          if (auditData.metadata && auditData.metadata.vulnerabilities) {
            vulnerabilities = auditData.metadata.vulnerabilities;
            hasIssues = Object.values(vulnerabilities).some(count => count > 0);
          }
        } catch {
          console.log(`${colors.yellow}⚠️  Could not parse audit results${colors.reset}`);
        }
      }
    }
    
    // Check for outdated packages
    console.log(`${colors.cyan}Checking for outdated packages...${colors.reset}`);
    
    let outdatedCount = 0;
    
    try {
      execSync('npm outdated --json', { encoding: 'utf8' });
    } catch (error) {
      if (error.stdout) {
        try {
          const outdatedData = JSON.parse(error.stdout || '{}');
          outdatedCount = Object.keys(outdatedData).length;
        } catch {
          // Ignore parsing errors
        }
      }
    }
    
    // Display quick summary
    console.log(`\n${colors.bright}📊 Quick Security Summary${colors.reset}`);
    console.log(`${'─'.repeat(40)}`);
    
    // Vulnerabilities
    const totalVulns = Object.values(vulnerabilities).reduce((a, b) => a + b, 0);
    if (totalVulns > 0) {
      console.log(`\n${colors.bright}🚨 Vulnerabilities Found: ${totalVulns}${colors.reset}`);
      if (vulnerabilities.critical > 0) {
        console.log(`  ${colors.red}● Critical: ${vulnerabilities.critical}${colors.reset}`);
      }
      if (vulnerabilities.high > 0) {
        console.log(`  ${colors.red}● High: ${vulnerabilities.high}${colors.reset}`);
      }
      if (vulnerabilities.moderate > 0) {
        console.log(`  ${colors.yellow}● Moderate: ${vulnerabilities.moderate}${colors.reset}`);
      }
      if (vulnerabilities.low > 0) {
        console.log(`  ${colors.green}● Low: ${vulnerabilities.low}${colors.reset}`);
      }
    } else {
      console.log(`\n${colors.green}✅ No vulnerabilities found${colors.reset}`);
    }
    
    // Outdated packages
    if (outdatedCount > 0) {
      console.log(`\n${colors.yellow}📦 Outdated packages: ${outdatedCount}${colors.reset}`);
    } else {
      console.log(`\n${colors.green}✅ All packages up to date${colors.reset}`);
    }
    
    // Quick recommendations
    console.log(`\n${colors.bright}💡 Quick Actions:${colors.reset}`);
    
    if (totalVulns > 0) {
      console.log(`  ${colors.cyan}→ Run: npm audit fix${colors.reset}`);
      console.log(`  ${colors.cyan}→ Run: npm run security:scan${colors.reset} (detailed report)`);
    }
    
    if (outdatedCount > 0) {
      console.log(`  ${colors.cyan}→ Run: npm update${colors.reset} (safe updates)`);
      console.log(`  ${colors.cyan}→ Run: npm outdated${colors.reset} (see details)`);
    }
    
    if (totalVulns > 0 || outdatedCount > 0) {
      console.log(`  ${colors.cyan}→ Run: npm run security:scan:fix${colors.reset} (automated fixes)`);
    }
    
    // Overall status
    const elapsedTime = Date.now() - startTime;
    console.log(`\n${'─'.repeat(40)}`);
    
    if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
      console.log(`${colors.red}🔴 SECURITY ISSUES FOUND - Action required${colors.reset}`);
    } else if (totalVulns > 0 || outdatedCount > 5) {
      console.log(`${colors.yellow}🟡 Minor issues found - Consider updating${colors.reset}`);
    } else {
      console.log(`${colors.green}🟢 Security status looks good${colors.reset}`);
    }
    
    console.log(`${colors.blue}⏱️  Completed in ${elapsedTime}ms${colors.reset}\n`);
    
    // Exit with appropriate code
    if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
      process.exit(1);
    } else if (totalVulns > 0) {
      process.exit(2);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Quick security check failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  quickSecurityCheck();
}

module.exports = quickSecurityCheck;