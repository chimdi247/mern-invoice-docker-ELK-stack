// SMOKE: minimal load, proves the whole stack works after a deploy (~1 min).
import { bootstrap, userJourney } from './lib/api.js';
import { defaultThresholds } from './lib/config.js';

export const options = { vus: 1, duration: '1m', thresholds: defaultThresholds, tags: { test: 'smoke' } };
export const setup = bootstrap;
export default (ctx) => userJourney(ctx);
