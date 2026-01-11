import express from "express";
import {
  register,
  refreshAccessToken,
  login,
  loginWithGoogle,
  logout,
} from "../controllers/auth.controller.js";
import { registerLimiter } from "../middleware/rateLimiter.js";
import { uploadCV } from "../middleware/upload.js";
import {
  validateRegister,
  validateRefreshToken,
  validateGoogleLogin,
} from "../middleware/validator.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// POST /api/auth/register - Register new user with validation and rate limiting
router.post("/register", registerLimiter, uploadCV.single("cv"), validateRegister, register);

// POST /api/auth/refresh-token - Refresh access token with validation
router.post("/refresh-token", validateRefreshToken, refreshAccessToken);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/google - Login/Register via Google SSO
router.post("/google", validateGoogleLogin, loginWithGoogle);

// POST /api/auth/logout
router.post("/logout", authenticate, logout);

// NOTE: email verification/resend/password-reset endpoints removed as requested

export default router;
