import type { LoginResponse, MessageResponse } from "../../types";
import { baseApiSlice } from "../api/baseApiSlice";
import { logOut } from "./authSlice";

export interface RegisterRequest {
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	password: string;
	passwordConfirm: string;
}
export interface LoginRequest {
	email: string;
	password: string;
}
export interface ResetPasswordRequest {
	password: string;
	passwordConfirm: string;
	userId: string;
	emailToken: string;
}

export const authApiSlice = baseApiSlice.injectEndpoints({
	endpoints: (builder) => ({
		registerUser: builder.mutation<MessageResponse, RegisterRequest>({
			query: (userData) => ({ url: "/auth/register", method: "POST", body: userData }),
		}),
		loginUser: builder.mutation<LoginResponse, LoginRequest>({
			query: (credentials) => ({ url: "/auth/login", method: "POST", body: credentials }),
		}),
		logoutUser: builder.mutation<MessageResponse | void, void>({
			query: () => ({ url: "/auth/logout", method: "GET" }),
			async onQueryStarted(_arg, { dispatch }) {
				dispatch(logOut());
				dispatch(baseApiSlice.util.resetApiState());
			},
		}),
		resendVerifyEmail: builder.mutation<MessageResponse, { email: string }>({
			query: (userEmail) => ({ url: "/auth/resend_email_token", method: "POST", body: userEmail }),
		}),
		passwordResetRequest: builder.mutation<MessageResponse, { email: string }>({
			query: (formData) => ({ url: "/auth/reset_password_request", method: "POST", body: formData }),
		}),
		resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
			query: (formData) => ({ url: "/auth/reset_password", method: "POST", body: formData }),
		}),
	}),
});

export const {
	useRegisterUserMutation,
	useLoginUserMutation,
	useLogoutUserMutation,
	useResendVerifyEmailMutation,
	usePasswordResetRequestMutation,
	useResetPasswordMutation,
} = authApiSlice;
