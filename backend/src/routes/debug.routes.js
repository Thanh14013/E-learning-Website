// Debug routes removed — email verification and test email endpoints disabled
import express from "express";
const router = express.Router();
router.get("/", (req, res) => res.status(404).json({ message: "Not found" }));
export default router;
