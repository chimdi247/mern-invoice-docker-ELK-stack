import type { Request, Response } from "express";
import Customer from "../../models/customerModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Get a Single customer belonging to a User
// $-path    GET /api/v1/customer/:id
// $-auth    Private
const getSingleUserCustomer = async (req: Request, res: Response) => {
	const customer = await Customer.findById(req.params.id);

	if (!customer) {
		res.status(404);
		throw new Error("Customer not found");
	}

	// (the original compared the customer id with the user id, so any customer was readable by anyone)
	if (customer.createdBy.toString() !== authUser(req).id) {
		res.status(401);
		throw new Error("You are not authorized to view this customer's information. He/She is not your customer");
	}

	res.status(200).json({ success: true, customer });
};

export default getSingleUserCustomer;
