import express from "express";
import upload from "../config/multer.config.js";
import { uploadFile } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// POST /api/upload
router.post("/", upload.single("file"), uploadFile);

export default router;
