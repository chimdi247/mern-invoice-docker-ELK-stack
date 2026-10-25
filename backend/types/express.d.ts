export {};

declare global {
	namespace Express {
		interface Request {
			/** roles decoded from the access token (set by checkAuth) */
			roles?: string[];
		}
	}
}
