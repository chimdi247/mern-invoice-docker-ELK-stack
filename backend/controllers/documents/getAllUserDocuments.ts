import type { Request, Response } from "express";
import Document from "../../models/documentModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Get all documents belonging to a specific User
// $-path    GET /api/v1/document/all
// $-auth    Private
const getAllUserDocuments = async (req: Request, res: Response) => {
	const pageSize = 10;
	const page = Number(req.query.page) || 1;
	const owner = authUser(req)._id;

	const count = await Document.countDocuments({ createdBy: owner });
	const documents = await Document.find({ createdBy: owner })
		.sort({ createdAt: -1 })
		.limit(pageSize)
		.skip(pageSize * (page - 1))
		.lean();

	res.json({
		success: true,
		totalDocuments: count,
		numberOfPages: Math.ceil(count / pageSize),
		myDocuments: documents,
	});
};

export default getAllUserDocuments;
