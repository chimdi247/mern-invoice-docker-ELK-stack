import mongoose from "mongoose";

const { Schema } = mongoose;

// Documents expire automatically after 15 minutes (TTL index on createdAt).
const verifyResetTokenSchema = new Schema({
	_userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
	token: { type: String, required: true },
	createdAt: { type: Date, required: true, default: Date.now, expires: 900 },
});

const VerifyResetToken = mongoose.model("VerifyResetToken", verifyResetTokenSchema);

export default VerifyResetToken;
