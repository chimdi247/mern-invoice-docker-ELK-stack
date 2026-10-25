export type Role = "User" | "Admin";
export type DocumentKind = "Invoice" | "Receipt" | "Quotation";
export type DocumentStatus = "Paid" | "Not Fully Paid" | "Not Paid";
export type PaymentMethod = "Cash" | "Mobile Money" | "PayPal" | "Credit Card" | "Bank Transfer" | "Others";

/** What the session slice keeps: the login response, or the decoded Google JWT. */
export interface SessionUser {
	id?: string;
	roles?: Role[];
	firstName?: string;
	lastName?: string;
	username?: string;
	provider?: string;
	avatar?: string;
	accessToken?: string;
}

export interface LoginResponse extends SessionUser {
	success: boolean;
	accessToken: string;
}

export interface MessageResponse {
	success: boolean;
	message: string;
}

export interface UserProfile {
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	businessName?: string;
	address?: string;
	city?: string;
	country?: string;
	avatar?: string;
	provider: string;
	isEmailVerified: boolean;
	active: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface UserAccount extends UserProfile {
	_id: string;
	roles: Role[];
}

export interface Customer {
	_id: string;
	createdBy: string;
	name: string;
	email: string;
	accountNo: string;
	vatTinNo: number;
	address?: string;
	city?: string;
	country?: string;
	phoneNumber: string;
	createdAt: string;
	updatedAt: string;
}

export interface BillingItem {
	itemName: string;
	unitPrice: number | string;
	quantity: number | string;
	discount: number | string;
}

export interface PaymentRecord {
	_id: string;
	paidBy: string;
	datePaid: string;
	amountPaid: number;
	paymentMethod: PaymentMethod;
	additionalInfo?: string;
	createdAt: string;
}

export interface DocumentCustomer {
	name: string;
	email: string;
	accountNo?: string;
	vatTinNo?: string | number;
	address?: string;
	city?: string;
	country?: string;
	phoneNumber?: string;
}

export interface InvoiceDocument {
	_id: string;
	createdBy: string;
	customer: DocumentCustomer;
	documentType: DocumentKind;
	documentNumber: string;
	dueDate: string;
	additionalInfo?: string;
	termsConditions?: string;
	status: DocumentStatus;
	subTotal: number;
	salesTax: number;
	rates: string | number;
	total: number;
	currency: string;
	totalAmountReceived?: number;
	billingItems: BillingItem[];
	paymentRecords: PaymentRecord[];
	createdAt: string;
	updatedAt: string;
}

export interface Currency {
	name: string;
	code: string;
	symbol?: string;
	[key: string]: unknown;
}

// ----- API payloads -----
export interface UsersResponse {
	success: boolean;
	count: number;
	numberOfPages: number;
	users: UserAccount[];
}
export interface ProfileResponse {
	success: boolean;
	userProfile: UserProfile;
}
export interface CustomersResponse {
	success: boolean;
	totalCustomers: number;
	numberOfPages: number;
	myCustomers: Customer[];
}
export interface CustomerResponse {
	success: boolean;
	customer: Customer;
}
export interface DocumentsResponse {
	success: boolean;
	totalDocuments: number;
	numberOfPages: number;
	myDocuments: InvoiceDocument[];
}
export interface DocumentResponse {
	success: boolean;
	document: InvoiceDocument;
}
