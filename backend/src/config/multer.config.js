import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "elearning/chat_uploads", // Folder in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "gif"], // Allowed file types
    resource_type: "auto", // Auto-detect type
  },
});

const upload = multer({ storage: storage });

export default upload;
