import type { Request, Response } from "express";
import User from "../../models/userModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Delete My Account
// $-path    DELETE /api/v1/user/profile
// $-auth    Private
const deleteMyAccount = async (req: Request, res: Response) => {
	await User.findByIdAndDelete(authUser(req)._id);
	res.json({ success: true, message: "Your user account has been deleted" });
};

export default deleteMyAccount;
