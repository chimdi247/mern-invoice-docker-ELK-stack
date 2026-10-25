import type { Request, Response } from "express";
import Document from "../../models/documentModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Delete Document
// $-path    DELETE /api/v1/document/:id
// $-auth    Private
const deleteDocument = async (req: Request, res: Response) => {
	const document = await Document.findById(req.params.id);

	if (!document) {
		res.status(404);
		throw new Error("That document does not exist!");
	}

	if (document.createdBy.toString() !== authUser(req).id) {
		res.status(401);
		throw new Error("You are not authorized to delete this document. It's not yours");
	}

	await document.deleteOne(); // doc.delete() was removed in Mongoose 7
	res.json({ success: true, message: "Your document has been deleted" });
};

export default deleteDocument;
