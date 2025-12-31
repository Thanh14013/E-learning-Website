import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createReport } from "../controllers/report.controller.js";

const router = express.Router();

// Users can submit a report for discussions/comments/courses
router.post("/", authenticate, createReport);

export default router;
