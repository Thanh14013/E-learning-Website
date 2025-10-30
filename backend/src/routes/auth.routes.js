import express from "express";
import {
  register,
  verifyEmail,
  refreshAccessToken,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email/:token", verifyEmail);
router.post("/refresh-token", refreshAccessToken);

export default router;
