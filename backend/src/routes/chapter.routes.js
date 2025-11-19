import express from "express";
import { authenticate } from "../middleware/auth.js";
import { isTeacherOrAdmin } from "../middleware/authorize.js";
import {
    validateCreateChapter,
    validateObjectId,
    validateReorderChapters,
    validateUpdateChapter
} from "../middleware/validator.js";
import { createChapter, deleteChapter, reorderChapters, updateChapter } from "../controllers/chapter.controller.js";

const router = express.Router();

// POST /api/chapters -> Create new chapter (Teacher only)
router.post(
    "/",
    authenticate,
    isTeacherOrAdmin,
    validateCreateChapter,
    createChapter
);

// PUT /api/chapters/:id -> Update chapter title (Teacher only)
router.put(
    "/:id",
    authenticate,
    isTeacherOrAdmin,
    validateObjectId,
    validateUpdateChapter,
    updateChapter
);

// PUT /api/chapters/reorder -> Reorder chapters for a course (Teacher only)
router.put(
    "/reorder",
    authenticate,
    isTeacherOrAdmin,
    validateReorderChapters,
    reorderChapters
);

// DELETE /api/chapters/:id -> Delete chapter + all lessons + media (Teacher only)
router.delete(
    "/:id",
    authenticate,
    isTeacherOrAdmin,
    validateObjectId,
    deleteChapter
);


export default router;
