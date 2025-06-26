#!/usr/bin/env node

/**
 * Authentication Testing Script
 * Tests all authentication endpoints and configurations
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_CREDENTIALS = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: process.env.TEST_PASSWORD || 'test-password'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Zenith-Auth-Tester/1.0',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Test API endpoints
 */
async function testEndpoints() {
  log('\n🔍 Testing Authentication API Endpoints...', 'cyan');
  
  const endpoints = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/api/health`,
      expectedStatus: 200
    },
    {
      name: 'Auth Providers',
      url: `${BASE_URL}/api/auth/providers`,
      expectedStatus: 200
    },
    {
      name: 'Auth Test',
      url: `${BASE_URL}/api/auth/test`,
      expectedStatus: 200
    },
    {
      name: 'NextAuth Session',
      url: `${BASE_URL}/api/auth/session`,
      expectedStatus: 200
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      log(`Testing ${endpoint.name}...`, 'blue');
      const response = await makeRequest(endpoint.url);
      
      if (response.status === endpoint.expectedStatus) {
        log(`✅ ${endpoint.name}: OK (${response.status})`, 'green');
        results.push({ ...endpoint, status: 'pass', response });
      } else {
        log(`❌ ${endpoint.name}: Expected ${endpoint.expectedStatus}, got ${response.status}`, 'red');
        results.push({ ...endpoint, status: 'fail', response });
      }
    } catch (error) {
      log(`❌ ${endpoint.name}: Error - ${error.message}`, 'red');
      results.push({ ...endpoint, status: 'error', error: error.message });
    }
  }
  
  return results;
}

/**
 * Test credentials authentication
 */
async function testCredentialsAuth() {
  log('\n🔐 Testing Credentials Authentication...', 'cyan');
  
  try {
    log('Testing demo credentials...', 'blue');
    const response = await makeRequest(`${BASE_URL}/api/auth/test`, {
      method: 'POST',
      body: {
        action: 'test-credentials',
        credentials: TEST_CREDENTIALS
      }
    });
    
    if (response.status === 200 && response.data.result === 'success') {
      log('✅ Demo credentials authentication: PASS', 'green');
      log(`   User: ${response.data.user?.name} (${response.data.user?.email})`, 'blue');
      return { status: 'pass', response };
    } else {
      log('❌ Demo credentials authentication: FAIL', 'red');
      log(`   Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return { status: 'fail', response };
    }
  } catch (error) {
    log(`❌ Credentials test error: ${error.message}`, 'red');
    return { status: 'error', error: error.message };
  }
}

/**
 * Test OAuth providers configuration
 */
async function testOAuthProviders() {
  log('\n🌐 Testing OAuth Providers Configuration...', 'cyan');
  
  try {
    log('Fetching available providers...', 'blue');
    const response = await makeRequest(`${BASE_URL}/api/auth/providers`);
    
    if (response.status === 200 && response.data.providers) {
      const providers = Object.keys(response.data.providers);
      log(`✅ Available providers: ${providers.join(', ')}`, 'green');
      
      // Check for Google provider
      if (response.data.providers.google) {
        log('✅ Google OAuth provider: CONFIGURED', 'green');
        log(`   Callback URL: ${response.data.providers.google.callbackUrl}`, 'blue');
      } else {
        log('⚠️  Google OAuth provider: NOT FOUND', 'yellow');
      }
      
      // Check for credentials provider
      if (response.data.providers.credentials) {
        log('✅ Credentials provider: CONFIGURED', 'green');
      } else {
        log('⚠️  Credentials provider: NOT FOUND', 'yellow');
      }
      
      return { status: 'pass', providers, response };
    } else {
      log('❌ Failed to fetch providers', 'red');
      return { status: 'fail', response };
    }
  } catch (error) {
    log(`❌ OAuth providers test error: ${error.message}`, 'red');
    return { status: 'error', error: error.message };
  }
}

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  log('\n⚙️  Validating Environment Configuration...', 'cyan');
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];
  
  const results = [];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      log(`✅ ${varName}: CONFIGURED`, 'green');
      results.push({ var: varName, status: 'configured' });
    } else {
      log(`❌ ${varName}: MISSING`, 'red');
      results.push({ var: varName, status: 'missing' });
    }
  }
  
  // Validate NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL) {
    try {
      new URL(process.env.NEXTAUTH_URL);
      log('✅ NEXTAUTH_URL format: VALID', 'green');
    } catch (error) {
      log('❌ NEXTAUTH_URL format: INVALID', 'red');
    }
  }
  
  return results;
}

/**
 * Generate setup instructions
 */
function generateSetupInstructions() {
  log('\n📋 Google OAuth Setup Instructions:', 'magenta');
  
  const instructions = [
    '1. Go to Google Cloud Console: https://console.cloud.google.com',
    '2. Create or select a project',
    '3. Enable Google+ API and Google OAuth2 API',
    '4. Go to Credentials > Create Credentials > OAuth client ID',
    '5. Set application type to "Web application"',
    '6. Add authorized redirect URIs:',
    `   - ${BASE_URL}/api/auth/callback/google`,
    '7. Copy Client ID and Client Secret to environment variables',
    '8. Test the authentication flow'
  ];
  
  instructions.forEach(instruction => {
    log(`   ${instruction}`, 'blue');
  });
  
  log('\n🔧 Environment Variables Checklist:', 'magenta');
  log('   ✓ NEXTAUTH_SECRET (32+ characters)', 'blue');
  log('   ✓ NEXTAUTH_URL (your domain URL)', 'blue');
  log('   ✓ GOOGLE_CLIENT_ID (from Google Console)', 'blue');
  log('   ✓ GOOGLE_CLIENT_SECRET (from Google Console)', 'blue');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Zenith Platform - Authentication Testing Suite');
  console.log('=' * 60);
  
  // Load environment
  try {
    require('dotenv').config({ path: '.env.local' });
    require('dotenv').config({ path: '.env.production' });
    require('dotenv').config({ path: '.env' });
  } catch (error) {
    log('⚠️  Could not load environment files', 'yellow');
  }
  
  log(`Testing against: ${BASE_URL}`, 'cyan');
  
  // Run tests
  const results = {
    environment: validateEnvironment(),
    endpoints: await testEndpoints(),
    credentials: await testCredentialsAuth(),
    oauth: await testOAuthProviders()
  };
  
  // Summary
  log('\n📊 Test Results Summary:', 'cyan');
  
  const envPassed = results.environment.filter(r => r.status === 'configured').length;
  const envTotal = results.environment.length;
  log(`   Environment: ${envPassed}/${envTotal} configured`, envPassed === envTotal ? 'green' : 'red');
  
  const endpointsPassed = results.endpoints.filter(r => r.status === 'pass').length;
  const endpointsTotal = results.endpoints.length;
  log(`   Endpoints: ${endpointsPassed}/${endpointsTotal} working`, endpointsPassed === endpointsTotal ? 'green' : 'red');
  
  log(`   Credentials Auth: ${results.credentials.status}`, results.credentials.status === 'pass' ? 'green' : 'red');
  log(`   OAuth Providers: ${results.oauth.status}`, results.oauth.status === 'pass' ? 'green' : 'red');
  
  // Overall status
  const allPassed = envPassed === envTotal && 
                   endpointsPassed === endpointsTotal && 
                   results.credentials.status === 'pass' && 
                   results.oauth.status === 'pass';
  
  if (allPassed) {
    log('\n✅ All authentication tests PASSED! 🎉', 'green');
    log('   Authentication is ready for production deployment.', 'green');
  } else {
    log('\n❌ Some authentication tests FAILED', 'red');
    log('   Please review the issues above before deployment.', 'red');
  }
  
  generateSetupInstructions();
  
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testEndpoints,
  testCredentialsAuth,
  testOAuthProviders,
  validateEnvironment
};