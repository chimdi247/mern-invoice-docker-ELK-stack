import axios from "axios";
import { store } from "../app/store";

/** Axios instance for the few calls that are not RTK Query endpoints (file upload, PDF e-mail). */
export const http = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
	withCredentials: true,
});

http.interceptors.request.use((config) => {
	const { user, googleToken } = store.getState().auth;
	const token = user?.accessToken ?? googleToken;
	if (token) config.headers.set("Authorization", `Bearer ${token}`);
	return config;
});
