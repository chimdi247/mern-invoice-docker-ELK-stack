import { decodeToken } from "react-jwt";
import { useAppSelector } from "../app/hooks";
import { selectCurrentUserGoogleToken, selectCurrentUserToken } from "../features/auth/authSlice";
import type { Role } from "../types";

interface TokenPayload {
	roles?: Role[];
}

const rolesFromToken = (token: string): Role[] => decodeToken<TokenPayload>(token)?.roles ?? [];

/** Roles of the logged in user, decoded from the access token (or the Google token). */
const useAuthUser = () => {
	const token = useAppSelector(selectCurrentUserToken);
	const googleToken = useAppSelector(selectCurrentUserGoogleToken);

	const activeToken = token ?? googleToken;
	const roles = activeToken ? rolesFromToken(activeToken) : [];
	const isAdmin = roles.includes("Admin");

	return { roles, isAdmin, accessRight: isAdmin ? "Admin" : "User" };
};

export default useAuthUser;
