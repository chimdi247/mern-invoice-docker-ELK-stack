import type { Request, Response } from "express";
import Document from "../../models/documentModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Update Document
// $-path    PATCH /api/v1/document/:id
// $-auth    Private
const updateDocument = async (req: Request, res: Response) => {
	const document = await Document.findById(req.params.id);

	if (!document) {
		res.status(404);
		throw new Error("That document does not exist");
	}

	if (document.createdBy.toString() !== authUser(req).id) {
		res.status(401);
		throw new Error("You are not authorized to update this document. It's not yours");
	}

	const { createdBy, documentNumber, _id, ...fieldsToUpdate } = req.body;

	const updatedDocument = await Document.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		success: true,
		message: `Your ${updatedDocument?.documentType}'s info was updated successfully`,
		updatedDocument,
	});
};

export default updateDocument;
