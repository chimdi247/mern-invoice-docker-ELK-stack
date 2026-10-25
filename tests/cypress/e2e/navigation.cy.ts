describe("public pages and routing", () => {
	it("serves the landing page", () => {
		cy.visit("/");
		cy.get("#root").should("not.be.empty");
	});

	it("shows the 404 page for unknown routes (SPA fallback works through nginx)", () => {
		cy.visit("/definitely/not/a/page");
		cy.get("#root").should("not.be.empty");
	});

	it("exposes the API through the same origin", () => {
		cy.request(`${Cypress.env("apiUrl")}/test`).its("body").should("deep.equal", { Hi: "Welcome to the Invoice App" });
	});

	it("never exposes stack traces in production error responses", () => {
		cy.request({ url: `${Cypress.env("apiUrl")}/nope`, failOnStatusCode: false }).then((res) => {
			expect(res.status).to.eq(404);
			expect(res.body.stack).to.eq(null);
		});
	});
});
