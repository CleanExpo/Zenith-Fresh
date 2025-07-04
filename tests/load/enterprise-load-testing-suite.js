/**
 * ZENITH ENTERPRISE - COMPREHENSIVE LOAD TESTING SUITE
 * Production-grade load testing with stress testing and performance benchmarking
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const throughput = new Counter('throughput');
const businessMetrics = {
  loginAttempts: new Counter('login_attempts'),
  dashboardLoads: new Counter('dashboard_loads'),
  apiCalls: new Counter('api_calls'),
  conversionRate: new Rate('conversion_rate')
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'https://zenith.engineer';
const API_TOKEN = __ENV.API_TOKEN || '';

// Load testing scenarios
export const options = {
  scenarios: {
    // Smoke test - basic functionality
    smoke_test: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      tags: { test_type: 'smoke' }
    },
    
    // Load test - normal expected load
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 50 },   // Ramp up
        { duration: '10m', target: 50 },  // Stay at 50 users
        { duration: '5m', target: 100 },  // Ramp to 100 users
        { duration: '10m', target: 100 }, // Stay at 100 users
        { duration: '5m', target: 0 }     // Ramp down
      ],
      tags: { test_type: 'load' }
    },
    
    // Stress test - beyond normal capacity
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },  // Ramp up to normal load
        { duration: '5m', target: 200 },  // Ramp up to stress level
        { duration: '5m', target: 300 },  // Beyond normal capacity
        { duration: '10m', target: 300 }, // Stay at stress level
        { duration: '5m', target: 200 },  // Scale back down
        { duration: '5m', target: 100 },  // Back to normal
        { duration: '5m', target: 0 }     // Ramp down
      ],
      tags: { test_type: 'stress' }
    },
    
    // Spike test - sudden traffic spikes
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },    // Normal load
        { duration: '1m', target: 500 },   // Sudden spike
        { duration: '2m', target: 500 },   // Maintain spike
        { duration: '1m', target: 50 },    // Quick drop
        { duration: '2m', target: 50 },    // Normal load
        { duration: '1m', target: 0 }      // Ramp down
      ],
      tags: { test_type: 'spike' }
    },
    
    // Volume test - large amount of data
    volume_test: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30m',
      tags: { test_type: 'volume' }
    },
    
    // Soak test - extended duration
    soak_test: {
      executor: 'constant-vus',
      vus: 30,
      duration: '2h',
      tags: { test_type: 'soak' }
    }
  },
  
  thresholds: {
    // Performance thresholds
    'http_req_duration': ['p(95)<2000'], // 95% of requests under 2s
    'http_req_duration{test_type:load}': ['p(95)<1000'], // Load test under 1s
    'http_req_duration{test_type:stress}': ['p(95)<5000'], // Stress test under 5s
    
    // Error rate thresholds
    'error_rate': ['rate<0.01'], // Error rate under 1%
    'error_rate{test_type:load}': ['rate<0.005'], // Load test under 0.5%
    
    // Business metric thresholds
    'login_attempts': ['count>100'],
    'dashboard_loads': ['count>500'],
    'conversion_rate': ['rate>0.05'] // 5% conversion rate
  }
};

// Test data
const testUsers = [
  { email: 'test1@zenith.engineer', password: 'TestPass123!' },
  { email: 'test2@zenith.engineer', password: 'TestPass123!' },
  { email: 'test3@zenith.engineer', password: 'TestPass123!' }
];

const testScenarios = [
  'website_analysis',
  'competitive_intelligence',
  'content_generation',
  'team_collaboration',
  'analytics_dashboard'
];

// Authentication function
function authenticate() {
  const credentials = testUsers[randomIntBetween(0, testUsers.length - 1)];
  
  const loginResponse = http.post(`${BASE_URL}/api/auth/signin`, {
    email: credentials.email,
    password: credentials.password
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  businessMetrics.loginAttempts.add(1);
  
  check(loginResponse, {
    'authentication successful': (r) => r.status === 200,
    'authentication response time OK': (r) => r.timings.duration < 3000
  });
  
  return loginResponse.json('token');
}

// Main test function
export default function() {
  // Authentication
  const token = authenticate();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Test scenario selection
  const scenario = testScenarios[randomIntBetween(0, testScenarios.length - 1)];
  
  group('Core Application Flow', () => {
    // Homepage load
    group('Homepage', () => {
      const homeResponse = http.get(`${BASE_URL}/`);
      
      check(homeResponse, {
        'homepage loads successfully': (r) => r.status === 200,
        'homepage response time OK': (r) => r.timings.duration < 2000,
        'homepage contains expected content': (r) => r.body.includes('Zenith')
      });
      
      errorRate.add(homeResponse.status !== 200);
      responseTime.add(homeResponse.timings.duration);
      throughput.add(1);
    });
    
    // Dashboard access
    group('Dashboard', () => {
      const dashboardResponse = http.get(`${BASE_URL}/dashboard`, { headers });
      
      check(dashboardResponse, {
        'dashboard loads successfully': (r) => r.status === 200,
        'dashboard response time OK': (r) => r.timings.duration < 3000,
        'dashboard authenticated': (r) => !r.body.includes('Sign in')
      });
      
      businessMetrics.dashboardLoads.add(1);
      errorRate.add(dashboardResponse.status !== 200);
      responseTime.add(dashboardResponse.timings.duration);
    });
    
    // API endpoints testing
    group('API Endpoints', () => {
      testApiEndpoints(headers);
    });
    
    // Feature-specific testing
    group(`Feature: ${scenario}`, () => {
      testFeatureScenario(scenario, headers);
    });
  });
  
  // Realistic user behavior - think time
  sleep(randomIntBetween(1, 5));
}

// API endpoints testing function
function testApiEndpoints(headers) {
  const endpoints = [
    { url: '/api/health', method: 'GET', expectedStatus: 200 },
    { url: '/api/analytics/dashboards', method: 'GET', expectedStatus: 200 },
    { url: '/api/teams', method: 'GET', expectedStatus: 200 },
    { url: '/api/projects', method: 'GET', expectedStatus: 200 }
  ];
  
  endpoints.forEach(endpoint => {
    const response = http.request(endpoint.method, `${BASE_URL}${endpoint.url}`, null, { headers });
    
    check(response, {
      [`${endpoint.url} status OK`]: (r) => r.status === endpoint.expectedStatus,
      [`${endpoint.url} response time OK`]: (r) => r.timings.duration < 1000
    });
    
    businessMetrics.apiCalls.add(1);
    errorRate.add(response.status !== endpoint.expectedStatus);
    responseTime.add(response.timings.duration);
  });
}

// Feature-specific testing
function testFeatureScenario(scenario, headers) {
  switch (scenario) {
    case 'website_analysis':
      testWebsiteAnalysis(headers);
      break;
    
    case 'competitive_intelligence':
      testCompetitiveIntelligence(headers);
      break;
    
    case 'content_generation':
      testContentGeneration(headers);
      break;
    
    case 'team_collaboration':
      testTeamCollaboration(headers);
      break;
    
    case 'analytics_dashboard':
      testAnalyticsDashboard(headers);
      break;
  }
}

// Website analysis testing
function testWebsiteAnalysis(headers) {
  const testUrl = 'https://example.com';
  
  const analysisResponse = http.post(`${BASE_URL}/api/analysis/website/scan`, {
    url: testUrl,
    deep_analysis: true
  }, { headers });
  
  check(analysisResponse, {
    'website analysis initiated': (r) => r.status === 200 || r.status === 202,
    'analysis response time acceptable': (r) => r.timings.duration < 5000
  });
  
  // Check analysis status
  if (analysisResponse.json('analysisId')) {
    const statusResponse = http.get(
      `${BASE_URL}/api/analysis/website/${analysisResponse.json('analysisId')}`,
      { headers }
    );
    
    check(statusResponse, {
      'analysis status retrievable': (r) => r.status === 200
    });
  }
}

// Competitive intelligence testing
function testCompetitiveIntelligence(headers) {
  const competitorUrl = 'https://competitor.com';
  
  const intelligenceResponse = http.post(`${BASE_URL}/api/competitive/analysis`, {
    competitor_url: competitorUrl,
    analysis_type: 'full'
  }, { headers });
  
  check(intelligenceResponse, {
    'competitive analysis initiated': (r) => r.status === 200 || r.status === 202,
    'competitive analysis response time OK': (r) => r.timings.duration < 10000
  });
}

// Content generation testing
function testContentGeneration(headers) {
  const contentRequest = {
    type: 'blog_post',
    topic: 'Enterprise SaaS Development',
    target_length: 1000,
    tone: 'professional'
  };
  
  const contentResponse = http.post(`${BASE_URL}/api/ai/content-generation`, contentRequest, { headers });
  
  check(contentResponse, {
    'content generation initiated': (r) => r.status === 200 || r.status === 202,
    'content generation response time acceptable': (r) => r.timings.duration < 30000
  });
  
  // Track conversion (successful content generation)
  businessMetrics.conversionRate.add(contentResponse.status === 200);
}

// Team collaboration testing
function testTeamCollaboration(headers) {
  // Create a test project
  const projectResponse = http.post(`${BASE_URL}/api/projects`, {
    name: `Load Test Project ${Date.now()}`,
    description: 'Automated load test project'
  }, { headers });
  
  check(projectResponse, {
    'project creation successful': (r) => r.status === 201,
    'project creation response time OK': (r) => r.timings.duration < 2000
  });
  
  if (projectResponse.json('id')) {
    // Add team member
    const inviteResponse = http.post(`${BASE_URL}/api/projects/${projectResponse.json('id')}/invite`, {
      email: 'test@zenith.engineer',
      role: 'member'
    }, { headers });
    
    check(inviteResponse, {
      'team invitation sent': (r) => r.status === 200 || r.status === 201
    });
  }
}

// Analytics dashboard testing
function testAnalyticsDashboard(headers) {
  const dashboardEndpoints = [
    '/api/analytics/kpis',
    '/api/analytics/charts/data',
    '/api/analytics/funnel/data',
    '/api/analytics/tables/data'
  ];
  
  dashboardEndpoints.forEach(endpoint => {
    const response = http.get(`${BASE_URL}${endpoint}`, { headers });
    
    check(response, {
      [`analytics ${endpoint} loads`]: (r) => r.status === 200,
      [`analytics ${endpoint} response time OK`]: (r) => r.timings.duration < 3000
    });
  });
}

// Setup and teardown
export function setup() {
  console.log('Starting load testing suite...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Test scenarios: ${testScenarios.join(', ')}`);
  
  // Warm up the application
  const warmupResponse = http.get(`${BASE_URL}/api/health`);
  if (warmupResponse.status !== 200) {
    console.warn('Application warmup failed');
  }
  
  return { timestamp: Date.now() };
}

export function teardown(data) {
  console.log('Load testing completed');
  console.log(`Test duration: ${(Date.now() - data.timestamp) / 1000}s`);
  
  // Generate summary report
  const summary = {
    test_duration: (Date.now() - data.timestamp) / 1000,
    scenarios_tested: testScenarios.length,
    base_url: BASE_URL
  };
  
  console.log('Test Summary:', JSON.stringify(summary, null, 2));
}

// Error handling
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_type: 'enterprise-load-test',
    results: {
      http_reqs: data.metrics.http_reqs.values.count,
      http_req_duration: {
        avg: data.metrics.http_req_duration.values.avg,
        p95: data.metrics.http_req_duration.values['p(95)'],
        p99: data.metrics.http_req_duration.values['p(99)']
      },
      error_rate: data.metrics.error_rate ? data.metrics.error_rate.values.rate : 0,
      throughput: data.metrics.throughput ? data.metrics.throughput.values.count : 0
    },
    business_metrics: {
      login_attempts: data.metrics.login_attempts ? data.metrics.login_attempts.values.count : 0,
      dashboard_loads: data.metrics.dashboard_loads ? data.metrics.dashboard_loads.values.count : 0,
      api_calls: data.metrics.api_calls ? data.metrics.api_calls.values.count : 0,
      conversion_rate: data.metrics.conversion_rate ? data.metrics.conversion_rate.values.rate : 0
    },
    thresholds: data.thresholds
  };
  
  return {
    'load-test-results.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

// Text summary helper
function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let output = `${indent}Zenith Enterprise Load Test Results\n`;
  output += `${indent}=====================================\n\n`;
  
  // HTTP metrics
  output += `${indent}HTTP Requests:\n`;
  output += `${indent}  Total: ${data.metrics.http_reqs.values.count}\n`;
  output += `${indent}  Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  
  // Response times
  output += `${indent}Response Times:\n`;
  output += `${indent}  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  output += `${indent}  P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  output += `${indent}  P99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  
  // Error rate
  const errorRate = data.metrics.error_rate ? data.metrics.error_rate.values.rate : 0;
  output += `${indent}Error Rate: ${(errorRate * 100).toFixed(2)}%\n\n`;
  
  // Business metrics
  output += `${indent}Business Metrics:\n`;
  output += `${indent}  Login Attempts: ${data.metrics.login_attempts ? data.metrics.login_attempts.values.count : 0}\n`;
  output += `${indent}  Dashboard Loads: ${data.metrics.dashboard_loads ? data.metrics.dashboard_loads.values.count : 0}\n`;
  output += `${indent}  API Calls: ${data.metrics.api_calls ? data.metrics.api_calls.values.count : 0}\n`;
  output += `${indent}  Conversion Rate: ${data.metrics.conversion_rate ? (data.metrics.conversion_rate.values.rate * 100).toFixed(2) : 0}%\n\n`;
  
  // Threshold results
  output += `${indent}Threshold Results:\n`;
  Object.entries(data.thresholds).forEach(([key, threshold]) => {
    const status = threshold.ok ? '✓' : '✗';
    output += `${indent}  ${status} ${key}\n`;
  });
  
  return output;
}