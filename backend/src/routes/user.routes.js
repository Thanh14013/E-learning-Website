import express from "express";
import {
  deleteUser,
  getUserList,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  updateUserRole,
  banUser,
  completeTeacherProfile,
} from "../controllers/user.controller.js";
import upload from "../middleware/upload.js";
import { isAdmin } from "../middleware/authorize.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users/profile - get user profile
router.get("/profile", authenticate, getUserProfile);

// PUT /api/users/profile - update user profile
router.put("/profile", authenticate, updateUserProfile);

// POST /api/users/avatar - upload avatar
router.post("/avatar", authenticate, upload.single("avatar"), uploadAvatar);

// POST /api/users/complete-teacher-profile - Complete teacher profile with CV
router.post(
  "/complete-teacher-profile",
  authenticate,
  upload.single("cv"),
  completeTeacherProfile
);

// GET /api/users/list - Admin: Get user list
router.get("/list", authenticate, isAdmin, getUserList);

// PUT /api/users/:id/role - Admin: Update user role
router.put("/:id/role", authenticate, isAdmin, updateUserRole);

// PUT /api/users/:id/ban - Admin: Ban/unban user
router.put("/:id/ban", authenticate, isAdmin, banUser);

// DELETE /api/users/:id - Admin: Delete user
router.delete("/:id", authenticate, isAdmin, deleteUser);
// POST /api/users/complete-teacher-profile - Teacher: Complete profile with CV
router.post(
  "/complete-teacher-profile",
  authenticate,
  upload.single("cv"),
  completeTeacherProfile
);
export default router;
