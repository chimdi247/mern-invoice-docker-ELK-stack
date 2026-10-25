import express from "express";
import createDocument from "../controllers/documents/createDocument.js";
import createDocumentPayment from "../controllers/documents/createPayment.js";
import deleteDocument from "../controllers/documents/deleteDocument.js";
import { generatePDF, sendDocument } from "../controllers/documents/generatePDF.js";
import getAllUserDocuments from "../controllers/documents/getAllUserDocuments.js";
import getSingleUserDocument from "../controllers/documents/getSingleUserDocument.js";
import updateDocument from "../controllers/documents/updateDocument.js";
import checkAuth from "../middleware/checkAuthMiddleware.js";

const router = express.Router();

router.route("/create").post(checkAuth, createDocument);
router.route("/all").get(checkAuth, getAllUserDocuments);

// static paths MUST be declared before "/:id", otherwise "/:id" swallows them
router.route("/generate-pdf").post(checkAuth, generatePDF);
router.route("/send-pdf").post(checkAuth, sendDocument);

router.route("/:id/payment").post(checkAuth, createDocumentPayment);
router
	.route("/:id")
	.patch(checkAuth, updateDocument)
	.get(checkAuth, getSingleUserDocument)
	.delete(checkAuth, deleteDocument);

export default router;
