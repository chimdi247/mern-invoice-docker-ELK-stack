// PDF: the most expensive endpoint (headless Chromium inside the API container). Finds how many concurrent
// PDF renders the 1 CPU / 1 GB container sustains and whether memory returns to baseline afterwards.
import http from 'k6/http';
import { check } from 'k6';
import { API } from './lib/config.js';
import { bootstrap, documentBody } from './lib/api.js';

export const options = {
  stages: [
    { duration: '1m', target: 3 },
    { duration: '3m', target: 6 },
    { duration: '1m', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.02'], http_req_duration: ['p(95)<8000'] },
  tags: { test: 'pdf' },
};
export const setup = bootstrap;

export default function ({ token, customer }) {
  const document = { ...documentBody(customer), documentNumber: '2026-Test-ABC123', createdAt: new Date().toISOString() };
  const res = http.post(`${API}/document/generate-pdf`,
    JSON.stringify({ profile: { firstName: 'K6', email: 'k6@example.com' }, document, totalAmountReceived: 0, status: 'Not Paid' }),
    { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, tags: { name: 'POST /document/generate-pdf' } });
  check(res, {
    'pdf 200': (r) => r.status === 200,
    'is a pdf': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/pdf'),
  });
}
