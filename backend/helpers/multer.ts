import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const UPLOAD_DIR = "./uploads";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
	filename: (_req, file, cb) => {
		// never trust the client file name; keep only the extension
		cb(null, `logo-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const allowed = /jpeg|jpg|png/;
		const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
		const mimeOk = allowed.test(file.mimetype);
		if (extOk && mimeOk) {
			cb(null, true);
		} else {
			cb(new Error("Unsupported file format. You can only upload jpeg, jpg and png"));
		}
	},
});

export default upload;
