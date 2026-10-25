/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In dev the API is reached through the Vite proxy (same-origin, like nginx does in docker):
//   VITE_DEV_API_TARGET=http://localhost:1997 npm run dev
const apiTarget = process.env.VITE_DEV_API_TARGET ?? "http://localhost:1997";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		host: true,
		proxy: {
			"/api": { target: apiTarget, changeOrigin: true },
		},
	},
	build: {
		outDir: "dist",
		sourcemap: true,
		chunkSizeWarningLimit: 1500,
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		css: false,
		passWithNoTests: true,
	},
});
