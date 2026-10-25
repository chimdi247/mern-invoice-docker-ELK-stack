import type { Request, Response } from "express";
import User from "../../models/userModel.js";

// $-title   Deactivate user account
// $-path    PATCH /api/v1/user/:id/deactivate
// $-auth    Private/Admin
const deactivateUser = async (req: Request, res: Response) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		res.status(404);
		throw new Error("user was not found");
	}

	user.active = false;
	const updatedUser = await user.save();
	res.json(updatedUser);
};

export default deactivateUser;
