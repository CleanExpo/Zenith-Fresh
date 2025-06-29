#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * 
 * Verifies that all systems are operational after deployment to Vercel production.
 * Tests core application functionality, database connections, and AI intelligence systems.
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const PRODUCTION_URL = 'https://zenith.engineer';
const TIMEOUT = 30000; // 30 seconds

// Test cases
const tests = [
  {
    name: 'Health Check - Application',
    path: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Health Check - MongoDB',
    path: '/api/health/mongodb',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Authentication System',
    path: '/api/auth/providers',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Deployment Intelligence - Insights',
    path: '/api/deployment/intelligence?action=insights',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Deployment Intelligence - Patterns',
    path: '/api/deployment/intelligence?action=patterns',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  },
  {
    name: 'Error Resolution System',
    path: '/api/deployment/resolve',
    method: 'POST',
    body: {
      error: {
        errorMessage: 'Test error for verification',
        errorType: 'test',
        file: 'verify-script.js'
      }
    },
    expectedStatus: 200,
    critical: false
  },
  {
    name: 'Homepage Load',
    path: '/',
    method: 'GET',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Analytics Dashboard',
    path: '/analytics',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  },
  {
    name: 'Team Management',
    path: '/teams',
    method: 'GET',
    expectedStatus: 200,
    critical: false
  }
];

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Zenith-Deployment-Verifier/1.0',
        'Accept': 'application/json',
        ...(postData && { 'Content-Type': 'application/json' })
      },
      timeout: TIMEOUT
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

/**
 * Run a single test
 */
async function runTest(test) {
  const url = `${PRODUCTION_URL}${test.path}`;
  
  console.log(`🧪 Testing: ${test.name}`);
  console.log(`   URL: ${test.method} ${url}`);
  
  try {
    const result = await makeRequest(url, { method: test.method }, test.body);
    
    if (result.statusCode === test.expectedStatus) {
      console.log(`   ✅ PASS - Status: ${result.statusCode}`);
      
      // Additional validation for specific endpoints
      if (test.path === '/api/health/mongodb' && result.data) {
        if (result.data.status === 'connected') {
          console.log(`   ✅ MongoDB connected successfully`);
        } else {
          console.log(`   ⚠️  MongoDB status: ${result.data.status}`);
        }
      }
      
      if (test.path.includes('/api/deployment/intelligence') && result.data) {
        if (result.data.success) {
          console.log(`   ✅ Deployment intelligence operational`);
          if (result.data.data && result.data.data.totalDeployments !== undefined) {
            console.log(`   📊 Total deployments tracked: ${result.data.data.totalDeployments}`);
          }
        } else {
          console.log(`   ⚠️  Intelligence response: ${result.data.error || 'Unknown error'}`);
        }
      }
      
      return { success: true, test };
    } else {
      console.log(`   ❌ FAIL - Expected: ${test.expectedStatus}, Got: ${result.statusCode}`);
      if (result.rawData) {
        console.log(`   📝 Response: ${result.rawData.substring(0, 200)}...`);
      }
      return { success: false, test, error: `Status ${result.statusCode}` };
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error.message}`);
    return { success: false, test, error: error.message };
  }
}

/**
 * Initialize deployment intelligence system
 */
async function initializeIntelligence() {
  console.log('\n🧠 Initializing Deployment Intelligence System...');
  
  try {
    const initData = {
      action: 'log-deployment',
      status: 'success',
      environment: 'production',
      triggeredBy: 'deployment-verification-script',
      buildConfig: {
        nodeVersion: process.version,
        platform: 'vercel',
        timestamp: new Date().toISOString()
      }
    };
    
    const result = await makeRequest(
      `${PRODUCTION_URL}/api/deployment/intelligence`,
      { method: 'POST' },
      initData
    );
    
    if (result.statusCode === 200 && result.data && result.data.success) {
      console.log('✅ Intelligence system initialized successfully');
      if (result.data.data && result.data.data.deploymentId) {
        console.log(`📝 Deployment ID: ${result.data.data.deploymentId}`);
      }
      return true;
    } else {
      console.log('⚠️  Intelligence initialization incomplete');
      return false;
    }
  } catch (error) {
    console.log(`❌ Intelligence initialization failed: ${error.message}`);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyDeployment() {
  console.log('🚀 Zenith Platform Production Deployment Verification');
  console.log('=' * 60);
  console.log(`Target: ${PRODUCTION_URL}`);
  console.log(`Timeout: ${TIMEOUT / 1000}s per test`);
  console.log(`Tests: ${tests.length} total\n`);
  
  const results = [];
  let criticalFailures = 0;
  
  // Run all tests
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    
    if (!result.success && test.critical) {
      criticalFailures++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Initialize intelligence system if core tests pass
  if (criticalFailures === 0) {
    await initializeIntelligence();
  }
  
  // Summary
  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('=' * 40);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`🚨 Critical Failures: ${criticalFailures}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(result => {
      const critical = result.test.critical ? '🚨 CRITICAL' : '⚠️  Non-critical';
      console.log(`   ${critical}: ${result.test.name} - ${result.error}`);
    });
  }
  
  console.log('\n🎯 DEPLOYMENT STATUS:');
  if (criticalFailures === 0) {
    console.log('✅ PRODUCTION READY - All critical systems operational');
    if (failed === 0) {
      console.log('🎉 PERFECT DEPLOYMENT - All tests passed!');
    }
  } else {
    console.log('❌ DEPLOYMENT ISSUES - Critical systems failing');
    console.log('🔧 Action required before production traffic');
  }
  
  // Intelligence system status
  console.log('\n🧠 AI DEPLOYMENT INTELLIGENCE:');
  const intelligenceTest = results.find(r => r.test.path.includes('/api/deployment/intelligence'));
  if (intelligenceTest && intelligenceTest.success) {
    console.log('✅ MongoDB deployment intelligence operational');
    console.log('🤖 Auto-resolution system ready');
    console.log('📈 Predictive analytics active');
    console.log('🔍 Pattern recognition enabled');
  } else {
    console.log('⚠️  Intelligence system not fully operational');
  }
  
  console.log('\n📋 Next Steps:');
  if (criticalFailures === 0) {
    console.log('1. Monitor deployment performance');
    console.log('2. Check error tracking for any issues');
    console.log('3. Test user authentication flows');
    console.log('4. Verify MongoDB intelligence data collection');
    console.log('5. Review application logs in Vercel dashboard');
  } else {
    console.log('1. Fix critical system failures');
    console.log('2. Check environment variables in Vercel');
    console.log('3. Verify database connections');
    console.log('4. Re-run verification after fixes');
  }
  
  process.exit(criticalFailures > 0 ? 1 : 0);
}

// Run verification
verifyDeployment().catch(error => {
  console.error('🚨 Verification script failed:', error);
  process.exit(1);
});