/**
 * The observability pipeline itself, end to end:
 *   API traffic -> OpenTelemetry metrics -> Collector -> Mimir (S3)          -> Grafana
 *   API stdout JSON -> Fluent Bit -> Elasticsearch (trace_id, status, ...)  -> Kibana
 */
import { GRAFANA_AUTH, URLS, api, customerPayload, documentPayload, eventually, registerAndLogin } from "./helpers";

const promQuery = async (q: string) => {
	const r = await fetch(`${URLS.mimir}/prometheus/api/v1/query?query=${encodeURIComponent(q)}`);
	return (await r.json()).data?.result ?? [];
};

describe("generate some traffic", () => {
	it("creates business activity (and one 404) to look for in the telemetry", async () => {
		const u = await registerAndLogin();
		const customer = (await api("POST", "/customer/create", { token: u.token, body: customerPayload() })).body.createdCustomer;
		await api("POST", "/document/create", { token: u.token, body: documentPayload(customer) });
		await api("GET", "/nope");
		await api("POST", "/auth/login", { body: { email: u.email, password: "Wrong!Passw0rd" } });
	});
});

describe("metrics in Mimir", () => {
	it("has HTTP RED metrics for invoice-api", async () => {
		const r = await eventually(async () => {
			const x = await promQuery('sum(app_http_requests_total{job="invoice-api"})');
			return x.length ? x : undefined;
		}, { what: "app_http_requests_total" });
		expect(Number(r[0].value[1])).toBeGreaterThan(0);
	});

	it("has business KPI counters", async () => {
		for (const metric of ["invoice_users_registered_total", "invoice_customers_created_total", "invoice_documents_created_total", "invoice_user_logins_total"]) {
			const r = await eventually(async () => {
				const x = await promQuery(`sum(${metric})`);
				return x.length ? x : undefined;
			}, { what: metric });
			expect(Number(r[0].value[1])).toBeGreaterThan(0);
		}
	});

	it("records failed requests separately (404 and 401 are visible by status code)", async () => {
		const r = await eventually(async () => {
			const x = await promQuery('sum(app_http_requests_total{job="invoice-api",status_code=~"4.."})');
			return x.length ? x : undefined;
		}, { what: "4xx counter" });
		expect(Number(r[0].value[1])).toBeGreaterThan(0);
	});

	it.each([
		["cAdvisor (containers)", 'count(container_memory_working_set_bytes{name=~"invoice-.*"})'],
		["node_exporter", "count(node_cpu_seconds_total)"],
		["blackbox uptime probes", 'probe_success{job=~"blackbox-.*"}'],
		["fluent-bit", "fluentbit_input_records_total"],
	])("is receiving data from %s", async (_name, q) => {
		const r = await eventually(async () => {
			const x = await promQuery(q);
			return x.length ? x : undefined;
		}, { what: q, timeoutMs: 90_000 });
		expect(r.length).toBeGreaterThan(0);
	});
});

describe("structured logs in Elasticsearch / Kibana", () => {
	const search = async (query: object) => {
		const r = await fetch(`${URLS.elasticsearch}/invoice-logs-*/_search`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ size: 5, sort: [{ "@timestamp": "desc" }], query }),
		});
		return (await r.json()).hits?.hits?.map((h: any) => h._source) ?? [];
	};

	it("indexes the API's JSON access logs as real fields", async () => {
		const hits = await eventually(async () => {
			const x = await search({ bool: { filter: [{ term: { service: "invoice-api" } }, { match_phrase: { message: "http_request" } }, { exists: { field: "status_code" } }] } });
			return x.length ? x : undefined;
		}, { what: "http_request logs", timeoutMs: 90_000 });
		expect(hits[0]).toMatchObject({ service: "invoice-api", message: "http_request" });
		expect(typeof hits[0].duration_ms).toBe("number");
		expect(hits[0].route).toEqual(expect.any(String));
		expect(hits[0].path).not.toContain("?"); // query strings are never logged
	});

	it("carries the OpenTelemetry trace_id / span_id for correlation", async () => {
		const hits = await eventually(async () => {
			const x = await search({ bool: { filter: [{ term: { service: "invoice-api" } }, { exists: { field: "trace_id" } }] } });
			return x.length ? x : undefined;
		}, { what: "logs with trace_id", timeoutMs: 90_000 });
		expect(hits[0].trace_id).toMatch(/^[0-9a-f]{32}$/);
		expect(hits[0].span_id).toMatch(/^[0-9a-f]{16}$/);
	});

	it("warns on failed logins (level + message fields are searchable)", async () => {
		const hits = await eventually(async () => {
			const x = await search({ bool: { filter: [{ term: { level: "warn" } }, { match_phrase: { message: "login_failed" } }] } });
			return x.length ? x : undefined;
		}, { what: "login_failed warning", timeoutMs: 90_000 });
		expect(hits.length).toBeGreaterThan(0);
	});

	it("Kibana has the 'Invoice App logs' data view and saved searches", async () => {
		const dv = await fetch(`${URLS.kibana}/api/data_views/data_view/invoice-logs`, { headers: { "kbn-xsrf": "true" } });
		expect(dv.status).toBe(200);
		const searches = await (await fetch(`${URLS.kibana}/api/saved_objects/_find?type=search&per_page=50`, { headers: { "kbn-xsrf": "true" } })).json();
		expect(searches.total).toBeGreaterThanOrEqual(9);
	});
});

describe("Grafana provisioning", () => {
	const g = (path: string) => fetch(`${URLS.grafana}${path}`, { headers: { authorization: GRAFANA_AUTH } });

	it("is healthy and has the Mimir datasource", async () => {
		expect((await fetch(`${URLS.grafana}/api/health`)).status).toBe(200);
		const ds = (await (await g("/api/datasources")).json()).map((d: any) => d.uid);
		expect(ds).toContain("mimir");
	});

	it("provisions the dashboards", async () => {
		const found = await (await g("/api/search?type=dash-db&tag=invoice-app")).json();
		expect(found.length).toBeGreaterThanOrEqual(4);
	});

	it("provisions the CPU / memory > 40% alert rules and the e-mail contact point", async () => {
		const titles = (await (await g("/api/v1/provisioning/alert-rules")).json()).map((r: any) => r.title);
		expect(titles).toEqual(expect.arrayContaining(["Container CPU > 40%", "Container memory > 40%", "Node CPU > 40%", "Node memory > 40%"]));
		const cps = await (await g("/api/v1/provisioning/contact-points")).json();
		expect(cps.some((c: any) => c.type === "email")).toBe(true);
	});
});
