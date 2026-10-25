import type { Request, Response } from "express";
import Document from "../../models/documentModel.js";
import { authUser } from "../../utils/authUser.js";

// $-title   Get a Single Document belonging to a User
// $-path    GET /api/v1/document/:id
// $-auth    Private
const getSingleUserDocument = async (req: Request, res: Response) => {
	const document = await Document.findById(req.params.id);

	if (!document) {
		res.status(404);
		throw new Error("document not found");
	}

	// (the original compared the document id with the user id, so any document was readable by anyone)
	if (document.createdBy.toString() !== authUser(req).id) {
		res.status(401);
		throw new Error("You are not authorized to view this document. It's not yours");
	}

	res.status(200).json({ success: true, document });
};

export default getSingleUserDocument;
