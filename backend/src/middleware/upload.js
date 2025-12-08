import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Storage Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Validate file type & size
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/jpg"];

        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only JPG, JPEG, and PNG files are allowed."));
        }

        cb(null, true);
    },
});

export const uploadVideo = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: (req, file, cb) => {
        const allowed = ["video/mp4", "video/avi", "video/quicktime"]; // mov = quicktime
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only MP4, AVI, MOV videos are allowed."));
        }
        cb(null, true);
    },
});

export const uploadResource = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ];

        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Invalid file type for resource."));
        }

        cb(null, true);
    },
});

export default upload;
