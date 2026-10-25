import { defineConfig } from "vitest/config";

// Unit tests (no network, no database). Needs `npm install` in the project root and in client/
// because the tests import the real backend / client source.
export default defineConfig({
	test: {
		include: ["unit/**/*.test.ts"],
		environment: "node",
		globals: true,
		setupFiles: ["./unit/setup.ts"],
		reporters: ["default", "junit"],
		outputFile: { junit: "./reports/unit-junit.xml" },
		coverage: { provider: "v8", include: ["../backend/**/*.ts", "../client/src/**/*.ts"], reportsDirectory: "./reports/coverage" },
	},
});
