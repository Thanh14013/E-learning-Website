import { v2 as cloudinary } from "cloudinary";

import dotenv from "dotenv";

dotenv.config();

// Function to upload a file to Cloudinary
const uploadFile = async (filePath, options = {}) => {
  try {
    const uploadOptions = {
      resource_type: "auto",
      ...(typeof options === "string" ? { folder: options } : options),
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    return result; // contains secure_url, public_id, duration (for videos), etc.
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("File upload failed");
  }
};

const deleteFile = async (publicId, options = {}) => {
  try {
    await cloudinary.uploader.destroy(publicId, options);
  } catch (error) {
    console.warn("Cloudinary delete failed:", error.message);
  }
};

// Function to connect and configure Cloudinary
// This will configure the SDK and make a lightweight API call to verify credentials.
const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    // Make a minimal authenticated request to verify credentials.
    // Listing resources with max_results=1 is lightweight and will fail if credentials are invalid.
    await cloudinary.api.resources({ max_results: 1 });
    console.log("Cloudinary configured and authenticated successfully");
  } catch (error) {
    console.error(
      "Cloudinary configuration/authentication failed:",
      error.message || error
    );
    // Re-throw so callers (startup) can handle exit or retry logic
    throw error;
  }
};

export { uploadFile, connectCloudinary, deleteFile };
