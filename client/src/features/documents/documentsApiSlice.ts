import type { DocumentResponse, DocumentsResponse, InvoiceDocument, MessageResponse, PaymentRecord } from "../../types";
import { baseApiSlice } from "../api/baseApiSlice";

export type DocumentInput = Partial<Omit<InvoiceDocument, "_id" | "createdBy" | "documentNumber" | "createdAt" | "updatedAt">>;

export interface PaymentInput {
	id: string;
	datePaid: string;
	amountPaid: number;
	paymentMethod: PaymentRecord["paymentMethod"] | "";
	additionalInfo?: string;
	paidBy?: string;
}

export const documentsApiSlice = baseApiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getAllMyDocs: builder.query<DocumentsResponse, number | void>({
			query: (page = 1) => `/document/all?page=${page}`,
			providesTags: ["Document"],
		}),
		getSingleDoc: builder.query<DocumentResponse, string>({
			query: (id) => `/document/${id}`,
			providesTags: ["Document"],
		}),
		createDoc: builder.mutation<{ success: boolean; newDocument: InvoiceDocument }, DocumentInput>({
			query: (formData) => ({ url: "/document/create", method: "POST", body: formData }),
			invalidatesTags: ["Document"],
		}),
		updateDoc: builder.mutation<MessageResponse & { updatedDocument: InvoiceDocument }, DocumentInput & { id: string }>({
			query: ({ id, ...rest }) => ({ url: `/document/${id}`, method: "PATCH", body: rest }),
			invalidatesTags: ["Document"],
		}),
		deleteDoc: builder.mutation<MessageResponse, string>({
			query: (id) => ({ url: `/document/${id}`, method: "DELETE" }),
			invalidatesTags: ["Document"],
		}),
		createPayment: builder.mutation<MessageResponse, PaymentInput>({
			query: ({ id, ...rest }) => ({ url: `/document/${id}/payment`, method: "POST", body: rest }),
			invalidatesTags: ["Document"],
		}),
	}),
});

export const {
	useCreatePaymentMutation,
	useDeleteDocMutation,
	useCreateDocMutation,
	useGetSingleDocQuery,
	useGetAllMyDocsQuery,
	useUpdateDocMutation,
} = documentsApiSlice;
