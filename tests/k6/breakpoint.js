// BREAKPOINT: ramp the ARRIVAL RATE until the system breaks; aborts when thresholds fail.
// The last passing request rate is the capacity of this deployment (open model).
import { bootstrap, userJourney } from './lib/api.js';

export const options = {
  scenarios: {
    breakpoint: {
      executor: 'ramping-arrival-rate',
      startRate: 5, timeUnit: '1s', preAllocatedVUs: 100, maxVUs: 1500,
      stages: [{ duration: '10m', target: 300 }],
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '30s' }],
    http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: true, delayAbortEval: '30s' }],
  },
  tags: { test: 'breakpoint' },
};
export const setup = bootstrap;
export default (ctx) => userJourney(ctx);
