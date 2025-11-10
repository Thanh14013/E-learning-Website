import express from "express";
import {
    deleteUser,
    getUserList,
    getUserProfile,
    updateUserProfile,
    uploadAvatar
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

// GET /api/users/list - Admin: Get user list
router.get("/list", authenticate, isAdmin, getUserList);

// DELETE /api/users/:id - Admin: Delete user
router.delete("/:id", authenticate, isAdmin, deleteUser);

export default router;
