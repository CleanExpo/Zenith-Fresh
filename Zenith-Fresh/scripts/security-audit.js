#!/usr/bin/env node

/**
 * Comprehensive Security Audit and Dependency Scanner
 * Checks for vulnerabilities, outdated packages, license compliance, and malicious packages
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const semver = require('semver');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Security audit configuration
const config = {
  npmRegistryUrl: 'https://registry.npmjs.org',
  bundlephobiaUrl: 'https://bundlephobia.com/api/size',
  maliciousPatterns: [
    /eval\s*\(/,
    /Function\s*\(/,
    /child_process/,
    /\.exec\s*\(/,
    /\.spawn\s*\(/,
    /crypto\.createCipher/,
    /\.readFileSync.*\/etc\/passwd/,
    /process\.env\.(npm_token|github_token|aws)/i,
    /Buffer\s*\.\s*from\s*\(\s*['"]\s*[A-Za-z0-9+/=]+\s*['"]\s*,\s*['"]base64['"]\s*\)/
  ],
  allowedLicenses: [
    'MIT', 'ISC', 'BSD-3-Clause', 'BSD-2-Clause', 'Apache-2.0', 
    'CC0-1.0', 'Unlicense', '0BSD', 'CC-BY-4.0', 'CC-BY-SA-4.0'
  ],
  criticalPackages: [
    'react', 'next', 'prisma', 'stripe', 'next-auth', '@auth/prisma-adapter'
  ]
};

class SecurityAuditor {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPackages: 0,
        vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0 },
        outdated: { major: 0, minor: 0, patch: 0 },
        licenseIssues: 0,
        maliciousRisk: 0,
        largePackages: 0
      },
      details: {
        vulnerabilities: [],
        outdated: [],
        licenseIssues: [],
        maliciousRisk: [],
        largePackages: []
      },
      recommendations: [],
      fixes: []
    };
  }

  async run() {
    console.log(`${colors.bright}${colors.blue}🔒 Zenith Platform Security Audit${colors.reset}\n`);
    
    try {
      // Check if package-lock.json exists
      await this.ensureLockFile();
      
      // Run multiple security checks
      await Promise.all([
        this.runNpmAudit(),
        this.checkOutdatedPackages(),
        this.analyzeLicenses(),
        this.scanForMaliciousCode(),
        this.checkPackageSizes()
      ]);
      
      // Generate recommendations
      this.generateRecommendations();
      
      // Display report
      this.displayReport();
      
      // Save detailed report
      await this.saveReport();
      
      // Attempt automated fixes if requested
      if (process.argv.includes('--fix')) {
        await this.attemptFixes();
      }
      
    } catch (error) {
      console.error(`${colors.red}Error during security audit: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  async ensureLockFile() {
    try {
      await fs.access(path.join(process.cwd(), 'package-lock.json'));
    } catch {
      console.log(`${colors.yellow}No package-lock.json found. Running npm install...${colors.reset}`);
      execSync('npm install', { stdio: 'inherit' });
    }
  }

  async runNpmAudit() {
    console.log(`${colors.cyan}Running npm audit...${colors.reset}`);
    
    try {
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([pkg, data]) => {
          if (data.severity) {
            this.report.summary.vulnerabilities[data.severity]++;
            this.report.details.vulnerabilities.push({
              package: pkg,
              severity: data.severity,
              via: data.via,
              fixAvailable: data.fixAvailable,
              nodes: data.nodes
            });
          }
        });
      }
      
      this.report.summary.totalPackages = Object.keys(auditData.vulnerabilities || {}).length;
      
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout);
          this.processAuditData(auditData);
        } catch {
          console.error(`${colors.red}Failed to parse npm audit output${colors.reset}`);
        }
      }
    }
  }

  processAuditData(auditData) {
    if (auditData.metadata) {
      this.report.summary.totalPackages = auditData.metadata.totalDependencies || 0;
      
      Object.entries(auditData.metadata.vulnerabilities || {}).forEach(([severity, count]) => {
        if (count > 0) {
          this.report.summary.vulnerabilities[severity] = count;
        }
      });
    }
    
    if (auditData.vulnerabilities) {
      Object.entries(auditData.vulnerabilities).forEach(([pkg, data]) => {
        this.report.details.vulnerabilities.push({
          package: pkg,
          severity: data.severity,
          title: data.title,
          url: data.url,
          fixAvailable: data.fixAvailable,
          via: data.via
        });
      });
    }
  }

  async checkOutdatedPackages() {
    console.log(`${colors.cyan}Checking for outdated packages...${colors.reset}`);
    
    try {
      const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdatedData = JSON.parse(outdatedOutput || '{}');
      
      Object.entries(outdatedData).forEach(([pkg, data]) => {
        const current = data.current;
        const wanted = data.wanted;
        const latest = data.latest;
        
        if (current && latest && semver.valid(current) && semver.valid(latest)) {
          const diff = semver.diff(current, latest);
          
          if (diff) {
            if (diff === 'major') this.report.summary.outdated.major++;
            else if (diff === 'minor') this.report.summary.outdated.minor++;
            else if (diff === 'patch') this.report.summary.outdated.patch++;
            
            this.report.details.outdated.push({
              package: pkg,
              current,
              wanted,
              latest,
              type: diff,
              isCritical: config.criticalPackages.includes(pkg)
            });
          }
        }
      });
    } catch (error) {
      // npm outdated returns non-zero exit code when packages are outdated
      if (error.stdout) {
        try {
          const outdatedData = JSON.parse(error.stdout || '{}');
          this.processOutdatedData(outdatedData);
        } catch {
          // Silently continue if parsing fails
        }
      }
    }
  }

  processOutdatedData(outdatedData) {
    Object.entries(outdatedData).forEach(([pkg, data]) => {
      const current = data.current;
      const latest = data.latest;
      
      if (current && latest && semver.valid(current) && semver.valid(latest)) {
        const diff = semver.diff(current, latest);
        
        if (diff) {
          if (diff === 'major') this.report.summary.outdated.major++;
          else if (diff === 'minor') this.report.summary.outdated.minor++;
          else if (diff === 'patch') this.report.summary.outdated.patch++;
          
          this.report.details.outdated.push({
            package: pkg,
            current,
            wanted: data.wanted,
            latest,
            type: diff,
            isCritical: config.criticalPackages.includes(pkg)
          });
        }
      }
    });
  }

  async analyzeLicenses() {
    console.log(`${colors.cyan}Analyzing licenses...${colors.reset}`);
    
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const [pkg, version] of Object.entries(allDeps)) {
        try {
          const packageInfo = await this.fetchPackageInfo(pkg);
          
          if (packageInfo && packageInfo.license) {
            const license = packageInfo.license;
            
            if (!config.allowedLicenses.includes(license)) {
              this.report.summary.licenseIssues++;
              this.report.details.licenseIssues.push({
                package: pkg,
                license,
                version,
                repository: packageInfo.repository
              });
            }
          }
        } catch (error) {
          // Skip packages that can't be fetched
        }
      }
    } catch (error) {
      console.error(`${colors.red}Failed to analyze licenses: ${error.message}${colors.reset}`);
    }
  }

  async scanForMaliciousCode() {
    console.log(`${colors.cyan}Scanning for potentially malicious patterns...${colors.reset}`);
    
    try {
      const nodeModulesPath = path.join(process.cwd(), 'node_modules');
      const suspiciousPackages = [];
      
      // Get list of direct dependencies
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies });
      
      for (const dep of deps) {
        const depPath = path.join(nodeModulesPath, dep);
        
        try {
          const files = await this.getAllFiles(depPath, ['.js', '.ts']);
          let suspiciousPatterns = [];
          
          for (const file of files.slice(0, 50)) { // Limit to first 50 files per package
            try {
              const content = await fs.readFile(file, 'utf8');
              
              config.maliciousPatterns.forEach((pattern, index) => {
                if (pattern.test(content)) {
                  suspiciousPatterns.push({
                    pattern: config.maliciousPatterns[index].toString(),
                    file: path.relative(depPath, file)
                  });
                }
              });
            } catch {
              // Skip files that can't be read
            }
          }
          
          if (suspiciousPatterns.length > 0) {
            this.report.summary.maliciousRisk++;
            this.report.details.maliciousRisk.push({
              package: dep,
              patterns: suspiciousPatterns.slice(0, 5) // Limit to 5 patterns per package
            });
          }
        } catch {
          // Skip packages that can't be scanned
        }
      }
    } catch (error) {
      console.error(`${colors.red}Failed to scan for malicious code: ${error.message}${colors.reset}`);
    }
  }

  async checkPackageSizes() {
    console.log(`${colors.cyan}Checking package sizes...${colors.reset}`);
    
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const deps = Object.keys(packageJson.dependencies || {});
      
      for (const dep of deps.slice(0, 20)) { // Check top 20 dependencies
        try {
          const size = await this.getPackageSize(dep);
          
          if (size && size > 5 * 1024 * 1024) { // 5MB threshold
            this.report.summary.largePackages++;
            this.report.details.largePackages.push({
              package: dep,
              size: size,
              sizeHuman: this.formatBytes(size)
            });
          }
        } catch {
          // Skip packages that can't be sized
        }
      }
    } catch (error) {
      console.error(`${colors.red}Failed to check package sizes: ${error.message}${colors.reset}`);
    }
  }

  async fetchPackageInfo(packageName) {
    return new Promise((resolve, reject) => {
      https.get(`${config.npmRegistryUrl}/${packageName}`, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const packageData = JSON.parse(data);
            resolve(packageData['dist-tags'] ? {
              license: packageData.license,
              repository: packageData.repository
            } : null);
          } catch {
            resolve(null);
          }
        });
      }).on('error', reject);
    });
  }

  async getPackageSize(packageName) {
    try {
      const stats = await fs.stat(path.join(process.cwd(), 'node_modules', packageName));
      if (stats.isDirectory()) {
        return await this.getDirectorySize(path.join(process.cwd(), 'node_modules', packageName));
      }
      return 0;
    } catch {
      return 0;
    }
  }

  async getDirectorySize(dirPath) {
    let size = 0;
    
    try {
      const files = await fs.readdir(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          size += await this.getDirectorySize(filePath);
        } else {
          size += stats.size;
        }
      }
    } catch {
      // Skip directories that can't be read
    }
    
    return size;
  }

  async getAllFiles(dirPath, extensions) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...await this.getAllFiles(fullPath, extensions));
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
    
    return files;
  }

  generateRecommendations() {
    const { summary } = this.report;
    
    // Critical vulnerabilities
    if (summary.vulnerabilities.critical > 0) {
      this.report.recommendations.push({
        priority: 'CRITICAL',
        message: `Fix ${summary.vulnerabilities.critical} critical vulnerabilities immediately`,
        action: 'Run: npm audit fix --force'
      });
    }
    
    // High vulnerabilities
    if (summary.vulnerabilities.high > 0) {
      this.report.recommendations.push({
        priority: 'HIGH',
        message: `Address ${summary.vulnerabilities.high} high severity vulnerabilities`,
        action: 'Run: npm audit fix'
      });
    }
    
    // Major version updates
    if (summary.outdated.major > 0) {
      this.report.recommendations.push({
        priority: 'MEDIUM',
        message: `${summary.outdated.major} packages have major version updates available`,
        action: 'Review breaking changes before updating'
      });
    }
    
    // License issues
    if (summary.licenseIssues > 0) {
      this.report.recommendations.push({
        priority: 'HIGH',
        message: `${summary.licenseIssues} packages have incompatible licenses`,
        action: 'Review and replace packages with incompatible licenses'
      });
    }
    
    // Malicious patterns
    if (summary.maliciousRisk > 0) {
      this.report.recommendations.push({
        priority: 'CRITICAL',
        message: `${summary.maliciousRisk} packages contain suspicious code patterns`,
        action: 'Investigate and consider removing these packages'
      });
    }
    
    // Large packages
    if (summary.largePackages > 0) {
      this.report.recommendations.push({
        priority: 'LOW',
        message: `${summary.largePackages} packages are unusually large (>5MB)`,
        action: 'Consider lighter alternatives for better performance'
      });
    }
  }

  displayReport() {
    console.log(`\n${colors.bright}📊 Security Audit Report${colors.reset}`);
    console.log(`${'─'.repeat(50)}`);
    
    // Summary
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`Total packages scanned: ${this.report.summary.totalPackages}`);
    
    // Vulnerabilities
    const vulnTotal = Object.values(this.report.summary.vulnerabilities).reduce((a, b) => a + b, 0);
    if (vulnTotal > 0) {
      console.log(`\n${colors.bright}Vulnerabilities: ${vulnTotal}${colors.reset}`);
      console.log(`  ${colors.red}Critical: ${this.report.summary.vulnerabilities.critical}${colors.reset}`);
      console.log(`  ${colors.red}High: ${this.report.summary.vulnerabilities.high}${colors.reset}`);
      console.log(`  ${colors.yellow}Moderate: ${this.report.summary.vulnerabilities.moderate}${colors.reset}`);
      console.log(`  ${colors.green}Low: ${this.report.summary.vulnerabilities.low}${colors.reset}`);
    }
    
    // Outdated packages
    const outdatedTotal = Object.values(this.report.summary.outdated).reduce((a, b) => a + b, 0);
    if (outdatedTotal > 0) {
      console.log(`\n${colors.bright}Outdated Packages: ${outdatedTotal}${colors.reset}`);
      console.log(`  Major: ${this.report.summary.outdated.major}`);
      console.log(`  Minor: ${this.report.summary.outdated.minor}`);
      console.log(`  Patch: ${this.report.summary.outdated.patch}`);
    }
    
    // Other issues
    if (this.report.summary.licenseIssues > 0) {
      console.log(`\n${colors.bright}License Issues: ${this.report.summary.licenseIssues}${colors.reset}`);
    }
    
    if (this.report.summary.maliciousRisk > 0) {
      console.log(`\n${colors.bright}${colors.red}Suspicious Packages: ${this.report.summary.maliciousRisk}${colors.reset}`);
    }
    
    if (this.report.summary.largePackages > 0) {
      console.log(`\n${colors.bright}Large Packages: ${this.report.summary.largePackages}${colors.reset}`);
    }
    
    // Recommendations
    if (this.report.recommendations.length > 0) {
      console.log(`\n${colors.bright}📋 Recommendations:${colors.reset}`);
      this.report.recommendations.forEach((rec, index) => {
        const priorityColor = rec.priority === 'CRITICAL' ? colors.red :
                            rec.priority === 'HIGH' ? colors.yellow :
                            rec.priority === 'MEDIUM' ? colors.blue : colors.green;
        
        console.log(`\n${index + 1}. ${priorityColor}[${rec.priority}]${colors.reset} ${rec.message}`);
        console.log(`   ${colors.cyan}→ ${rec.action}${colors.reset}`);
      });
    }
    
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${colors.green}✓ Audit complete. Full report saved to security-audit-report.json${colors.reset}`);
    
    if (process.argv.includes('--fix')) {
      console.log(`\n${colors.yellow}Attempting automated fixes...${colors.reset}`);
    }
  }

  async saveReport() {
    const reportPath = path.join(process.cwd(), 'security-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
    
    // Also save a markdown report
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(
      path.join(process.cwd(), 'security-audit-report.md'),
      markdownReport
    );
  }

  generateMarkdownReport() {
    let md = `# Security Audit Report\n\n`;
    md += `**Generated:** ${new Date(this.report.timestamp).toLocaleString()}\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Total Packages:** ${this.report.summary.totalPackages}\n`;
    md += `- **Vulnerabilities:** ${Object.values(this.report.summary.vulnerabilities).reduce((a, b) => a + b, 0)}\n`;
    md += `- **Outdated Packages:** ${Object.values(this.report.summary.outdated).reduce((a, b) => a + b, 0)}\n`;
    md += `- **License Issues:** ${this.report.summary.licenseIssues}\n`;
    md += `- **Suspicious Packages:** ${this.report.summary.maliciousRisk}\n`;
    md += `- **Large Packages:** ${this.report.summary.largePackages}\n\n`;
    
    if (this.report.details.vulnerabilities.length > 0) {
      md += `## Vulnerabilities\n\n`;
      this.report.details.vulnerabilities.forEach(vuln => {
        md += `### ${vuln.package}\n`;
        md += `- **Severity:** ${vuln.severity}\n`;
        md += `- **Title:** ${vuln.title || 'N/A'}\n`;
        md += `- **Fix Available:** ${vuln.fixAvailable ? 'Yes' : 'No'}\n\n`;
      });
    }
    
    if (this.report.recommendations.length > 0) {
      md += `## Recommendations\n\n`;
      this.report.recommendations.forEach((rec, index) => {
        md += `${index + 1}. **[${rec.priority}]** ${rec.message}\n`;
        md += `   - Action: ${rec.action}\n\n`;
      });
    }
    
    return md;
  }

  async attemptFixes() {
    console.log(`\n${colors.bright}🔧 Attempting automated fixes...${colors.reset}`);
    
    const fixes = [];
    
    // Fix npm vulnerabilities
    if (Object.values(this.report.summary.vulnerabilities).some(v => v > 0)) {
      try {
        console.log(`${colors.cyan}Running npm audit fix...${colors.reset}`);
        execSync('npm audit fix', { stdio: 'inherit' });
        fixes.push('Ran npm audit fix');
        
        // Check if --force is needed
        const remainingVulns = execSync('npm audit --json', { encoding: 'utf8' });
        const auditData = JSON.parse(remainingVulns);
        
        if (auditData.metadata && auditData.metadata.vulnerabilities) {
          const critical = auditData.metadata.vulnerabilities.critical || 0;
          const high = auditData.metadata.vulnerabilities.high || 0;
          
          if (critical > 0 || high > 0) {
            console.log(`${colors.yellow}Some vulnerabilities require breaking changes. Use --force with caution.${colors.reset}`);
          }
        }
      } catch (error) {
        console.error(`${colors.red}Failed to run npm audit fix${colors.reset}`);
      }
    }
    
    // Update patch versions
    if (this.report.summary.outdated.patch > 0) {
      try {
        console.log(`${colors.cyan}Updating patch versions...${colors.reset}`);
        const outdatedPatch = this.report.details.outdated
          .filter(pkg => pkg.type === 'patch')
          .map(pkg => `${pkg.package}@${pkg.latest}`)
          .join(' ');
        
        if (outdatedPatch) {
          execSync(`npm install ${outdatedPatch}`, { stdio: 'inherit' });
          fixes.push('Updated patch versions');
        }
      } catch (error) {
        console.error(`${colors.red}Failed to update patch versions${colors.reset}`);
      }
    }
    
    // Update package-lock.json
    try {
      console.log(`${colors.cyan}Updating package-lock.json...${colors.reset}`);
      execSync('npm install', { stdio: 'inherit' });
      fixes.push('Updated package-lock.json');
    } catch (error) {
      console.error(`${colors.red}Failed to update package-lock.json${colors.reset}`);
    }
    
    this.report.fixes = fixes;
    
    if (fixes.length > 0) {
      console.log(`\n${colors.green}✓ Applied ${fixes.length} automated fixes${colors.reset}`);
      await this.saveReport(); // Update report with fixes
    } else {
      console.log(`\n${colors.yellow}No automated fixes could be applied${colors.reset}`);
    }
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Run the security audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = SecurityAuditor;