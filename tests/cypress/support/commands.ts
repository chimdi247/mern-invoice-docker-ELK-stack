/// <reference types="cypress" />

const PASSWORD = "Str0ng!Passw0rd";

export interface TestUser {
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	password: string;
}

declare global {
	namespace Cypress {
		interface Chainable {
			/** creates an (auto-verified) account through the API */
			registerUser(): Chainable<TestUser>;
			/** logs in through the UI form */
			loginViaUi(user: Pick<TestUser, "email" | "password">): Chainable<void>;
			/** API login; stores the session the way the app does (localStorage "user") */
			loginViaApi(user: Pick<TestUser, "email" | "password">): Chainable<string>;
			/** creates a customer through the API for the logged in user; yields the customer */
			createCustomerViaApi(token: string): Chainable<{ _id: string; name: string; email: string }>;
		}
	}
}

const rand = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

Cypress.Commands.add("registerUser", () => {
	const user: TestUser = { email: `cy-${rand()}@example.com`, username: `u${rand()}`.slice(0, 20), firstName: "Jane", lastName: "Doe", password: PASSWORD };
	return cy
		.request("POST", `${Cypress.env("apiUrl")}/auth/register`, { ...user, passwordConfirm: user.password })
		.its("status")
		.should("eq", 200)
		.then(() => user);
});

Cypress.Commands.add("loginViaUi", ({ email, password }) => {
	cy.visit("/login");
	cy.get('input[name="email"]').type(email);
	cy.get('input[name="password"]').type(password, { log: false });
	cy.contains("button", "Login").click();
});

Cypress.Commands.add("loginViaApi", ({ email, password }) => {
	return cy.request("POST", `${Cypress.env("apiUrl")}/auth/login`, { email, password }).then((res) => {
		window.localStorage.setItem("user", JSON.stringify(res.body));
		return res.body.accessToken as string;
	});
});

Cypress.Commands.add("createCustomerViaApi", (token) => {
	return cy
		.request({
			method: "POST",
			url: `${Cypress.env("apiUrl")}/customer/create`,
			headers: { Authorization: `Bearer ${token}` },
			body: { name: "Cypress Customer", email: `cust-${rand()}@example.com`, phoneNumber: "+254712345678" },
		})
		.then((res) => res.body.createdCustomer);
});

export {};
