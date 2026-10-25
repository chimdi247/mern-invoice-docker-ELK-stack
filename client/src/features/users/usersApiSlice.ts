import type { MessageResponse, ProfileResponse, UserAccount, UserProfile, UsersResponse } from "../../types";
import { baseApiSlice } from "../api/baseApiSlice";

export const usersApiSlice = baseApiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// the argument is only a cache key (the original passed "allUsersList")
		getAllUsers: builder.query<UsersResponse, string | void>({
			query: () => ({
				url: "/user/all",
				validateStatus: (response, result) => response.status === 200 && !result?.isError,
			}),
			providesTags: (result) =>
				result
					? [
							...result.users.map(({ _id }) => ({ type: "User" as const, id: _id })),
							{ type: "User" as const, id: "LIST" },
						]
					: [{ type: "User" as const, id: "LIST" }],
		}),
		getUserProfile: builder.query<ProfileResponse, void>({
			query: () => "/user/profile",
			providesTags: [{ type: "User", id: "SINGLE_USER" }],
		}),
		updateUserProfile: builder.mutation<
			MessageResponse & { updatedProfile: UserProfile },
			Partial<UserProfile>
		>({
			query: (profileData) => ({ url: "/user/profile", method: "PATCH", body: profileData }),
			invalidatesTags: [{ type: "User", id: "SINGLE_USER" }],
		}),
		deleteMyAccount: builder.mutation<MessageResponse, void>({
			query: () => ({ url: "user/profile", method: "DELETE" }),
			invalidatesTags: [{ type: "User", id: "LIST" }],
		}),
		deleteUser: builder.mutation<MessageResponse, string>({
			query: (id) => ({ url: `/user/${id}`, method: "DELETE" }),
			invalidatesTags: [{ type: "User", id: "LIST" }],
		}),
		deactivateUser: builder.mutation<UserAccount, string>({
			query: (id) => ({ url: `/user/${id}/deactivate`, method: "PATCH" }),
			invalidatesTags: [{ type: "User", id: "LIST" }],
		}),
	}),
});

export const {
	useGetAllUsersQuery,
	useUpdateUserProfileMutation,
	useGetUserProfileQuery,
	useDeleteMyAccountMutation,
	useDeleteUserMutation,
	useDeactivateUserMutation,
} = usersApiSlice;
