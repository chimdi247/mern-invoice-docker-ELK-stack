import type { Request, Response } from "express";
import User from "../../models/userModel.js";

// $-title   Delete User Account
// $-path    DELETE /api/v1/user/:id
// $-auth    Private/Admin
// an admin user can delete any other user account
const deleteUserAccount = async (req: Request, res: Response) => {
	const user = await User.findById(req.params.id);

	if (!user) {
		res.status(404);
		throw new Error("user not found");
	}

	await user.deleteOne(); // doc.remove() no longer exists in Mongoose >= 7
	res.json({ success: true, message: `User ${user.firstName} deleted successfully` });
};

export default deleteUserAccount;
