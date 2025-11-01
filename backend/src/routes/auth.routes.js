import express from "express";
import {
    register,
    verifyEmail,
    refreshAccessToken, forgotPassword,
} from "../controllers/auth.controller.js";
import {
  registerLimiter,
  emailVerificationLimiter,
} from "../middleware/rateLimiter.js";
import {
  validateRegister,
  validateToken,
  validateRefreshToken,
} from "../middleware/validator.js";

const router = express.Router();

// POST /api/auth/register - Register new user with validation and rate limiting
router.post("/register", registerLimiter, validateRegister, register);

// POST /api/auth/verify-email/:token - Verify email with token validation and rate limiting
router.post(
  "/verify-email/:token",
  emailVerificationLimiter,
  validateToken,
  verifyEmail
);

// POST /api/auth/refresh-token - Refresh access token with validation
router.post("/refresh-token", validateRefreshToken, refreshAccessToken);

// POST /api/auth/forgot-password - Generate password reset token
router.post("forgot-password", forgotPassword);

export default router;
