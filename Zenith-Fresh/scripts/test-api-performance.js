#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const ITERATIONS = 10;

// Endpoints to test
const TEST_ENDPOINTS = [
  {
    name: 'Website Analyzer Scan - POST',
    method: 'POST',
    path: '/api/website-analyzer/scan',
    data: {
      url: 'https://example.com',
      scanType: 'manual'
    },
    requiresAuth: true
  },
  {
    name: 'Website Analyzer Scan - GET (List)',
    method: 'GET',
    path: '/api/website-analyzer/scan?page=1&limit=20',
    requiresAuth: true
  },
  {
    name: 'Projects List',
    method: 'GET',
    path: '/api/projects',
    requiresAuth: true
  },
  {
    name: 'Teams List',
    method: 'GET',
    path: '/api/teams',
    requiresAuth: true
  },
  {
    name: 'Auth Test',
    method: 'GET',
    path: '/api/auth/test',
    requiresAuth: false
  },
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    requiresAuth: false
  },
  {
    name: 'Security Stats',
    method: 'GET',
    path: '/api/security/stats',
    requiresAuth: true
  },
  {
    name: 'System Monitor',
    method: 'GET',
    path: '/api/system-monitor',
    requiresAuth: true
  }
];

// Test utilities
async function testEndpoint(endpoint) {
  const results = [];
  const errors = [];

  console.log(`\nTesting: ${endpoint.name}`);
  console.log('─'.repeat(50));

  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const startTime = performance.now();
      
      const config = {
        method: endpoint.method,
        url: `${API_BASE_URL}${endpoint.path}`,
        headers: {}
      };

      if (endpoint.requiresAuth && AUTH_TOKEN) {
        config.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
      }

      if (endpoint.data) {
        config.data = endpoint.data;
      }

      const response = await axios(config);
      const endTime = performance.now();
      const duration = endTime - startTime;

      results.push({
        iteration: i + 1,
        duration,
        status: response.status,
        cached: response.headers['x-cache'] === 'HIT',
        responseTime: response.data.responseTime || null
      });

      process.stdout.write('.');
    } catch (error) {
      errors.push({
        iteration: i + 1,
        error: error.message,
        status: error.response?.status
      });
      process.stdout.write('E');
    }
  }

  console.log('\n');

  return { results, errors };
}

function analyzeResults(endpoint, { results, errors }) {
  if (results.length === 0) {
    return {
      endpoint: endpoint.name,
      status: 'FAILED',
      errorRate: 100,
      errors
    };
  }

  const durations = results.map(r => r.duration);
  const cachedCount = results.filter(r => r.cached).length;

  const stats = {
    endpoint: endpoint.name,
    status: 'SUCCESS',
    iterations: ITERATIONS,
    successful: results.length,
    failed: errors.length,
    errorRate: (errors.length / ITERATIONS) * 100,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    medianDuration: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    cacheHitRate: (cachedCount / results.length) * 100,
    performanceStatus: 'UNKNOWN'
  };

  // Determine performance status
  if (stats.avgDuration < 200) {
    stats.performanceStatus = 'OPTIMAL';
  } else if (stats.avgDuration < 500) {
    stats.performanceStatus = 'ACCEPTABLE';
  } else {
    stats.performanceStatus = 'POOR';
  }

  return stats;
}

function printReport(allStats) {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('                        API PERFORMANCE REPORT');
  console.log('═'.repeat(80));
  console.log('\nSummary:');
  console.log('─'.repeat(80));

  const totalEndpoints = allStats.length;
  const failedEndpoints = allStats.filter(s => s.status === 'FAILED').length;
  const optimalEndpoints = allStats.filter(s => s.performanceStatus === 'OPTIMAL').length;
  const poorEndpoints = allStats.filter(s => s.performanceStatus === 'POOR').length;
  const avgResponseTime = allStats
    .filter(s => s.avgDuration)
    .reduce((sum, s) => sum + s.avgDuration, 0) / (totalEndpoints - failedEndpoints);

  console.log(`Total Endpoints Tested: ${totalEndpoints}`);
  console.log(`Failed Endpoints: ${failedEndpoints}`);
  console.log(`Optimal Performance (<200ms): ${optimalEndpoints}`);
  console.log(`Poor Performance (>500ms): ${poorEndpoints}`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Target Response Time: 200ms`);
  console.log(`Performance Goal: ${avgResponseTime < 200 ? '✅ ACHIEVED' : '❌ NOT ACHIEVED'}`);

  console.log('\nDetailed Results:');
  console.log('─'.repeat(80));
  console.log('Endpoint                              │ Avg (ms) │ Min (ms) │ Max (ms) │ Status');
  console.log('─'.repeat(80));

  allStats
    .sort((a, b) => (a.avgDuration || 999999) - (b.avgDuration || 999999))
    .forEach(stat => {
      const name = stat.endpoint.padEnd(36, ' ').substring(0, 36);
      const avg = stat.avgDuration ? stat.avgDuration.toFixed(0).padStart(8, ' ') : '    N/A';
      const min = stat.minDuration ? stat.minDuration.toFixed(0).padStart(8, ' ') : '    N/A';
      const max = stat.maxDuration ? stat.maxDuration.toFixed(0).padStart(8, ' ') : '    N/A';
      
      let statusEmoji = '';
      if (stat.status === 'FAILED') {
        statusEmoji = '❌';
      } else if (stat.performanceStatus === 'OPTIMAL') {
        statusEmoji = '✅';
      } else if (stat.performanceStatus === 'ACCEPTABLE') {
        statusEmoji = '⚡';
      } else if (stat.performanceStatus === 'POOR') {
        statusEmoji = '🐌';
      }

      console.log(`${name} │ ${avg} │ ${min} │ ${max} │ ${statusEmoji} ${stat.performanceStatus || 'FAILED'}`);
      
      if (stat.cacheHitRate > 0) {
        console.log(`  └─ Cache Hit Rate: ${stat.cacheHitRate.toFixed(0)}%`);
      }
      
      if (stat.errorRate > 0) {
        console.log(`  └─ Error Rate: ${stat.errorRate.toFixed(0)}% (${stat.failed} failures)`);
      }
    });

  console.log('\nRecommendations:');
  console.log('─'.repeat(80));

  if (poorEndpoints > 0) {
    console.log('⚠️  The following endpoints need optimization:');
    allStats
      .filter(s => s.performanceStatus === 'POOR')
      .forEach(s => {
        console.log(`   - ${s.endpoint}: ${s.avgDuration.toFixed(0)}ms average`);
      });
  }

  if (avgResponseTime > 200) {
    console.log('⚠️  Overall average response time exceeds 200ms target');
    console.log('   Consider implementing:');
    console.log('   - More aggressive caching strategies');
    console.log('   - Database query optimization');
    console.log('   - Connection pooling improvements');
  }

  const lowCacheEndpoints = allStats.filter(s => 
    s.cacheHitRate !== undefined && s.cacheHitRate < 50 && s.avgDuration > 100
  );

  if (lowCacheEndpoints.length > 0) {
    console.log('⚠️  Low cache hit rates detected:');
    lowCacheEndpoints.forEach(s => {
      console.log(`   - ${s.endpoint}: ${s.cacheHitRate.toFixed(0)}% cache hits`);
    });
  }

  if (optimalEndpoints === totalEndpoints - failedEndpoints) {
    console.log('✅ All endpoints are performing optimally!');
  }

  console.log('\n' + '═'.repeat(80));
}

// Main execution
async function main() {
  console.log('Starting API Performance Tests...');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Iterations per endpoint: ${ITERATIONS}`);
  
  if (!AUTH_TOKEN) {
    console.log('\n⚠️  Warning: No AUTH_TOKEN provided. Protected endpoints will fail.');
    console.log('   Set AUTH_TOKEN environment variable to test authenticated endpoints.');
  }

  const allStats = [];

  for (const endpoint of TEST_ENDPOINTS) {
    const { results, errors } = await testEndpoint(endpoint);
    const stats = analyzeResults(endpoint, { results, errors });
    allStats.push(stats);
  }

  printReport(allStats);
}

// Run the tests
main().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});