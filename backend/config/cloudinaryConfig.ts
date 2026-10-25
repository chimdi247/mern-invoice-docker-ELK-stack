import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";

cloudinary.config({
	cloud_name: env.cloudinary.cloudName,
	api_key: env.cloudinary.apiKey,
	api_secret: env.cloudinary.apiSecret,
});

export interface UploadResult {
	message: "Success" | "Fail";
	url?: string;
}

const cloudinaryUploader = async (localFilePath: string): Promise<UploadResult> => {
	try {
		const result = await cloudinary.uploader.upload(localFilePath, {
			public_id: `merninvoice/${path.parse(localFilePath).name}`,
		});
		return { message: "Success", url: result.secure_url };
	} catch (error) {
		console.error("cloudinary_upload_failed:", error);
		return { message: "Fail" };
	} finally {
		fs.rmSync(localFilePath, { force: true });
	}
};

export default cloudinaryUploader;
