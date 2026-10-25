import type { Request, Response } from "express";
import Customer from "../../models/customerModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Delete Customer
// $-path    DELETE /api/v1/customer/:id
// $-auth    Private
const deleteCustomer = async (req: Request, res: Response) => {
	const customer = await Customer.findById(req.params.id);

	if (!customer) {
		res.status(404);
		throw new Error("That customer does not exist!");
	}

	if (customer.createdBy.toString() !== authUser(req).id) {
		res.status(401);
		throw new Error("You are not authorized to delete this customer's information. He/She is not your customer!");
	}

	await customer.deleteOne(); // doc.delete() was removed in Mongoose 7
	res.json({ success: true, message: "Your customer has been deleted" });
};

export default deleteCustomer;
