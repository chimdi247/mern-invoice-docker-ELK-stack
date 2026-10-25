import { randomBytes } from "node:crypto";
import mongoose, { type InferSchemaType } from "mongoose";
import validator from "validator";

const { Schema } = mongoose;

const customerSchema = new Schema(
	{
		createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
		name: { type: String, required: true, trim: true },
		email: {
			type: String,
			required: true,
			lowercase: true,
			unique: true,
			validate: [validator.isEmail, "A customer must have a valid email address"],
		},
		accountNo: String,
		vatTinNo: { type: Number, default: 0 },
		address: String,
		city: String,
		country: String,
		phoneNumber: {
			type: String,
			required: true,
			validate: [
				validator.isMobilePhone,
				"Your mobile phone number must begin with a '+', followed by your country code then actual number e.g +254123456789",
			],
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// The account number is generated once, when the customer is created (it used to change on every save).
customerSchema.pre("save", async function () {
	if (this.isNew) {
		this.accountNo = `CUS-${randomBytes(3).toString("hex").toUpperCase()}`;
	}
});

export type ICustomer = InferSchemaType<typeof customerSchema>;

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
