import type { Request, Response } from "express";
import User from "../../models/userModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Get User Profile
// $-path    GET /api/v1/user/profile
// $-auth    Private
const getUserProfile = async (req: Request, res: Response) => {
	const userProfile = await User.findById(authUser(req)._id, { refreshToken: 0, roles: 0, _id: 0 }).lean();

	if (!userProfile) {
		res.status(404);
		throw new Error("user profile not found");
	}

	res.status(200).json({ success: true, userProfile });
};

export default getUserProfile;
