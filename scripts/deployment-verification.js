#!/usr/bin/env node

/**
 * COMPREHENSIVE DEPLOYMENT VERIFICATION FRAMEWORK
 * 
 * This script performs systematic verification of deployment readiness
 * and actual deployment success to prevent the "whack-a-mole" pattern
 * of recurring deployment failures.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentVerificationFramework {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.verificationResults = {};
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
        console.log(`${prefix} ${message}`);
    }

    addError(message) {
        this.errors.push(message);
        this.log(message, 'error');
    }

    addWarning(message) {
        this.warnings.push(message);
        this.log(message, 'warning');
    }

    /**
     * TIER 1: VERCEL ENVIRONMENT REPLICATION
     */
    async tier1_VercelEnvironmentReplication() {
        this.log('=== TIER 1: VERCEL ENVIRONMENT REPLICATION ===');
        
        // Check Node.js version compatibility
        try {
            const nodeVersion = process.version;
            this.log(`Current Node.js version: ${nodeVersion}`);
            
            // Vercel typically uses Node 18 or 20
            const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
            if (majorVersion < 18) {
                this.addError(`Node.js version ${nodeVersion} may be incompatible with Vercel (requires 18+)`);
            }
        } catch (error) {
            this.addError(`Failed to check Node.js version: ${error.message}`);
        }

        // Check package.json for Vercel compatibility
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            // Check for problematic dependencies
            const problematicDeps = ['@types/node'];
            for (const dep of problematicDeps) {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    this.addWarning(`${dep} in dependencies should be in devDependencies`);
                }
            }

            // Check Next.js version
            if (packageJson.dependencies.next) {
                this.log(`Next.js version: ${packageJson.dependencies.next}`);
            }

        } catch (error) {
            this.addError(`Failed to analyze package.json: ${error.message}`);
        }

        // Check TypeScript configuration
        const tsConfigExists = fs.existsSync('tsconfig.json');
        this.log(`TypeScript config exists: ${tsConfigExists}`);
        
        if (tsConfigExists) {
            try {
                const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
                if (tsConfig.compilerOptions && tsConfig.compilerOptions.baseUrl) {
                    this.log(`TypeScript baseUrl configured: ${tsConfig.compilerOptions.baseUrl}`);
                }
            } catch (error) {
                this.addError(`Invalid tsconfig.json: ${error.message}`);
            }
        }
    }

    /**
     * TIER 2: AUTOMATED VERIFICATION MATRIX
     */
    async tier2_AutomatedVerificationMatrix() {
        this.log('=== TIER 2: AUTOMATED VERIFICATION MATRIX ===');

        // Test local build
        try {
            this.log('Running local build test...');
            execSync('npm run build', { stdio: 'pipe' });
            this.log('✅ Local build successful');
            this.verificationResults.localBuild = true;
        } catch (error) {
            this.addError(`Local build failed: ${error.message}`);
            this.verificationResults.localBuild = false;
        }

        // Check for critical files
        const criticalFiles = [
            'package.json',
            'next.config.js',
            '.env.production',
            'src/app/layout.tsx',
            'src/app/page.tsx'
        ];

        for (const file of criticalFiles) {
            if (fs.existsSync(file)) {
                this.log(`✅ Critical file exists: ${file}`);
            } else {
                this.addError(`Missing critical file: ${file}`);
            }
        }

        // Check for common Next.js issues
        this.checkNextJsConfiguration();
        this.checkEnvironmentVariables();
    }

    checkNextJsConfiguration() {
        try {
            const nextConfigPath = 'next.config.js';
            if (fs.existsSync(nextConfigPath)) {
                const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
                
                // Check for module resolution configuration
                if (nextConfigContent.includes('webpack') && nextConfigContent.includes('alias')) {
                    this.log('✅ Webpack alias configuration found');
                } else {
                    this.addWarning('No webpack alias configuration found for module resolution');
                }
            }
        } catch (error) {
            this.addWarning(`Could not analyze next.config.js: ${error.message}`);
        }
    }

    checkEnvironmentVariables() {
        const envFiles = ['.env', '.env.production', '.env.local'];
        let foundEnvFile = false;

        for (const envFile of envFiles) {
            if (fs.existsSync(envFile)) {
                foundEnvFile = true;
                this.log(`✅ Environment file found: ${envFile}`);
                
                try {
                    const envContent = fs.readFileSync(envFile, 'utf8');
                    const envVars = envContent.split('\n').filter(line => 
                        line.trim() && !line.startsWith('#') && line.includes('=')
                    );
                    this.log(`Environment variables count in ${envFile}: ${envVars.length}`);
                } catch (error) {
                    this.addWarning(`Could not read ${envFile}: ${error.message}`);
                }
            }
        }

        if (!foundEnvFile) {
            this.addWarning('No environment files found');
        }
    }

    /**
     * TIER 3: CONTINUOUS DEPLOYMENT PIPELINE
     */
    async tier3_ContinuousDeploymentPipeline() {
        this.log('=== TIER 3: DEPLOYMENT PIPELINE VERIFICATION ===');

        // Check Git status
        try {
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            if (gitStatus.trim()) {
                this.addWarning('Uncommitted changes detected');
                this.log(gitStatus);
            } else {
                this.log('✅ Git working directory clean');
            }
        } catch (error) {
            this.addWarning(`Could not check Git status: ${error.message}`);
        }

        // Check if we're ahead of origin
        try {
            const gitLog = execSync('git log --oneline origin/main..HEAD', { encoding: 'utf8' });
            if (gitLog.trim()) {
                this.log('Local commits ahead of origin:');
                this.log(gitLog);
            } else {
                this.log('✅ Local repository in sync with origin');
            }
        } catch (error) {
            this.addWarning(`Could not check Git sync status: ${error.message}`);
        }
    }

    /**
     * TIER 4: PRODUCTION VERIFICATION SYSTEM
     */
    async tier4_ProductionVerificationSystem() {
        this.log('=== TIER 4: PRODUCTION VERIFICATION SYSTEM ===');
        
        // This tier will be used after deployment to verify the live site
        this.log('Production verification will be performed after deployment');
        
        // Prepare verification URLs
        const baseUrl = 'https://zenith.engineer';
        const verificationEndpoints = [
            '/',
            '/test',
            '/auth/signin',
            '/api/health'
        ];

        this.log('Prepared verification endpoints:');
        verificationEndpoints.forEach(endpoint => {
            this.log(`  - ${baseUrl}${endpoint}`);
        });
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        this.log('\n=== DEPLOYMENT VERIFICATION REPORT ===');
        
        this.log(`Total Errors: ${this.errors.length}`);
        this.log(`Total Warnings: ${this.warnings.length}`);

        if (this.errors.length > 0) {
            this.log('\n🚨 CRITICAL ERRORS (MUST FIX BEFORE DEPLOYMENT):');
            this.errors.forEach((error, index) => {
                this.log(`  ${index + 1}. ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            this.log('\n⚠️  WARNINGS (SHOULD REVIEW):');
            this.warnings.forEach((warning, index) => {
                this.log(`  ${index + 1}. ${warning}`);
            });
        }

        const deploymentReady = this.errors.length === 0 && this.verificationResults.localBuild;
        
        this.log(`\n🎯 DEPLOYMENT READINESS: ${deploymentReady ? '✅ READY' : '❌ NOT READY'}`);
        
        if (deploymentReady) {
            this.log('\n✅ ALL VERIFICATION TIERS PASSED');
            this.log('🚀 DEPLOYMENT APPROVED');
        } else {
            this.log('\n❌ VERIFICATION FAILED');
            this.log('🛑 DO NOT DEPLOY UNTIL ERRORS ARE RESOLVED');
        }

        return deploymentReady;
    }

    /**
     * Run complete verification suite
     */
    async runFullVerification() {
        this.log('🔍 STARTING COMPREHENSIVE DEPLOYMENT VERIFICATION');
        this.log('==================================================');

        await this.tier1_VercelEnvironmentReplication();
        await this.tier2_AutomatedVerificationMatrix();
        await this.tier3_ContinuousDeploymentPipeline();
        await this.tier4_ProductionVerificationSystem();

        return this.generateReport();
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new DeploymentVerificationFramework();
    verifier.runFullVerification().then(ready => {
        process.exit(ready ? 0 : 1);
    }).catch(error => {
        console.error('Verification framework error:', error);
        process.exit(1);
    });
}

module.exports = { DeploymentVerificationFramework };
