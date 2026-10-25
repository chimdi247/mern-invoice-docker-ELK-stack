// SPIKE: sudden surge then immediate drop (end-of-month invoicing rush). Watch the container CPU/memory
// alerts (40%), the p95 latency and the recovery afterwards (~5 min).
import { bootstrap, userJourney } from './lib/api.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '10s', target: 300 },
    { duration: '1m', target: 300 },
    { duration: '10s', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.10'], http_req_duration: ['p(95)<3000'] },
  tags: { test: 'spike' },
};
export const setup = bootstrap;
export default (ctx) => userJourney(ctx);
