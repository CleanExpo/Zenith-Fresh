import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const dashboardDuration = new Trend('dashboard_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    errors: ['rate<0.1'],            // Error rate should be less than 10%
    login_duration: ['p(95)<2000'],  // 95% of login requests should be below 2s
    dashboard_duration: ['p(95)<3000'], // 95% of dashboard requests should be below 3s
  },
};

// Test data
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
};

// Helper function to get auth token
function getAuthToken() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(TEST_USER), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  return loginRes.json('token');
}

// Main test scenario
export default function () {
  // Login
  const loginStart = new Date();
  const token = getAuthToken();
  loginDuration.add(new Date() - loginStart);

  if (!token) {
    errorRate.add(1);
    return;
  }

  // Set auth header
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test dashboard access
  const dashboardStart = new Date();
  const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, { headers });
  dashboardDuration.add(new Date() - dashboardStart);

  check(dashboardRes, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard has data': (r) => r.json('data') !== undefined,
  });

  // Test team settings
  const settingsRes = http.get(`${BASE_URL}/api/team/settings`, { headers });
  check(settingsRes, {
    'settings status is 200': (r) => r.status === 200,
  });

  // Test billing
  const billingRes = http.get(`${BASE_URL}/api/billing`, { headers });
  check(billingRes, {
    'billing status is 200': (r) => r.status === 200,
  });

  // Add some sleep between requests
  sleep(1);
} 