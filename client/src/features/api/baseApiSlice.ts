import {
	createApi,
	fetchBaseQuery,
	type BaseQueryFn,
	type FetchArgs,
	type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../app/store";
import type { LoginResponse } from "../../types";
import { logIn, logOut } from "../auth/authSlice";

// Same-origin by default: nginx (docker) and the vite dev server proxy /api to the backend.
const baseQuery = fetchBaseQuery({
	baseUrl: import.meta.env.VITE_API_URL ?? "/api/v1",
	credentials: "include",
	prepareHeaders: (headers, { getState }) => {
		const { auth } = getState() as RootState;
		const token = auth.user?.accessToken ?? auth.googleToken;
		if (token) {
			headers.set("authorization", `Bearer ${token}`);
		}
		return headers;
	},
});

/** `res.sendStatus(403)` has a text body, so RTK reports it as PARSING_ERROR with originalStatus 403. */
const isForbidden = (error: FetchBaseQueryError | undefined): boolean =>
	!!error && (error.status === 403 || (error as { originalStatus?: number }).originalStatus === 403);

/** On 403 (expired access token) silently rotate the refresh-token cookie and retry once. */
const baseQueryWithRefreshToken: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
	args,
	api,
	extraOptions
) => {
	let response = await baseQuery(args, api, extraOptions);

	if (isForbidden(response.error)) {
		const refreshResponse = await baseQuery("/auth/new_access_token", api, extraOptions);

		if (refreshResponse.data) {
			api.dispatch(logIn({ ...(refreshResponse.data as LoginResponse) }));
			response = await baseQuery(args, api, extraOptions);
		} else {
			api.dispatch(logOut());
		}
	}

	return response;
};

export const baseApiSlice = createApi({
	reducerPath: "api",
	baseQuery: baseQueryWithRefreshToken,
	tagTypes: ["User", "Customer", "Document"],
	endpoints: () => ({}),
});
