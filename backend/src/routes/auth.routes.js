import express from "express";
import {
  register,
  resetPassword,
  refreshAccessToken,
  login,
  logout,
  forgotPassword,
} from "../controllers/auth.controller.js";
import { registerLimiter } from "../middleware/rateLimiter.js";
import {
  validateRegister,
  validateRefreshToken,
} from "../middleware/validator.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register - Register new user with validation and rate limiting
router.post("/register", registerLimiter, validateRegister, register);

// POST /api/auth/refresh-token - Refresh access token with validation
router.post("/refresh-token", validateRefreshToken, refreshAccessToken);

// PUT /api/auth/reset-password/:token - Reset user password using valid token
router.put("/reset-password/:token", resetPassword);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/logout
router.post("/logout", authenticate, logout);

// POST /api/auth/forgot-password - Generate password reset token
router.post("/forgot-password", forgotPassword);

// NOTE: email verification/resend endpoints removed as requested

export default router;
