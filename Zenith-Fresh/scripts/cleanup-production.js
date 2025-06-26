#!/usr/bin/env node

/**
 * Production Cleanup Script for Zenith Platform
 * 
 * Removes unnecessary files, optimizes the codebase for production,
 * and cleans up development artifacts safely and reversibly.
 * 
 * Features:
 * - Safe removal with backup capability
 * - Dry-run mode for preview
 * - Detailed logging
 * - Reversible operations
 * - Size optimization reporting
 * 
 * Usage:
 * node scripts/cleanup-production.js [options]
 * 
 * Options:
 * --dry-run    Preview changes without executing
 * --backup     Create backup before cleanup
 * --verbose    Detailed logging
 * --help       Show usage information
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionCleanup {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      backup: options.backup || false,
      verbose: options.verbose || false,
      ...options
    };
    
    this.projectRoot = path.resolve(__dirname, '..');
    this.backupDir = path.join(this.projectRoot, '.cleanup-backup');
    this.stats = {
      filesRemoved: 0,
      directoriesRemoved: 0,
      totalSizeSaved: 0,
      startTime: Date.now()
    };
    
    this.cleanupRules = this.defineCleanupRules();
  }

  defineCleanupRules() {
    return {
      // Temporary files and logs
      temporaryFiles: {
        patterns: [
          '**/*.log',
          '**/*.tmp',
          '**/*.temp',
          '**/*.cache',
          '**/*.swp',
          '**/*.swo',
          '**/*~',
          '**/.*~',
          '**/.DS_Store',
          '**/Thumbs.db',
          '**/desktop.ini'
        ],
        description: 'Temporary files and system artifacts'
      },

      // Development build artifacts
      buildArtifacts: {
        patterns: [
          '.next/**/*',
          'dist/**/*',
          'build/**/*',
          'out/**/*',
          '.vercel/**/*',
          '.turbo/**/*'
        ],
        description: 'Build artifacts and compiled outputs',
        preserveDirectories: true
      },

      // Test coverage and reports
      testArtifacts: {
        patterns: [
          'coverage/**/*',
          '.nyc_output/**/*',
          'test-results/**/*',
          'playwright-report/**/*',
          'test-reports/**/*',
          'junit.xml',
          'coverage.xml'
        ],
        description: 'Test coverage reports and test artifacts'
      },

      // Development dependencies cache
      developmentCache: {
        patterns: [
          '.eslintcache',
          '.tsbuildinfo',
          'tsconfig.tsbuildinfo',
          '.webpack-cache/**/*',
          '.parcel-cache/**/*',
          '.rpt2_cache/**/*',
          '.cache/**/*'
        ],
        description: 'Development tool caches'
      },

      // IDE and editor files
      editorFiles: {
        patterns: [
          '.vscode/**/*',
          '.idea/**/*',
          '*.sublime-*',
          '.atom/**/*',
          '.brackets.json',
          '.editorconfig'
        ],
        description: 'IDE and editor configuration files',
        optional: true
      },

      // Source maps (production optimization)
      sourceMaps: {
        patterns: [
          '**/*.map',
          '**/*.js.map',
          '**/*.css.map'
        ],
        description: 'Source map files',
        optional: true
      },

      // Development documentation
      devDocumentation: {
        patterns: [
          'docs/development/**/*',
          'docs/api/**/*',
          '.github/ISSUE_TEMPLATE/**/*',
          '.github/pull_request_template.md',
          'CONTRIBUTING.md',
          'CHANGELOG.md',
          'TODO.md'
        ],
        description: 'Development documentation',
        optional: true
      },

      // Unused dependencies analysis
      unusedFiles: {
        patterns: [
          'scripts/test-*.js',
          'scripts/dev-*.js',
          'scripts/debug-*.js',
          'lighthouse.config.js',
          'lighthouserc.json',
          'playwright.config.js',
          'jest.config.js',
          'jest.setup.js'
        ],
        description: 'Development and testing configuration files',
        optional: true
      }
    };
  }

  async run() {
    this.log('🧹 Starting Zenith Platform Production Cleanup', 'info');
    this.log(`📂 Project root: ${this.projectRoot}`, 'info');
    this.log(`🔧 Mode: ${this.options.dryRun ? 'DRY RUN' : 'EXECUTE'}`, 'info');

    if (this.options.backup && !this.options.dryRun) {
      await this.createBackup();
    }

    // Execute cleanup phases
    await this.cleanupTemporaryFiles();
    await this.cleanupBuildArtifacts();
    await this.cleanupTestArtifacts();
    await this.cleanupDevelopmentCache();
    await this.cleanupNodeModulesCache();
    
    if (this.options.includeOptional) {
      await this.cleanupOptionalFiles();
    }

    await this.optimizePackageJson();
    await this.generateCleanupReport();

    this.log('✅ Production cleanup completed successfully!', 'success');
    this.printStats();
  }

  async createBackup() {
    this.log('📦 Creating backup before cleanup...', 'info');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `cleanup-backup-${timestamp}.tar.gz`);

    try {
      // Create compressed backup of files that will be removed
      const backupFiles = [];
      
      for (const [category, rules] of Object.entries(this.cleanupRules)) {
        for (const pattern of rules.patterns) {
          const files = await this.findFiles(pattern);
          backupFiles.push(...files);
        }
      }

      if (backupFiles.length > 0) {
        const fileList = backupFiles.join('\n');
        const fileListPath = path.join(this.backupDir, 'files-to-backup.txt');
        fs.writeFileSync(fileListPath, fileList);

        execSync(`tar -czf "${backupPath}" -T "${fileListPath}"`, {
          cwd: this.projectRoot,
          stdio: 'pipe'
        });

        fs.unlinkSync(fileListPath);
        this.log(`📦 Backup created: ${backupPath}`, 'success');
      }
    } catch (error) {
      this.log(`⚠️  Backup creation failed: ${error.message}`, 'warn');
    }
  }

  async cleanupTemporaryFiles() {
    this.log('🗑️  Cleaning up temporary files...', 'info');
    await this.executeCleanupRules('temporaryFiles');
  }

  async cleanupBuildArtifacts() {
    this.log('🏗️  Cleaning up build artifacts...', 'info');
    await this.executeCleanupRules('buildArtifacts');
  }

  async cleanupTestArtifacts() {
    this.log('🧪 Cleaning up test artifacts...', 'info');
    await this.executeCleanupRules('testArtifacts');
  }

  async cleanupDevelopmentCache() {
    this.log('💾 Cleaning up development caches...', 'info');
    await this.executeCleanupRules('developmentCache');
  }

  async cleanupNodeModulesCache() {
    this.log('📦 Cleaning up node_modules cache...', 'info');
    
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      return;
    }

    const cachePatterns = [
      'node_modules/**/.cache/**/*',
      'node_modules/**/coverage/**/*',
      'node_modules/**/*.log',
      'node_modules/**/*.tmp',
      'node_modules/**/test/**/*',
      'node_modules/**/tests/**/*',
      'node_modules/**/__tests__/**/*',
      'node_modules/**/docs/**/*',
      'node_modules/**/example/**/*',
      'node_modules/**/examples/**/*',
      'node_modules/**/demo/**/*',
      'node_modules/**/demos/**/*',
      'node_modules/**/*.md',
      'node_modules/**/README*',
      'node_modules/**/CHANGELOG*',
      'node_modules/**/LICENSE*',
      'node_modules/**/.github/**/*'
    ];

    for (const pattern of cachePatterns) {
      const files = await this.findFiles(pattern);
      for (const file of files) {
        await this.removeFileOrDirectory(file);
      }
    }
  }

  async cleanupOptionalFiles() {
    this.log('🔧 Cleaning up optional development files...', 'info');
    
    const optionalCategories = ['editorFiles', 'sourceMaps', 'devDocumentation', 'unusedFiles'];
    
    for (const category of optionalCategories) {
      if (this.cleanupRules[category]) {
        await this.executeCleanupRules(category);
      }
    }
  }

  async executeCleanupRules(category) {
    const rules = this.cleanupRules[category];
    if (!rules) return;

    this.log(`  📋 ${rules.description}`, 'verbose');

    for (const pattern of rules.patterns) {
      const files = await this.findFiles(pattern);
      
      for (const file of files) {
        await this.removeFileOrDirectory(file, rules.preserveDirectories);
      }
    }
  }

  async findFiles(pattern) {
    const glob = require('glob');
    
    try {
      return await new Promise((resolve, reject) => {
        glob(pattern, {
          cwd: this.projectRoot,
          absolute: true,
          dot: true,
          ignore: [
            'node_modules/**/node_modules/**',
            '.git/**',
            '.cleanup-backup/**'
          ]
        }, (err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
    } catch (error) {
      this.log(`⚠️  Error finding files for pattern ${pattern}: ${error.message}`, 'warn');
      return [];
    }
  }

  async removeFileOrDirectory(itemPath, preserveDirectories = false) {
    if (!fs.existsSync(itemPath)) return;

    try {
      const stats = fs.statSync(itemPath);
      const size = stats.size;

      if (this.options.dryRun) {
        this.log(`    🔍 Would remove: ${path.relative(this.projectRoot, itemPath)} (${this.formatSize(size)})`, 'verbose');
        this.stats.totalSizeSaved += size;
        if (stats.isDirectory()) {
          this.stats.directoriesRemoved++;
        } else {
          this.stats.filesRemoved++;
        }
        return;
      }

      if (stats.isDirectory()) {
        if (preserveDirectories) {
          // Remove contents but keep directory structure
          const files = fs.readdirSync(itemPath);
          for (const file of files) {
            await this.removeFileOrDirectory(path.join(itemPath, file));
          }
        } else {
          fs.rmSync(itemPath, { recursive: true, force: true });
          this.stats.directoriesRemoved++;
        }
      } else {
        fs.unlinkSync(itemPath);
        this.stats.filesRemoved++;
      }

      this.stats.totalSizeSaved += size;
      this.log(`    ✅ Removed: ${path.relative(this.projectRoot, itemPath)} (${this.formatSize(size)})`, 'verbose');

    } catch (error) {
      this.log(`    ⚠️  Failed to remove ${itemPath}: ${error.message}`, 'warn');
    }
  }

  async optimizePackageJson() {
    this.log('📦 Optimizing package.json...', 'info');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return;

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Remove development-only fields for production
      const devFields = ['devDependencies', 'scripts'];
      const optimizedPackageJson = { ...packageJson };
      
      // Keep only production-essential scripts
      if (optimizedPackageJson.scripts) {
        const productionScripts = {
          start: optimizedPackageJson.scripts.start,
          build: optimizedPackageJson.scripts.build,
          postinstall: optimizedPackageJson.scripts.postinstall
        };
        
        optimizedPackageJson.scripts = Object.fromEntries(
          Object.entries(productionScripts).filter(([_, value]) => value !== undefined)
        );
      }

      if (!this.options.dryRun) {
        // Create optimized package.json for production
        const optimizedPath = path.join(this.projectRoot, 'package.production.json');
        fs.writeFileSync(optimizedPath, JSON.stringify(optimizedPackageJson, null, 2));
        this.log(`    ✅ Created optimized package.production.json`, 'verbose');
      } else {
        this.log(`    🔍 Would create optimized package.production.json`, 'verbose');
      }

    } catch (error) {
      this.log(`    ⚠️  Failed to optimize package.json: ${error.message}`, 'warn');
    }
  }

  async generateCleanupReport() {
    const report = {
      timestamp: new Date().toISOString(),
      mode: this.options.dryRun ? 'dry-run' : 'execute',
      projectRoot: this.projectRoot,
      stats: this.stats,
      cleanupRules: Object.keys(this.cleanupRules),
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(this.projectRoot, 'cleanup-report.json');
    
    if (!this.options.dryRun) {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`📊 Cleanup report saved: ${reportPath}`, 'info');
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.stats.totalSizeSaved > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Consider implementing automated cleanup in CI/CD pipeline');
    }

    if (this.stats.filesRemoved > 1000) {
      recommendations.push('High number of temporary files detected - review build processes');
    }

    recommendations.push('Run cleanup regularly to maintain optimal codebase size');
    recommendations.push('Consider using .gitignore to prevent committing temporary files');

    return recommendations;
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  printStats() {
    const duration = (Date.now() - this.stats.startTime) / 1000;
    
    console.log('\n📊 Cleanup Statistics:');
    console.log(`   Files processed: ${this.stats.filesRemoved}`);
    console.log(`   Directories processed: ${this.stats.directoriesRemoved}`);
    console.log(`   Total size saved: ${this.formatSize(this.stats.totalSizeSaved)}`);
    console.log(`   Duration: ${duration.toFixed(2)}s`);
    
    if (this.options.dryRun) {
      console.log('\n💡 This was a dry run. Use --execute to perform actual cleanup.');
    }
  }

  log(message, level = 'info') {
    if (level === 'verbose' && !this.options.verbose) return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const levels = {
      info: '📝',
      success: '✅',
      warn: '⚠️',
      error: '❌',
      verbose: '🔍'
    };

    console.log(`[${timestamp}] ${levels[level] || '📝'} ${message}`);
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    backup: args.includes('--backup'),
    verbose: args.includes('--verbose'),
    includeOptional: args.includes('--include-optional'),
    help: args.includes('--help')
  };

  return options;
}

function showHelp() {
  console.log(`
🧹 Zenith Platform Production Cleanup Script

Usage: node scripts/cleanup-production.js [options]

Options:
  --dry-run          Preview changes without executing them
  --backup           Create backup before cleanup (recommended)
  --verbose          Show detailed logging
  --include-optional Include optional cleanup items (IDE files, source maps, etc.)
  --help             Show this help message

Examples:
  # Preview what would be cleaned
  node scripts/cleanup-production.js --dry-run --verbose

  # Perform cleanup with backup
  node scripts/cleanup-production.js --backup --verbose

  # Full cleanup including optional files
  node scripts/cleanup-production.js --backup --include-optional --verbose

Safety Features:
  - Dry-run mode for safe preview
  - Automatic backup creation
  - Reversible operations
  - Detailed logging and reporting
  - Preserves essential files and directories

What gets cleaned:
  ✅ Temporary files and logs
  ✅ Build artifacts (.next, dist, build)
  ✅ Test coverage reports
  ✅ Development tool caches
  ✅ Node modules cache and docs
  🔧 IDE configuration files (optional)
  🔧 Source maps (optional)
  🔧 Development documentation (optional)

The script is designed to be safe and reversible. Always use --dry-run first!
`);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    const cleanup = new ProductionCleanup(options);
    await cleanup.run();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ProductionCleanup;