import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { decodeToken } from "react-jwt";
import type { RootState } from "../../app/store";
import type { SessionUser } from "../../types";

interface AuthState {
	user: SessionUser | null;
	googleToken: string | null;
}

const readStoredUser = (): SessionUser | null => {
	try {
		return JSON.parse(localStorage.getItem("user") ?? "null") as SessionUser | null;
	} catch {
		return null;
	}
};

const googleToken = localStorage.getItem("googleToken");
const decodedGoogleToken = googleToken ? decodeToken<SessionUser>(googleToken) : null;

const initialState: AuthState = {
	user: readStoredUser() ?? decodedGoogleToken,
	googleToken: googleToken ?? null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logIn: (state, action: PayloadAction<SessionUser>) => {
			state.user = action.payload;
			localStorage.setItem("user", JSON.stringify(action.payload));
		},
		logOut: (state) => {
			state.user = null;
			state.googleToken = null;
			localStorage.removeItem("user");
			localStorage.removeItem("googleToken");
		},
	},
});

export const { logIn, logOut } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUserToken = (state: RootState) => state.auth.user?.accessToken;
export const selectCurrentUserGoogleToken = (state: RootState) => state.auth.googleToken;
