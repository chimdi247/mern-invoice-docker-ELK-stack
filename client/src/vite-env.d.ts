/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base URL of the API. Defaults to the same-origin "/api/v1" (nginx / vite proxy). */
	readonly VITE_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare module "*.svg" {
	const src: string;
	export default src;
}
