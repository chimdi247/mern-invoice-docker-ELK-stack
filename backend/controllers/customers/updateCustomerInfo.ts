import type { Request, Response } from "express";
import Customer from "../../models/customerModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Update Customer
// $-path    PATCH /api/v1/customer/:id
// $-auth    Private
const updateCustomerInfo = async (req: Request, res: Response) => {
	const customer = await Customer.findById(req.params.id);

	if (!customer) {
		res.status(404);
		throw new Error("That Customer does not exist");
	}

	if (customer.createdBy.toString() !== authUser(req).id) {
		res.status(401);
		throw new Error("You are not authorized to update this customer's information. He/She is not your customer");
	}

	// ownership / generated fields cannot be changed through this route
	const { createdBy, accountNo, _id, ...fieldsToUpdate } = req.body;

	const updatedCustomerInfo = await Customer.findByIdAndUpdate(
		req.params.id,
		{ ...fieldsToUpdate },
		{ new: true, runValidators: true }
	);

	res.status(200).json({
		success: true,
		message: `${customer.name}'s info was successfully updated`,
		updatedCustomerInfo,
	});
};

export default updateCustomerInfo;
