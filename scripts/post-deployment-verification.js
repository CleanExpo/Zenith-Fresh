#!/usr/bin/env node

/**
 * POST-DEPLOYMENT VERIFICATION SYSTEM
 * 
 * This script verifies that the deployed site is actually working
 * and all critical functionality is operational.
 */

const https = require('https');
const http = require('http');

class PostDeploymentVerificationSystem {
    constructor(baseUrl = 'https://zenith.engineer') {
        this.baseUrl = baseUrl;
        this.results = {};
        this.errors = [];
        this.warnings = [];
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
     * Make HTTP request with timeout
     */
    makeRequest(url, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;
            
            const req = client.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data,
                        url: url
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(timeout, () => {
                req.destroy();
                reject(new Error(`Request timeout for ${url}`));
            });
        });
    }

    /**
     * Test basic site accessibility
     */
    async testSiteAccessibility() {
        this.log('=== TESTING SITE ACCESSIBILITY ===');
        
        const testUrls = [
            `${this.baseUrl}/`,
            `${this.baseUrl}/test`,
            `${this.baseUrl}/auth/signin`,
            `${this.baseUrl}/api/health`
        ];

        for (const url of testUrls) {
            try {
                this.log(`Testing: ${url}`);
                const response = await this.makeRequest(url);
                
                if (response.statusCode >= 200 && response.statusCode < 400) {
                    this.log(`✅ ${url} - Status: ${response.statusCode}`);
                    this.results[url] = { status: 'success', statusCode: response.statusCode };
                } else {
                    this.addError(`${url} - Unexpected status: ${response.statusCode}`);
                    this.results[url] = { status: 'error', statusCode: response.statusCode };
                }
            } catch (error) {
                this.addError(`${url} - Request failed: ${error.message}`);
                this.results[url] = { status: 'error', error: error.message };
            }
        }
    }

    /**
     * Test home page content
     */
    async testHomePageContent() {
        this.log('=== TESTING HOME PAGE CONTENT ===');
        
        try {
            const response = await this.makeRequest(`${this.baseUrl}/`);
            
            if (response.statusCode === 200) {
                const body = response.body.toLowerCase();
                
                // Check for expected content
                const expectedContent = [
                    'zenith',
                    'platform',
                    'saas',
                    'enterprise'
                ];
                
                let contentFound = 0;
                for (const content of expectedContent) {
                    if (body.includes(content)) {
                        contentFound++;
                        this.log(`✅ Found expected content: "${content}"`);
                    } else {
                        this.addWarning(`Missing expected content: "${content}"`);
                    }
                }
                
                if (contentFound >= expectedContent.length / 2) {
                    this.log('✅ Home page content verification passed');
                } else {
                    this.addError('Home page content verification failed - missing too much expected content');
                }
                
                // Check for common error indicators
                const errorIndicators = [
                    'error occurred',
                    'something went wrong',
                    '500',
                    'internal server error',
                    'application error'
                ];
                
                for (const indicator of errorIndicators) {
                    if (body.includes(indicator)) {
                        this.addError(`Home page contains error indicator: "${indicator}"`);
                    }
                }
                
            } else {
                this.addError(`Home page returned status ${response.statusCode}`);
            }
        } catch (error) {
            this.addError(`Failed to test home page content: ${error.message}`);
        }
    }

    /**
     * Test API endpoints
     */
    async testApiEndpoints() {
        this.log('=== TESTING API ENDPOINTS ===');
        
        const apiEndpoints = [
            `${this.baseUrl}/api/health`,
            `${this.baseUrl}/api/auth/providers`
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                this.log(`Testing API: ${endpoint}`);
                const response = await this.makeRequest(endpoint);
                
                if (response.statusCode >= 200 && response.statusCode < 500) {
                    this.log(`✅ ${endpoint} - Status: ${response.statusCode}`);
                } else {
                    this.addWarning(`${endpoint} - Status: ${response.statusCode}`);
                }
            } catch (error) {
                this.addWarning(`${endpoint} - Request failed: ${error.message}`);
            }
        }
    }

    /**
     * Test static assets
     */
    async testStaticAssets() {
        this.log('=== TESTING STATIC ASSETS ===');
        
        const staticAssets = [
            `${this.baseUrl}/favicon.ico`,
            `${this.baseUrl}/manifest.json`
        ];
        
        for (const asset of staticAssets) {
            try {
                this.log(`Testing asset: ${asset}`);
                const response = await this.makeRequest(asset);
                
                if (response.statusCode === 200) {
                    this.log(`✅ ${asset} - Available`);
                } else {
                    this.addWarning(`${asset} - Status: ${response.statusCode}`);
                }
            } catch (error) {
                this.addWarning(`${asset} - Request failed: ${error.message}`);
            }
        }
    }

    /**
     * Test security headers
     */
    async testSecurityHeaders() {
        this.log('=== TESTING SECURITY HEADERS ===');
        
        try {
            const response = await this.makeRequest(`${this.baseUrl}/`);
            const headers = response.headers;
            
            // Check for important security headers
            const securityHeaders = [
                'x-frame-options',
                'x-content-type-options',
                'strict-transport-security'
            ];
            
            for (const header of securityHeaders) {
                if (headers[header]) {
                    this.log(`✅ Security header present: ${header}`);
                } else {
                    this.addWarning(`Missing security header: ${header}`);
                }
            }
            
            // Check for HTTPS
            if (this.baseUrl.startsWith('https://')) {
                this.log('✅ HTTPS enabled');
            } else {
                this.addError('HTTPS not enabled');
            }
            
        } catch (error) {
            this.addError(`Failed to test security headers: ${error.message}`);
        }
    }

    /**
     * Performance and timing tests
     */
    async testPerformance() {
        this.log('=== TESTING PERFORMANCE ===');
        
        try {
            const startTime = Date.now();
            const response = await this.makeRequest(`${this.baseUrl}/`);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            this.log(`Response time: ${responseTime}ms`);
            
            if (responseTime < 3000) {
                this.log('✅ Response time acceptable (<3s)');
            } else if (responseTime < 5000) {
                this.addWarning(`Response time slow (${responseTime}ms)`);
            } else {
                this.addError(`Response time too slow (${responseTime}ms)`);
            }
            
        } catch (error) {
            this.addError(`Failed to test performance: ${error.message}`);
        }
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        this.log('\n=== POST-DEPLOYMENT VERIFICATION REPORT ===');
        
        this.log(`Total Errors: ${this.errors.length}`);
        this.log(`Total Warnings: ${this.warnings.length}`);

        if (this.errors.length > 0) {
            this.log('\n🚨 CRITICAL ERRORS:');
            this.errors.forEach((error, index) => {
                this.log(`  ${index + 1}. ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            this.log('\n⚠️  WARNINGS:');
            this.warnings.forEach((warning, index) => {
                this.log(`  ${index + 1}. ${warning}`);
            });
        }

        // Calculate success rate
        const totalTests = Object.keys(this.results).length;
        const successfulTests = Object.values(this.results).filter(r => r.status === 'success').length;
        const successRate = totalTests > 0 ? (successfulTests / totalTests * 100).toFixed(1) : 0;
        
        this.log(`\n📊 SUCCESS RATE: ${successRate}% (${successfulTests}/${totalTests})`);
        
        const deploymentSuccess = this.errors.length === 0 && successRate >= 75;
        
        this.log(`\n🎯 DEPLOYMENT STATUS: ${deploymentSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
        
        if (deploymentSuccess) {
            this.log('\n🎉 DEPLOYMENT VERIFICATION PASSED');
            this.log('✅ Site is operational and ready for users');
        } else {
            this.log('\n❌ DEPLOYMENT VERIFICATION FAILED');
            this.log('🛑 Site has critical issues that need immediate attention');
        }

        return deploymentSuccess;
    }

    /**
     * Run complete post-deployment verification
     */
    async runFullVerification() {
        this.log('🔍 STARTING POST-DEPLOYMENT VERIFICATION');
        this.log(`🌐 Target URL: ${this.baseUrl}`);
        this.log('=============================================');

        await this.testSiteAccessibility();
        await this.testHomePageContent();
        await this.testApiEndpoints();
        await this.testStaticAssets();
        await this.testSecurityHeaders();
        await this.testPerformance();

        return this.generateReport();
    }
}

// Run verification if called directly
if (require.main === module) {
    const baseUrl = process.argv[2] || 'https://zenith.engineer';
    const verifier = new PostDeploymentVerificationSystem(baseUrl);
    
    verifier.runFullVerification().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Post-deployment verification error:', error);
        process.exit(1);
    });
}

module.exports = { PostDeploymentVerificationSystem };
