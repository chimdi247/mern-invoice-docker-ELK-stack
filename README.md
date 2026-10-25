# MERN Invoice (TypeScript · Docker · OpenTelemetry · Grafana · ELK)

Create customers, invoices, receipts and quotations, record payments and e-mail PDFs.
React 19 + MUI 7 + RTK Query (Vite, TypeScript) · Express 5 + Mongoose 8 (TypeScript) · MongoDB 8.

## Run everything with one command

```bash
cp .env.example .env          # set MONGO_ROOT_PASSWORD, JWT_*_SECRET_KEY, SMTP_USER/SMTP_PASS (Gmail), ALERT_EMAIL_TO
docker compose up -d --build   # or: make build
```
Linux hosts: `sudo sysctl -w vm.max_map_count=262144` once (Elasticsearch).

| What | URL |
|---|---|
| **App** (React via nginx, `/api` proxied to the API) | <http://localhost:8080> |
| **Grafana** – dashboards + alerts | <http://localhost:3000> (`admin` / `admin`) |
| **Kibana** – structured logs (Discover → *Invoice App logs*) | <http://localhost:5601> |
| MinIO console (S3 buckets of Mimir) | <http://localhost:9001> |
| Mongo Express (`--profile tools`) / MailHog (`--profile mailhog`) | :8081 / :8025 |

The first start builds two images (API with headless Chromium, web with nginx) and pulls ~15 images; the Elasticsearch / Kibana
set-up jobs run once and exit (`docker compose ps -a`).

### Gmail SMTP (e-mail verification, password reset, PDF e-mails, Grafana alerts)
Mailgun was removed. Gmail needs 2-Step Verification and an **App Password** (<https://myaccount.google.com/apppasswords>):
`SMTP_USER=<you>@gmail.com`, `SMTP_PASS=<16 char app password>` (port 587/STARTTLS; 465 + `SMTP_SECURE=true` also works).
Without credentials the app runs, e-mails are logged as `email_not_sent` and counted in the *E-mail failures* KPI.
To try the flow without Gmail: `docker compose --profile mailhog up -d` with `SMTP_HOST=mailhog SMTP_PORT=1025 SMTP_USER= SMTP_PASS=`.

## Architecture

```
 browser ──► web (nginx :8080) ──/api──► api (Express, TypeScript) ──► mongodb
                                            │ OTLP metrics+traces          │ stdout JSON (winston, trace_id)
                                            ▼                              ▼
   cAdvisor, node-exporter,        otel-collector ──► Mimir ──► Grafana   docker fluentd log driver
   blackbox, fluent-bit ──scrape──►     │      (blocks in S3/MinIO)           │
                                        └─ spanmetrics (Mongo/HTTP RED)       ▼
                                                                         Fluent Bit ──► Elasticsearch ──► Kibana
```
* **Metrics** – OpenTelemetry auto-instrumentation (http, express, mongodb, mongoose, runtime) + custom RED metrics + business KPIs
  (`invoice_*`: users, logins, customers, documents by type, invoiced value, payments, PDFs, e-mails) → Collector → **Mimir** (S3 persistence) → **Grafana**.
* **Logs** – one JSON object per line on stdout (level, message, service, method, route, status_code, duration_ms, **trace_id**, **span_id**) →
  Docker `fluentd` log driver → **Fluent Bit** (JSON parse) → **Elasticsearch** (14-day ILM) → **Kibana** (data view + 9 saved searches).
* **Dashboards** (`observability/grafana/dashboards`): *Service Overview* (uptime, latency, SLI/SLO, error budget, 2xx vs 4xx/5xx counts),
  *Business KPIs*, *Containers & Node* (CPU / memory, 40 % threshold lines), *Runtime, MongoDB & Logging pipeline*, *k6 Load Test*.
* **Alerts** (Grafana-managed, e-mail via Gmail SMTP): container CPU > 40 %, container memory > 40 % (of limit; `api`/`web` have limits), node CPU > 40 %,
  node memory > 40 %, plus component down, 5xx ratio > 5 %, e-mail failures.

Everything under `observability/` is bind-mounted read-only into its container (see `docker-compose.yml`).

## Layout
```
backend/          Express 5 API in TypeScript (app.ts, server.ts, instrumentation.ts, observability/, controllers, models, ...)
client/           React 19 + Vite + TypeScript, Dockerfile + nginx/default.conf
docker/api/       API Dockerfile (multi-stage, Chromium for PDFs, non-root, tini)
observability/    mimir, otel-collector, fluent-bit, elasticsearch, kibana, grafana (provisioning + dashboards), blackbox
tests/            unit (vitest), integration, cypress (e2e), selenium, k6 (smoke/load/stress/spike/soak/breakpoint/pdf)
docker-compose.yml  the single compose file
```

## Development without Docker
```bash
docker compose up -d mongodb          # (publish 27017 or use your own MongoDB)
npm install && npm run dev            # API on :1997 (tsx watch; OpenTelemetry off)
cd client && npm install && npm run dev   # Vite on :3000, proxies /api to :1997
npm run typecheck && npm --prefix client run typecheck
```

## What changed vs. the original project
* **TypeScript** everywhere (backend + frontend); Node 22; CRA → **Vite** (react-scripts is abandoned and cannot run React 19 / TS 5).
* **Dependencies** raised to current majors: Express 5, Mongoose 8, React 19, MUI 7 (Grid v2), RTK 2, React Router 7, Yup 1, date-fns 4, nodemailer 7, multer 2 …
  (`html-pdf`/PhantomJS replaced by Puppeteer + system Chromium; `express-mongo-sanitize` replaced by a small Express-5-safe middleware;
  `express-async-handler`, `morgan`, `winston-daily-rotate-file`, `mailgun`, `nodemailer-mailgun-transport` removed.)
* **Bugs / security fixed while converting** – any user could read any customer/document (id compared with user id); password reset never validated the
  token (looked up a non-existent field); upload and PDF endpoints were unauthenticated and the PDF endpoint shared one file on disk; `doc.remove()/delete()`
  (removed in Mongoose 7) ; unexpected errors were returned with HTTP 200; `/get-pdf` was shadowed by `/:id`; unbounded profile PATCH (roles/active);
  generated document/customer numbers changed on every save; logout/verify continued after sending a response; user HTML was interpolated into PDFs.
* Cookie flags and CORS origins are configurable (`COOKIE_SECURE`, `COOKIE_SAMESITE`, `CORS_ORIGINS`); the API is same-origin behind nginx.

## Tests
See [`tests/README.md`](tests/README.md). `make test` runs the unit tests; the rest need the stack running with `tests/docker-compose.tests.yml`.
