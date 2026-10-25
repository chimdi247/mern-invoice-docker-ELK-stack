import type { BillingItem, InvoiceDocument } from "../../../types";

/** Fields of the document form that live in one state object (the rest have their own useState). */
export type DocFormState = Partial<InvoiceDocument>;

export const docInitialState: DocFormState = {
	status: "Not Paid",
	additionalInfo: "",
	termsConditions: "",
	total: 0,
	salesTax: 0,
	rates: "",
	currency: "",
};

export const itemsInitialState: BillingItem[] = [
	{
		itemName: "",
		unitPrice: "",
		quantity: "",
		discount: "",
	},
];
