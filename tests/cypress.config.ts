import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:8080",
		specPattern: "cypress/e2e/**/*.cy.ts",
		supportFile: "cypress/support/e2e.ts",
		video: true,
		videosFolder: "cypress/videos",
		screenshotsFolder: "cypress/screenshots",
		viewportWidth: 1440,
		viewportHeight: 900,
		defaultCommandTimeout: 10_000,
		retries: { runMode: 1, openMode: 0 },
		reporter: "junit",
		reporterOptions: { mochaFile: "reports/cypress-[hash].xml", toConsole: false },
		env: { apiUrl: process.env.CYPRESS_API_URL ?? "http://localhost:8080/api/v1" },
	},
});
