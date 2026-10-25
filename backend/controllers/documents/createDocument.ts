import type { Request, Response } from "express";
import Customer from "../../models/customerModel.js";
import Document from "../../models/documentModel.js";
import { bizMetrics } from "../../observability/metrics.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Create Document
// $-path    POST /api/v1/document/create
// $-auth    Private
const createDocument = async (req: Request, res: Response) => {
	const owner = authUser(req)._id;

	const customer = await Customer.findOne({ createdBy: owner });
	if (!customer) {
		res.status(404);
		throw new Error("That customer does not exist for the currently logged in user");
	}

	const { createdBy, ...fieldsToCreate } = req.body;
	const newDocument = await new Document({ createdBy: owner, ...fieldsToCreate }).save();

	const labels = { type: newDocument.documentType ?? "Invoice", currency: newDocument.currency || "n/a" };
	bizMetrics.documentsCreated.add(1, { type: labels.type });
	bizMetrics.documentValue.add(Number(newDocument.total) || 0, labels);

	res.status(200).json({ success: true, newDocument });
};

export default createDocument;
