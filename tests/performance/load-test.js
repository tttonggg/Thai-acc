# ============================================
# k6 Performance Test Script
# ============================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiRequestDuration = new Trend('api_request_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Main test scenario
export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  const healthCheck = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(!healthCheck);
  apiRequestDuration.add(healthRes.timings.duration);

  sleep(1);

  // API endpoint tests (public)
  const endpoints = [
    '/api/accounts',
    '/api/invoices',
    '/api/customers',
  ];

  for (const endpoint of endpoints) {
    const res = http.get(`${BASE_URL}${endpoint}`);
    const success = check(res, {
      [`${endpoint} status is 200 or 401`]: (r) => r.status === 200 || r.status === 401,
      [`${endpoint} response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });
    errorRate.add(!success);
    apiRequestDuration.add(res.timings.duration);
  }

  sleep(1);
}

// Login scenario
export function loginScenario() {
  const payload = JSON.stringify({
    email: 'admin@thaiaccounting.com',
    password: 'admin123',
  });

  const res = http.post(`${BASE_URL}/api/auth/callback/credentials`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const success = check(res, {
    'login status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'login response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!success);

  sleep(2);
}

// Stress test scenario
export function stressTest() {
  const res = http.get(`${BASE_URL}/api/health`);
  
  check(res, {
    'stress test: status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 2);
}

// Setup function
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed');
}
