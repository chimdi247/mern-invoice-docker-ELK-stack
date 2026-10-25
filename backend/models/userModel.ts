import bcrypt from "bcryptjs";
import mongoose, { type HydratedDocument, type Model } from "mongoose";
import validator from "validator";
import { USER } from "../constants/index.js";

const { Schema } = mongoose;

export interface IUser {
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	password?: string;
	passwordConfirm?: string;
	isEmailVerified: boolean;
	provider: string;
	googleID?: string;
	avatar?: string;
	businessName?: string;
	phoneNumber: string;
	address?: string;
	city?: string;
	country?: string;
	passwordChangedAt?: Date;
	roles: string[];
	active: boolean;
	refreshToken: string[];
}

interface IUserMethods {
	comparePassword(givenPassword: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
	{
		email: {
			type: String,
			lowercase: true,
			unique: true,
			required: true,
			validate: [validator.isEmail, "Please provide a valid email"],
		},
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			validate: {
				validator: (value: string) => /^[A-Za-z][A-Za-z0-9\-_]{3,23}$/.test(value),
				message:
					"username must be alphanumeric,without special characters.Hyphens and underscores allowed",
			},
		},
		firstName: {
			type: String,
			required: true,
			trim: true,
			validate: [
				validator.isAlphanumeric,
				"First Name can only have Alphanumeric values. No special characters allowed",
			],
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
			validate: [
				validator.isAlphanumeric,
				"Last Name can only have Alphanumeric values. No special characters allowed",
			],
		},
		password: {
			type: String,
			select: false,
			validate: [
				validator.isStrongPassword,
				"Password must be at least 8 characters long, with at least 1 uppercase and lowercase letters and at least 1 symbol",
			],
		},
		passwordConfirm: {
			type: String,
			validate: {
				validator: function (this: IUser, value: string) {
					return value === this.password;
				},
				message: "Passwords do not match",
			},
		},
		isEmailVerified: { type: Boolean, required: true, default: false },
		provider: { type: String, required: true, default: "email" },
		googleID: String,
		avatar: String,
		businessName: String,
		phoneNumber: {
			type: String,
			default: "+254123456789",
			validate: [
				validator.isMobilePhone,
				"Your mobile phone number must begin with a '+', followed by your  country code then actual number e.g +254123456789",
			],
		},
		address: String,
		city: String,
		country: String,
		passwordChangedAt: Date,
		roles: { type: [String], default: [USER] },
		active: { type: Boolean, default: true },
		refreshToken: [String],
	},
	{ timestamps: true }
);

// Hooks are plain async functions: no `next` callback (removed in Mongoose 9).
userSchema.pre("save", async function () {
	if (this.roles.length === 0) {
		this.roles.push(USER);
	}
});

userSchema.pre("save", async function () {
	if (!this.isModified("password") || !this.password) return;

	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	this.passwordConfirm = undefined;

	if (!this.isNew) {
		this.passwordChangedAt = new Date();
	}
});

userSchema.method("comparePassword", async function (this: IUser, givenPassword: string) {
	return bcrypt.compare(givenPassword, this.password ?? "");
});

const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;
