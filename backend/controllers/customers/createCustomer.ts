import type { Request, Response } from "express";
import Customer from "../../models/customerModel.js";
import { bizMetrics } from "../../observability/metrics.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Create Customer
// $-path    POST /api/v1/customer/create
// $-auth    Private
const createCustomer = async (req: Request, res: Response) => {
	const { email, name, phoneNumber, vatTinNo, address, city, country } = req.body;

	if (!email || !name || !phoneNumber) {
		res.status(400);
		throw new Error("A Customer must have at least a name, email and phone number");
	}

	const customerExists = await Customer.findOne({ email });
	if (customerExists) {
		res.status(400);
		throw new Error("That Customer already exists");
	}

	const createdCustomer = await new Customer({
		createdBy: authUser(req)._id,
		name,
		email,
		phoneNumber,
		vatTinNo,
		address,
		city,
		country,
	}).save();

	bizMetrics.customersCreated.add(1);

	res.status(200).json({
		success: true,
		message: `Your customer named: ${createdCustomer.name}, was created successfully`,
		createdCustomer,
	});
};

export default createCustomer;
