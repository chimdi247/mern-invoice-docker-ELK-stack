// Helpers for tests that run against the LIVE docker compose stack (see tests/docker-compose.tests.yml).
export const URLS = {
	app: process.env.APP_URL ?? "http://localhost:8080",
	api: process.env.API_URL ?? "http://localhost:8080/api/v1",
	apiDirect: process.env.API_DIRECT_URL ?? "http://localhost:1997",
	mimir: process.env.MIMIR_URL ?? "http://localhost:9009",
	elasticsearch: process.env.ELASTICSEARCH_URL ?? "http://localhost:9200",
	kibana: process.env.KIBANA_URL ?? "http://localhost:5601",
	grafana: process.env.GRAFANA_URL ?? "http://localhost:3000",
};

export const GRAFANA_AUTH =
	"Basic " + Buffer.from(`${process.env.GRAFANA_ADMIN_USER ?? "admin"}:${process.env.GRAFANA_ADMIN_PASSWORD ?? "admin"}`).toString("base64");

export const PASSWORD = "Str0ng!Passw0rd";

const rand = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
export const uniqueEmail = (prefix = "it") => `${prefix}-${rand()}@example.com`;
export const uniqueUsername = () => `u${rand()}`.slice(0, 20);

export interface Res<T = any> {
	status: number;
	body: T;
	headers: Headers;
	cookie?: string;
}

export async function api<T = any>(method: string, path: string, opts: { token?: string; body?: unknown; cookie?: string } = {}): Promise<Res<T>> {
	const res = await fetch(`${URLS.api}${path}`, {
		method,
		headers: {
			"content-type": "application/json",
			...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
			...(opts.cookie ? { cookie: opts.cookie } : {}),
		},
		body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
		redirect: "manual",
	});
	const text = await res.text();
	let body: any = text;
	try {
		body = text ? JSON.parse(text) : undefined;
	} catch {
		/* not JSON */
	}
	const setCookie = res.headers.getSetCookie?.()?.find((c) => c.startsWith("jwt="));
	return { status: res.status, body, headers: res.headers, cookie: setCookie?.split(";")[0] };
}

export const newUser = (over: Record<string, unknown> = {}) => {
	const email = uniqueEmail();
	return { email, username: uniqueUsername(), firstName: "Jane", lastName: "Doe", password: PASSWORD, passwordConfirm: PASSWORD, ...over };
};

/** Registers a fresh account (auto-verified by the test overlay) and logs it in. */
export async function registerAndLogin() {
	const user = newUser();
	const reg = await api("POST", "/auth/register", { body: user });
	if (reg.status !== 200) throw new Error(`register failed: ${reg.status} ${JSON.stringify(reg.body)}`);
	const login = await api("POST", "/auth/login", { body: { email: user.email, password: user.password } });
	if (login.status !== 200) throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)} (is tests/docker-compose.tests.yml applied?)`);
	return { ...user, token: login.body.accessToken as string, cookie: login.cookie };
}

export const customerPayload = (over: Record<string, unknown> = {}) => ({
	name: "Acme Customer",
	email: uniqueEmail("cust"),
	phoneNumber: "+254712345678",
	vatTinNo: 123456,
	address: "1 Main St",
	city: "Nairobi",
	country: "Kenya",
	...over,
});

export const documentPayload = (customer: Record<string, unknown>, over: Record<string, unknown> = {}) => ({
	customer,
	documentType: "Invoice",
	dueDate: new Date(Date.now() + 7 * 864e5).toISOString(),
	currency: "USD",
	status: "Not Paid",
	billingItems: [{ itemName: "Consulting", unitPrice: 100, quantity: 2, discount: 0 }],
	subTotal: 200,
	salesTax: 20,
	rates: 10,
	total: 220,
	paymentRecords: [],
	additionalInfo: "created by an integration test",
	termsConditions: "Net 7",
	...over,
});

/** Polls `fn` until it returns a truthy value (or throws on timeout). */
export async function eventually<T>(fn: () => Promise<T | undefined | null | false>, { timeoutMs = 60_000, intervalMs = 2_000, what = "condition" } = {}): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	let last: unknown;
	while (Date.now() < deadline) {
		try {
			const v = await fn();
			if (v) return v;
		} catch (e) {
			last = e;
		}
		await new Promise((r) => setTimeout(r, intervalMs));
	}
	throw new Error(`timed out waiting for ${what}${last ? `: ${String(last)}` : ""}`);
}
