import express from "express";
import cloudinaryUploader from "../config/cloudinaryConfig.js";
import upload from "../helpers/multer.js";
import checkAuth from "../middleware/checkAuthMiddleware.js";

const router = express.Router();

// $-title   Upload a logo / avatar to Cloudinary     PATCH /api/v1/upload   (Private)
router.route("/").patch(checkAuth, upload.single("logo"), async (req, res) => {
	if (!req.file) {
		res.status(400);
		throw new Error("A file named 'logo' is required");
	}
	const result = await cloudinaryUploader(req.file.path);
	if (result.message !== "Success") {
		res.status(502);
		throw new Error("The image could not be uploaded");
	}
	res.send(result.url);
});

export default router;
