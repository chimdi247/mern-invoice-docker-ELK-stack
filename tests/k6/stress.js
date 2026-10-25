// STRESS: push beyond normal load in steps to find where it degrades, then check recovery (~14 min).
import { bootstrap, userJourney } from './lib/api.js';

export const options = {
  stages: [
    { duration: '2m', target: 40 },
    { duration: '3m', target: 80 },
    { duration: '3m', target: 160 },
    { duration: '3m', target: 240 },
    { duration: '3m', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.05'], http_req_duration: ['p(95)<2000'] },
  tags: { test: 'stress' },
};
export const setup = bootstrap;
export default (ctx) => userJourney(ctx);
