import { randomBytes } from "node:crypto";
import mongoose, { type InferSchemaType } from "mongoose";

const { Schema } = mongoose;

export const PAYMENT_METHODS = [
	"Cash",
	"Mobile Money",
	"PayPal",
	"Credit Card",
	"Bank Transfer",
	"Others",
] as const;

const paymentSchema = new Schema(
	{
		paidBy: String,
		datePaid: String,
		amountPaid: Number,
		paymentMethod: { type: String, default: "Cash", enum: PAYMENT_METHODS },
		additionalInfo: String,
	},
	{ timestamps: true }
);

const documentSchema = new Schema(
	{
		createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
		customer: {
			name: String,
			email: String,
			accountNo: String,
			vatTinNo: String,
			address: String,
			city: String,
			country: String,
			phoneNumber: String,
		},
		documentType: { type: String, default: "Invoice", enum: ["Invoice", "Receipt", "Quotation"] },
		documentNumber: String,
		dueDate: Date,
		additionalInfo: String,
		termsConditions: String,
		status: { type: String, default: "Not Paid", enum: ["Paid", "Not Fully Paid", "Not Paid"] },
		subTotal: Number,
		salesTax: Number,
		rates: String,
		total: Number,
		currency: String,
		totalAmountReceived: Number,
		billingItems: [
			{
				itemName: String,
				unitPrice: Number,
				quantity: Number,
				discount: String,
			},
		],
		paymentRecords: [paymentSchema],
	},
	{ timestamps: true }
);

// The number is generated once, when the document is created (it used to change on every save).
documentSchema.pre("save", async function () {
	if (this.isNew) {
		const now = new Date();
		this.documentNumber = `${now.getFullYear()}-${now.toLocaleString("default", {
			month: "long",
		})}-${randomBytes(3).toString("hex").toUpperCase()}`;
	}
});

export type IDocument = InferSchemaType<typeof documentSchema>;

const Document = mongoose.model("Document", documentSchema);

export default Document;
