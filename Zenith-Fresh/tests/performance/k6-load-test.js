/**
 * K6 Performance Testing Scripts
 * Comprehensive load testing for Zenith Platform
 * Tests API endpoints, user journeys, and system limits
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const responseTimeAPI = new Trend('api_response_time');
const requestsPerSecond = new Rate('requests_per_second');
const dbConnections = new Counter('db_connections');

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Load test stages - simulating real-world traffic patterns
const stages = {
  // Smoke test
  smoke: [
    { duration: '1m', target: 10 },
  ],
  
  // Load test
  load: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  
  // Stress test
  stress: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 400 },
    { duration: '3m', target: 0 },
  ],
  
  // Spike test
  spike: [
    { duration: '1m', target: 100 },
    { duration: '30s', target: 1000 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  
  // Soak test (endurance)
  soak: [
    { duration: '5m', target: 100 },
    { duration: '30m', target: 100 },
    { duration: '5m', target: 0 },
  ],
  
  // Million user simulation
  millionUser: [
    { duration: '10m', target: 1000 },
    { duration: '20m', target: 5000 },
    { duration: '30m', target: 10000 },
    { duration: '20m', target: 5000 },
    { duration: '10m', target: 0 },
  ],
};

// Test scenarios
export const options = {
  scenarios: {
    // API Load Test
    api_load_test: {
      executor: 'ramping-vus',
      stages: stages[__ENV.TEST_TYPE || 'load'],
      tags: { test_type: 'api_load' },
    },
    
    // Website Analyzer Heavy Load
    analyzer_stress: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { test_type: 'analyzer_stress' },
    },
    
    // User Journey Test
    user_journey: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 5,
      maxDuration: '10m',
      tags: { test_type: 'user_journey' },
    },
  },
  
  // Performance thresholds
  thresholds: {
    // Overall error rate should be less than 1%
    'errors': ['rate<0.01'],
    
    // 95% of requests should complete within 2 seconds
    'http_req_duration': ['p(95)<2000'],
    
    // API response time should be under 500ms for 90% of requests
    'api_response_time': ['p(90)<500'],
    
    // Requests per second should be sustainable
    'http_reqs': ['rate>10'],
    
    // Database connections should not exceed limit
    'db_connections': ['count<1000'],
  },
};

// Test data
const testData = {
  users: [
    { email: 'load-test-1@zenith.com', password: 'LoadTest123!' },
    { email: 'load-test-2@zenith.com', password: 'LoadTest123!' },
    { email: 'load-test-3@zenith.com', password: 'LoadTest123!' },
  ],
  websites: [
    'https://example.com',
    'https://google.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://developer.mozilla.org',
  ],
  teams: [
    { name: 'Load Test Team 1', description: 'Performance testing team' },
    { name: 'Load Test Team 2', description: 'Stress testing team' },
  ],
};

// Authentication helper
function authenticate(email, password) {
  const loginPayload = {
    email: email,
    password: password,
  };

  const loginResponse = http.post(`${API_BASE}/auth/signin`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time OK': (r) => r.timings.duration < 1000,
  });

  if (loginResponse.status === 200) {
    const cookies = loginResponse.cookies;
    return cookies;
  }
  
  return null;
}

// API endpoint tests
export function apiLoadTest() {
  const user = testData.users[randomIntBetween(0, testData.users.length - 1)];
  const cookies = authenticate(user.email, user.password);
  
  if (!cookies) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v.value}`).join('; '),
  };

  // Test health endpoint
  const healthResponse = http.get(`${API_BASE}/health`);
  check(healthResponse, {
    'health check status 200': (r) => r.status === 200,
    'health check response time OK': (r) => r.timings.duration < 100,
  });
  responseTimeAPI.add(healthResponse.timings.duration);

  // Test teams endpoint
  const teamsResponse = http.get(`${API_BASE}/teams`, { headers });
  check(teamsResponse, {
    'teams endpoint status 200': (r) => r.status === 200,
    'teams response time OK': (r) => r.timings.duration < 500,
  });
  responseTimeAPI.add(teamsResponse.timings.duration);

  // Test website analyzer
  const website = testData.websites[randomIntBetween(0, testData.websites.length - 1)];
  const analyzePayload = { url: website };
  
  const analyzeResponse = http.post(
    `${API_BASE}/website-analyzer/analyze`,
    JSON.stringify(analyzePayload),
    { headers }
  );
  
  check(analyzeResponse, {
    'analyze endpoint accepts request': (r) => r.status === 200 || r.status === 202,
    'analyze response time acceptable': (r) => r.timings.duration < 5000,
  });
  responseTimeAPI.add(analyzeResponse.timings.duration);

  // Test user profile
  const profileResponse = http.get(`${API_BASE}/user/profile`, { headers });
  check(profileResponse, {
    'profile endpoint status 200': (r) => r.status === 200,
    'profile response time OK': (r) => r.timings.duration < 300,
  });
  responseTimeAPI.add(profileResponse.timings.duration);

  // Add error tracking
  [healthResponse, teamsResponse, analyzeResponse, profileResponse].forEach(response => {
    if (response.status >= 400) {
      errorRate.add(1);
    }
  });

  sleep(1);
}

// Website analyzer stress test
export function analyzerStressTest() {
  const user = testData.users[randomIntBetween(0, testData.users.length - 1)];
  const cookies = authenticate(user.email, user.password);
  
  if (!cookies) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v.value}`).join('; '),
  };

  // Simulate heavy analyzer usage
  for (let i = 0; i < 3; i++) {
    const website = testData.websites[randomIntBetween(0, testData.websites.length - 1)];
    const analyzePayload = { url: website };
    
    const response = http.post(
      `${API_BASE}/website-analyzer/analyze`,
      JSON.stringify(analyzePayload),
      { headers, timeout: '30s' }
    );
    
    check(response, {
      'analyzer handles stress': (r) => r.status === 200 || r.status === 202 || r.status === 429,
      'analyzer stress response time': (r) => r.timings.duration < 10000,
    });

    if (response.status >= 400 && response.status !== 429) {
      errorRate.add(1);
    }

    // Simulate real user behavior
    sleep(randomIntBetween(2, 5));
  }
}

// Complete user journey test
export function userJourneyTest() {
  const userIndex = randomIntBetween(0, testData.users.length - 1);
  const user = testData.users[userIndex];
  
  // Step 1: Login
  const cookies = authenticate(user.email, user.password);
  if (!cookies) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v.value}`).join('; '),
  };

  sleep(1);

  // Step 2: Check dashboard
  const dashboardResponse = http.get(`${BASE_URL}/dashboard`, { headers });
  check(dashboardResponse, {
    'dashboard loads': (r) => r.status === 200,
    'dashboard performance': (r) => r.timings.duration < 2000,
  });

  sleep(2);

  // Step 3: Create team
  const teamData = {
    name: `${testData.teams[0].name} ${randomString(5)}`,
    description: testData.teams[0].description,
    slug: `load-test-${randomString(8)}`,
  };

  const createTeamResponse = http.post(
    `${API_BASE}/teams`,
    JSON.stringify(teamData),
    { headers }
  );

  check(createTeamResponse, {
    'team creation successful': (r) => r.status === 201,
    'team creation performance': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Step 4: Analyze website
  const website = testData.websites[randomIntBetween(0, testData.websites.length - 1)];
  const analyzePayload = { url: website };
  
  const analyzeResponse = http.post(
    `${API_BASE}/website-analyzer/analyze`,
    JSON.stringify(analyzePayload),
    { headers }
  );

  check(analyzeResponse, {
    'website analysis initiated': (r) => r.status === 200 || r.status === 202,
    'analysis response time': (r) => r.timings.duration < 5000,
  });

  sleep(3);

  // Step 5: View scan history
  const historyResponse = http.get(`${API_BASE}/website-analyzer/history`, { headers });
  check(historyResponse, {
    'scan history loads': (r) => r.status === 200,
    'history performance': (r) => r.timings.duration < 1000,
  });

  // Count database connections
  dbConnections.add(1);

  sleep(1);
}

// Database stress test
export function databaseStressTest() {
  const user = testData.users[randomIntBetween(0, testData.users.length - 1)];
  const cookies = authenticate(user.email, user.password);
  
  if (!cookies) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v.value}`).join('; '),
  };

  // Simulate database-heavy operations
  const operations = [
    () => http.get(`${API_BASE}/teams`, { headers }),
    () => http.get(`${API_BASE}/website-analyzer/history`, { headers }),
    () => http.get(`${API_BASE}/user/profile`, { headers }),
    () => http.get(`${API_BASE}/dashboard/stats`, { headers }),
  ];

  // Execute multiple database operations
  operations.forEach(operation => {
    const response = operation();
    check(response, {
      'database operation successful': (r) => r.status === 200,
      'database response time': (r) => r.timings.duration < 1000,
    });
    
    if (response.status >= 400) {
      errorRate.add(1);
    }
    
    dbConnections.add(1);
  });

  sleep(0.5);
}

// Memory leak detection test
export function memoryLeakTest() {
  const user = testData.users[randomIntBetween(0, testData.users.length - 1)];
  const cookies = authenticate(user.email, user.password);
  
  if (!cookies) {
    errorRate.add(1);
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v.value}`).join('; '),
  };

  // Create and delete resources repeatedly
  for (let i = 0; i < 10; i++) {
    // Create team
    const teamData = {
      name: `Temp Team ${randomString(8)}`,
      description: 'Temporary team for testing',
      slug: `temp-${randomString(8)}`,
    };

    const createResponse = http.post(
      `${API_BASE}/teams`,
      JSON.stringify(teamData),
      { headers }
    );

    if (createResponse.status === 201) {
      const teamId = JSON.parse(createResponse.body).team.id;
      
      // Delete team
      const deleteResponse = http.del(`${API_BASE}/teams/${teamId}`, null, { headers });
      check(deleteResponse, {
        'team deletion successful': (r) => r.status === 200,
      });
    }

    sleep(0.1);
  }
}

// Main test execution
export default function () {
  const scenario = __ENV.K6_SCENARIO || 'api_load_test';
  
  switch (scenario) {
    case 'api_load_test':
      apiLoadTest();
      break;
    case 'analyzer_stress':
      analyzerStressTest();
      break;
    case 'user_journey':
      userJourneyTest();
      break;
    case 'database_stress':
      databaseStressTest();
      break;
    case 'memory_leak':
      memoryLeakTest();
      break;
    default:
      apiLoadTest();
  }
}

// Test teardown
export function teardown(data) {
  console.log('Test completed');
  console.log(`Total errors: ${errorRate.values.length}`);
  console.log(`Average API response time: ${responseTimeAPI.avg}ms`);
  console.log(`Total database connections: ${dbConnections.count}`);
}