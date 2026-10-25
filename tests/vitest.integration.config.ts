import { defineConfig } from "vitest/config";

// Integration tests talk to the RUNNING stack (docker compose + tests/docker-compose.tests.yml).
export default defineConfig({
	test: {
		include: ["integration/**/*.test.ts"],
		environment: "node",
		globals: true,
		testTimeout: 60_000,
		hookTimeout: 120_000,
		fileParallelism: false,
		reporters: ["default", "junit"],
		outputFile: { junit: "./reports/integration-junit.xml" },
	},
});
