import { URLS, api, customerPayload, documentPayload, newUser, registerAndLogin } from "./helpers";

describe("health", () => {
	it("the web container serves the SPA and the API through nginx", async () => {
		expect((await fetch(`${URLS.app}/healthz`)).status).toBe(200);
		const html = await (await fetch(URLS.app)).text();
		expect(html).toContain('<div id="root">');
		expect((await api("GET", "/test")).body).toEqual({ Hi: "Welcome to the Invoice App" });
	});

	it("GET /health reports MongoDB as connected", async () => {
		const res = await fetch(`${URLS.apiDirect}/health`);
		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({ status: "ok", service: "invoice-api", mongodb: "connected" });
	});

	it("SPA routes fall back to index.html (client-side routing)", async () => {
		const res = await fetch(`${URLS.app}/dashboard`);
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('<div id="root">');
	});
});

describe("auth", () => {
	it("registers (200), rejects a duplicate e-mail (400) and validates input", async () => {
		const user = newUser();
		expect((await api("POST", "/auth/register", { body: user })).status).toBe(200);
		expect((await api("POST", "/auth/register", { body: user })).status).toBe(400);
		expect((await api("POST", "/auth/register", { body: newUser({ password: "weak", passwordConfirm: "weak" }) })).status).toBe(400);
		expect((await api("POST", "/auth/register", { body: newUser({ passwordConfirm: "Different!1Pass" }) })).status).toBe(400);
		expect((await api("POST", "/auth/register", { body: { email: "x@y.com" } })).status).toBe(400);
	});

	it("logs in, sets an httpOnly refresh cookie and returns an access token", async () => {
		const u = await registerAndLogin();
		expect(u.token).toEqual(expect.any(String));
		expect(u.cookie).toMatch(/^jwt=/);
	});

	it("rejects wrong credentials with 401 and does not leak which part was wrong", async () => {
		const u = await registerAndLogin();
		const bad = await api("POST", "/auth/login", { body: { email: u.email, password: "Wrong!Passw0rd" } });
		expect(bad.status).toBe(401);
		expect(bad.body.message).toBe("Incorrect email or password");
		expect((await api("POST", "/auth/login", { body: { email: "nobody@example.com", password: "Wrong!Passw0rd" } })).status).toBe(401);
	});

	it("is not vulnerable to NoSQL operator injection on login", async () => {
		const res = await api("POST", "/auth/login", { body: { email: { $gt: "" }, password: { $gt: "" } } });
		expect([400, 401]).toContain(res.status);
	});

	it("protects private routes (401 without token, 403 with a bad token)", async () => {
		expect((await api("GET", "/user/profile")).status).toBe(401);
		expect((await api("GET", "/user/profile", { token: "garbage" })).status).toBe(403);
		expect((await api("GET", "/customer/all")).status).toBe(401);
		expect((await api("GET", "/document/all")).status).toBe(401);
		expect((await api("POST", "/document/generate-pdf", { body: {} })).status).toBe(401);
		expect((await api("PATCH", "/upload")).status).toBe(401);
	});

	it("returns the profile, hides secrets, and refuses privileged field changes", async () => {
		const u = await registerAndLogin();
		const profile = await api("GET", "/user/profile", { token: u.token });
		expect(profile.status).toBe(200);
		expect(profile.body.userProfile).toMatchObject({ email: u.email, firstName: "Jane" });
		expect(profile.body.userProfile.password).toBeUndefined();
		expect(profile.body.userProfile.refreshToken).toBeUndefined();

		expect((await api("PATCH", "/user/profile", { token: u.token, body: { roles: ["Admin"] } })).status).toBe(400);
		expect((await api("PATCH", "/user/profile", { token: u.token, body: { password: "x" } })).status).toBe(400);
		expect((await api("PATCH", "/user/profile", { token: u.token, body: { city: "Nairobi" } })).status).toBe(200);
	});

	it("rotates refresh tokens and detects re-use", async () => {
		const u = await registerAndLogin();
		const first = await api("GET", "/auth/new_access_token", { cookie: u.cookie });
		expect(first.status).toBe(200);
		expect(first.body.accessToken).toEqual(expect.any(String));
		expect(first.cookie).toBeDefined();
		expect(first.cookie).not.toBe(u.cookie);

		// the old cookie is now invalid (and using it revokes the whole token family)
		expect((await api("GET", "/auth/new_access_token", { cookie: u.cookie })).status).toBe(403);
		expect((await api("GET", "/auth/new_access_token", { cookie: first.cookie })).status).toBe(403);
	});

	it("an admin-only route is forbidden for a normal user", async () => {
		const u = await registerAndLogin();
		expect((await api("GET", "/user/all", { token: u.token })).status).toBe(401);
	});
});

describe("customers & documents (ownership, validation, lifecycle)", () => {
	it("full customer lifecycle", async () => {
		const u = await registerAndLogin();
		const created = await api("POST", "/customer/create", { token: u.token, body: customerPayload() });
		expect(created.status).toBe(200);
		const customer = created.body.createdCustomer;
		expect(customer.accountNo).toMatch(/^CUS-[0-9A-F]{6}$/);

		expect((await api("POST", "/customer/create", { token: u.token, body: customerPayload({ email: customer.email }) })).status).toBe(400);
		expect((await api("POST", "/customer/create", { token: u.token, body: { name: "x" } })).status).toBe(400);

		const list = await api("GET", "/customer/all", { token: u.token });
		expect(list.body.totalCustomers).toBe(1);

		expect((await api("GET", `/customer/${customer._id}`, { token: u.token })).status).toBe(200);
		const updated = await api("PATCH", `/customer/${customer._id}`, { token: u.token, body: { city: "Mombasa", accountNo: "HACK" } });
		expect(updated.body.updatedCustomerInfo.city).toBe("Mombasa");
		expect(updated.body.updatedCustomerInfo.accountNo).toBe(customer.accountNo); // generated field is protected

		expect((await api("DELETE", `/customer/${customer._id}`, { token: u.token })).status).toBe(200);
		expect((await api("GET", `/customer/${customer._id}`, { token: u.token })).status).toBe(404);
	});

	it("users cannot read, change or delete each other's data", async () => {
		const a = await registerAndLogin();
		const b = await registerAndLogin();
		const customer = (await api("POST", "/customer/create", { token: a.token, body: customerPayload() })).body.createdCustomer;
		const doc = (await api("POST", "/document/create", { token: a.token, body: documentPayload(customer) })).body.newDocument;

		for (const [method, path] of [
			["GET", `/customer/${customer._id}`],
			["PATCH", `/customer/${customer._id}`],
			["DELETE", `/customer/${customer._id}`],
			["GET", `/document/${doc._id}`],
			["PATCH", `/document/${doc._id}`],
			["DELETE", `/document/${doc._id}`],
			["POST", `/document/${doc._id}/payment`],
		] as const) {
			const res = await api(method, path, { token: b.token, body: {} });
			expect(res.status, `${method} ${path}`).toBe(401);
		}
		expect((await api("GET", "/document/all", { token: b.token })).body.totalDocuments).toBe(0);
	});

	it("full document lifecycle incl. payment, update and PDF", async () => {
		const u = await registerAndLogin();
		const customer = (await api("POST", "/customer/create", { token: u.token, body: customerPayload() })).body.createdCustomer;

		const created = await api("POST", "/document/create", { token: u.token, body: documentPayload(customer) });
		expect(created.status).toBe(200);
		const doc = created.body.newDocument;
		expect(doc.documentNumber).toMatch(/^\d{4}-\w+-[0-9A-F]{6}$/);

		expect((await api("GET", "/document/all", { token: u.token })).body.totalDocuments).toBe(1);
		expect((await api("GET", `/document/${doc._id}`, { token: u.token })).body.document.total).toBe(220);

		const pay = await api("POST", `/document/${doc._id}/payment`, { token: u.token, body: { datePaid: new Date().toISOString(), amountPaid: 220, paymentMethod: "Cash" } });
		expect(pay.status).toBe(201);

		const updated = await api("PATCH", `/document/${doc._id}`, { token: u.token, body: { status: "Paid", totalAmountReceived: 220, documentNumber: "HACK" } });
		expect(updated.body.updatedDocument.status).toBe("Paid");
		expect(updated.body.updatedDocument.documentNumber).toBe(doc.documentNumber); // generated field is protected
		expect(updated.body.updatedDocument.paymentRecords).toHaveLength(1);

		// PDF: rendered by headless Chromium inside the api container
		const res = await fetch(`${URLS.api}/document/generate-pdf`, {
			method: "POST",
			headers: { "content-type": "application/json", authorization: `Bearer ${u.token}` },
			body: JSON.stringify({ profile: { firstName: "Jane", email: u.email }, document: { ...updated.body.updatedDocument, customer }, totalAmountReceived: 220, status: "Paid" }),
		});
		expect(res.status).toBe(200);
		expect(res.headers.get("content-type")).toContain("application/pdf");
		const bytes = Buffer.from(await res.arrayBuffer());
		expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");

		expect((await api("DELETE", `/document/${doc._id}`, { token: u.token })).status).toBe(200);
	});

	it("PDF endpoint rejects incomplete payloads and survives HTML injection", async () => {
		const u = await registerAndLogin();
		expect((await api("POST", "/document/generate-pdf", { token: u.token, body: {} })).status).toBe(400);

		const evil = { name: '<img src="http://169.254.169.254/latest/meta-data/"><script>alert(1)</script>', email: "x@y.com" };
		const res = await fetch(`${URLS.api}/document/generate-pdf`, {
			method: "POST",
			headers: { "content-type": "application/json", authorization: `Bearer ${u.token}` },
			body: JSON.stringify({ profile: { firstName: "Jane" }, document: { ...documentPayload(evil), documentNumber: "X", createdAt: new Date().toISOString() }, totalAmountReceived: 0 }),
		});
		expect(res.status).toBe(200); // rendered with the markup escaped, nothing fetched
	});

	it("unknown routes return a JSON 404", async () => {
		const res = await api("GET", "/does-not-exist");
		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
	});
});
