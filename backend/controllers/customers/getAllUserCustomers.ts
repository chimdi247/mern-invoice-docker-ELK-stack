import type { Request, Response } from "express";
import Customer from "../../models/customerModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Get all customers belonging to a specific User
// $-path    GET /api/v1/customer/all
// $-auth    Private
const getAllUserCustomers = async (req: Request, res: Response) => {
	const pageSize = 10;
	const page = Number(req.query.page) || 1;
	const owner = authUser(req)._id;

	const count = await Customer.countDocuments({ createdBy: owner });
	const customers = await Customer.find({ createdBy: owner })
		.sort({ createdAt: -1 })
		.limit(pageSize)
		.skip(pageSize * (page - 1))
		.lean();

	res.json({
		success: true,
		totalCustomers: count,
		numberOfPages: Math.ceil(count / pageSize),
		myCustomers: customers,
	});
};

export default getAllUserCustomers;
