import type { Request, Response } from "express";
import Document from "../../models/documentModel.js";
import { bizMetrics } from "../../observability/metrics.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Create new payment
// $-path    POST /api/v1/document/:id/payment
// $-auth    Private
const createDocumentPayment = async (req: Request, res: Response) => {
	const document = await Document.findById(req.params.id);

	if (!document) {
		res.status(404);
		throw new Error("That document does not exist");
	}
	if (document.createdBy.toString() !== authUser(req).id) {
		res.status(401);
		throw new Error("You are not authorized to record payments on this document. It's not yours");
	}

	const { datePaid, amountPaid, paymentMethod, additionalInfo } = req.body;

	document.paymentRecords.push({
		paidBy: document.customer?.name,
		datePaid,
		amountPaid,
		paymentMethod,
		additionalInfo,
	});
	await document.save();

	bizMetrics.paymentsRecorded.add(1, { method: paymentMethod ?? "Cash" });
	bizMetrics.paymentsAmount.add(Number(amountPaid) || 0, { currency: document.currency || "n/a" });

	res.status(201).json({ success: true, message: "Payment has been recorded successfully" });
};

export default createDocumentPayment;
