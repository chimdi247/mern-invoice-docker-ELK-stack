export interface PdfProfile {
	firstName?: string;
	businessName?: string;
	avatar?: string;
	email?: string;
	phoneNumber?: string;
	address?: string;
	city?: string;
	country?: string;
}

export interface PdfBillingItem {
	itemName: string;
	unitPrice: number;
	quantity: number;
	discount: number;
}

export interface PdfDocument {
	documentType: string;
	documentNumber: string;
	currency: string;
	total: number;
	subTotal: number;
	salesTax: number;
	rates: string | number;
	dueDate: string;
	createdAt: string;
	termsConditions?: string;
	additionalInfo?: string;
	customer: {
		name: string;
		email: string;
		accountNo?: string;
		vatTinNo?: string | number;
		address?: string;
		city?: string;
		country?: string;
		phoneNumber?: string;
	};
	billingItems: PdfBillingItem[];
}

export interface PdfPayload {
	profile: PdfProfile;
	document: PdfDocument;
	balanceDue?: number;
	status?: string;
	totalAmountReceived: number;
}
