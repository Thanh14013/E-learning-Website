import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  completeTeacherProfile,
  changePassword,
} from "../controllers/user.controller.js";
import upload, { uploadCV } from "../middleware/upload.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users/profile - get user profile
router.get("/profile", authenticate, getUserProfile);

// PUT /api/users/profile - update user profile
router.put("/profile", authenticate, updateUserProfile);

// PUT /api/users/change-password - change password
router.put("/change-password", authenticate, changePassword);

// POST /api/users/avatar - upload avatar
router.post("/avatar", authenticate, upload.single("avatar"), uploadAvatar);

// POST /api/users/complete-teacher-profile - Complete teacher profile with CV
router.post(
  "/complete-teacher-profile",
  authenticate,
  uploadCV.single("cv"),
  completeTeacherProfile
);
export default router;
