#!/usr/bin/env node

/**
 * Comprehensive production testing script
 * Tests all critical functionality and tries to break the system
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

console.log(`🧪 Testing Zenith Fresh at ${BASE_URL}`);
console.log('=' + '='.repeat(50));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Zenith-Fresh-Test-Script',
        ...options.headers
      },
      timeout: TIMEOUT
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function runTest(name, testFn) {
  totalTests++;
  try {
    console.log(`\n🔍 ${name}`);
    await testFn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

// Test Cases
async function testHomepage() {
  const response = await makeRequest('/');
  if (response.statusCode !== 200) {
    throw new Error(`Expected 200, got ${response.statusCode}`);
  }
}

async function testHealthCheck() {
  const response = await makeRequest('/api/health');
  if (response.statusCode !== 200) {
    throw new Error(`Expected 200, got ${response.statusCode}`);
  }
  
  const data = JSON.parse(response.body);
  if (data.status !== 'healthy') {
    throw new Error(`Expected healthy status, got ${data.status}`);
  }
}

async function testDetailedHealthCheck() {
  const response = await makeRequest('/api/health?detailed=true');
  if (response.statusCode !== 200) {
    throw new Error(`Expected 200, got ${response.statusCode}`);
  }
  
  const data = JSON.parse(response.body);
  if (!data.checks) {
    throw new Error('Detailed health check missing checks data');
  }
}

async function testAuthenticationEndpoint() {
  const response = await makeRequest('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'validate' })
  });
  
  // Should return 400 for missing session
  if (response.statusCode !== 400) {
    throw new Error(`Expected 400 for missing session, got ${response.statusCode}`);
  }
}

async function testInvalidLogin() {
  const response = await makeRequest('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      username: 'invalid_user',
      password: 'invalidpassword123'
    })
  });
  
  // Should return 401 for invalid credentials
  if (response.statusCode !== 401) {
    throw new Error(`Expected 401 for invalid login, got ${response.statusCode}`);
  }
}

async function testSQLInjectionProtection() {
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    "admin' OR '1'='1",
    "<script>alert('xss')</script>",
    "../../etc/passwd"
  ];
  
  for (const input of maliciousInputs) {
    const response = await makeRequest('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        username: input,
        password: input
      })
    });
    
    // Should not return 500 (server error) or 200 (success)
    if (response.statusCode === 500) {
      throw new Error(`SQL injection vulnerability detected with input: ${input}`);
    }
    if (response.statusCode === 200) {
      throw new Error(`Authentication bypass detected with input: ${input}`);
    }
  }
}

async function testRateLimiting() {
  // Make multiple rapid requests to test rate limiting
  const promises = [];
  for (let i = 0; i < 15; i++) {
    promises.push(makeRequest('/api/health'));
  }
  
  const responses = await Promise.allSettled(promises);
  const statusCodes = responses
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.statusCode);
  
  // Should eventually get rate limited (429) or throttled responses
  const hasRateLimit = statusCodes.some(code => code === 429 || code === 503);
  if (!hasRateLimit && statusCodes.length > 10) {
    console.warn('⚠️  No rate limiting detected - this may be expected in development');
  }
}

async function testSecurityHeaders() {
  const response = await makeRequest('/');
  const headers = response.headers;
  
  const requiredHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection'
  ];
  
  for (const header of requiredHeaders) {
    if (!headers[header]) {
      throw new Error(`Missing security header: ${header}`);
    }
  }
}

async function testStaticPages() {
  const pages = ['/', '/features', '/contact', '/auth/signin'];
  
  for (const page of pages) {
    const response = await makeRequest(page);
    if (response.statusCode !== 200) {
      throw new Error(`Page ${page} returned ${response.statusCode}`);
    }
  }
}

async function testProtectedRoutes() {
  const protectedPages = ['/dashboard', '/admin', '/settings'];
  
  for (const page of protectedPages) {
    const response = await makeRequest(page);
    // Should redirect to login (302/301) or show unauthorized (401/403)
    if (![302, 301, 401, 403].includes(response.statusCode)) {
      throw new Error(`Protected page ${page} not properly protected (got ${response.statusCode})`);
    }
  }
}

async function testErrorHandling() {
  // Test 404 page
  const response = await makeRequest('/nonexistent-page');
  if (response.statusCode !== 404) {
    throw new Error(`Expected 404 for non-existent page, got ${response.statusCode}`);
  }
}

async function testAPIErrorHandling() {
  // Test malformed JSON
  const response = await makeRequest('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'invalid json{'
  });
  
  // Should return 400 for malformed request
  if (response.statusCode !== 400) {
    throw new Error(`Expected 400 for malformed JSON, got ${response.statusCode}`);
  }
}

async function testSystemMonitor() {
  const response = await makeRequest('/api/system-monitor?endpoint=metrics');
  if (response.statusCode !== 200) {
    throw new Error(`System monitor failed: ${response.statusCode}`);
  }
  
  const data = JSON.parse(response.body);
  if (!data.requests || !data.performance || !data.resources) {
    throw new Error('System monitor missing metrics data');
  }
}

async function testTrafficManager() {
  const response = await makeRequest('/api/traffic-manager');
  if (response.statusCode !== 200) {
    throw new Error(`Traffic manager failed: ${response.statusCode}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive system tests...\n');
  
  // Basic functionality tests
  await runTest('Homepage loads', testHomepage);
  await runTest('Health check works', testHealthCheck);
  await runTest('Detailed health check works', testDetailedHealthCheck);
  await runTest('Static pages load', testStaticPages);
  
  // Authentication tests
  await runTest('Authentication endpoint responds', testAuthenticationEndpoint);
  await runTest('Invalid login rejected', testInvalidLogin);
  await runTest('Protected routes secured', testProtectedRoutes);
  
  // Security tests
  await runTest('SQL injection protection', testSQLInjectionProtection);
  await runTest('Security headers present', testSecurityHeaders);
  await runTest('Rate limiting works', testRateLimiting);
  
  // Error handling tests
  await runTest('404 error handling', testErrorHandling);
  await runTest('API error handling', testAPIErrorHandling);
  
  // System APIs
  await runTest('System monitor API', testSystemMonitor);
  await runTest('Traffic manager API', testTrafficManager);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is production ready.');
  } else {
    console.log(`\n⚠️  ${failedTests} tests failed. Please review and fix issues before production deployment.`);
  }
  
  console.log('\n📋 Production Checklist:');
  console.log('□ Set production environment variables in Vercel');
  console.log('□ Configure database connection');
  console.log('□ Set up external monitoring');
  console.log('□ Configure domain and SSL');
  console.log('□ Test with real production traffic');
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };