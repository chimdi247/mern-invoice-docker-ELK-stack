import type { Customer, CustomerResponse, CustomersResponse, MessageResponse } from "../../types";
import { baseApiSlice } from "../api/baseApiSlice";

export type CustomerInput = Partial<Omit<Customer, "_id" | "createdBy" | "accountNo" | "createdAt" | "updatedAt">>;

export const customersApiSlice = baseApiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getAllUserCustomers: builder.query<CustomersResponse, number | void>({
			query: (page = 1) => `/customer/all?page=${page}`,
			providesTags: ["Customer"],
		}),
		createCustomer: builder.mutation<MessageResponse & { createdCustomer: Customer }, CustomerInput>({
			query: (customerInfo) => ({ url: "/customer/create", method: "POST", body: customerInfo }),
			invalidatesTags: ["Customer"],
		}),
		getSingleCustomer: builder.query<CustomerResponse, string>({
			query: (custId) => `/customer/${custId}`,
			providesTags: ["Customer"],
		}),
		updateCustomerInfo: builder.mutation<
			MessageResponse & { updatedCustomerInfo: Customer },
			CustomerInput & { id: string }
		>({
			query: ({ id, ...otherFields }) => ({ url: `/customer/${id}`, method: "PATCH", body: otherFields }),
			invalidatesTags: ["Customer"],
		}),
		deleteCustomer: builder.mutation<MessageResponse, string>({
			query: (id) => ({ url: `/customer/${id}`, method: "DELETE" }),
			invalidatesTags: ["Customer"],
		}),
	}),
});

export const {
	useGetAllUserCustomersQuery,
	useGetSingleCustomerQuery,
	useCreateCustomerMutation,
	useUpdateCustomerInfoMutation,
	useDeleteCustomerMutation,
} = customersApiSlice;
