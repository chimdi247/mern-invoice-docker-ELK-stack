// Inside the compose network the web container is http://web:8080 (nginx -> api).
// From the host use BASE_URL=http://localhost:8080.
export const BASE_URL = __ENV.BASE_URL || 'http://web:8080';
export const API = `${BASE_URL}/api/v1`;

// SLO-derived thresholds reused by the scenarios (override per test where it makes sense)
export const defaultThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  checks: ['rate>0.99'],
};
