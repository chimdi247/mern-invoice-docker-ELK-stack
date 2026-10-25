# Tests
# npx cypress run --config baseUrl=http://localhost:5173 --env apiUrl=http://localhost:1997/api/v1
# k6 run -e BASE_URL=http://localhost:1997 k6/smoke.js

| Kind | Tool | Folder | Run (from `tests/` after `npm install`) |
|---|---|---|---|
| Unit – backend + client logic | Vitest | `unit/` | `npm run test:unit` (needs `npm install` in the project root **and** `client/`) |
| Integration – real HTTP against the stack, incl. observability pipeline | Vitest + fetch | `integration/` | `npm run test:integration` |
| End-to-end UI | **Cypress** | `cypress/` | `npm run test:e2e` (`test:e2e:open` for the GUI) |
| UI (second browser stack) | **Selenium WebDriver** | `selenium/` | `npm run test:selenium` |
| Smoke | k6 | `k6/smoke.js` | `npm run perf:smoke` |
| Load | k6 | `k6/load.js` | `npm run perf:load` |
| Stress | k6 | `k6/stress.js` | `npm run perf:stress` |
| Spike | k6 | `k6/spike.js` | `npm run perf:spike` |
| Soak (30 min, `-e SOAK_DURATION=4h`) | k6 | `k6/soak.js` | `npm run perf:soak` |
| Breakpoint / capacity (open model) | k6 | `k6/breakpoint.js` | `npm run perf:breakpoint` |
| PDF endpoint (Chromium) | k6 | `k6/pdf.js` | `npm run perf:pdf` |

## Running the stack for tests
Integration, Cypress, Selenium and k6 need accounts that are already e-mail-verified and no rate limiting. The overlay provides both
(it sets the `E2E_AUTO_VERIFY` test hook – **never use it in production**) and publishes the API port:

```bash
docker compose -f docker-compose.yml -f tests/docker-compose.tests.yml up -d --build
cd tests && npm install
npm run test:unit && npm run test:integration && npm run test:e2e && npm run test:selenium
npm run perf:smoke        # k6 runs in docker inside the compose network
```
k6 streams its metrics to Mimir: open **Grafana → Invoice App - k6 Load Test** (and *Service Overview*, *Containers & Node*) while a test runs –
under `load`/`spike` the 40 % CPU/memory alert should fire and an e-mail is sent. Restore normal settings with `docker compose up -d api`.

Selenium Grid in docker: `docker compose -f docker-compose.yml -f tests/docker-compose.tests.yml --profile selenium up -d selenium`, then
`SELENIUM_REMOTE_URL=http://localhost:4444/wd/hub APP_URL=http://web:8080 API_URL=http://web:8080/api/v1 npm run test:selenium`.
