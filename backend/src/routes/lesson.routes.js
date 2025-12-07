import express from "express";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { isTeacher } from "../middleware/authorize.js";
import { createLesson, updateLesson, deleteLesson, deleteLessonResource, uploadLessonResource, uploadLessonVideo, getLessonDetail, } from "../controllers/lesson.controller.js";
import { uploadResource, uploadVideo } from "../middleware/upload.js";

const router = express.Router();

/**
 * @route   POST /api/lessons
 * @desc    Create new lesson (Teacher only)
 * @access  Private (Teacher)
 */
router.post("/", authenticate, isTeacher, createLesson);

/**
 * @route   PUT /api/chapters/:id
 * @desc    Update lesson (Teacher only)
 * @access  Private (Teacher)
 */
router.put("/:id", authenticate, isTeacher, updateLesson);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete lesson + media (Teacher only)
 * @access  Private (Teacher)
 */
router.delete("/:id", authenticate, isTeacher, deleteLesson);

// upload video
router.post(
    "/:id/video",
    authenticate,
    isTeacher,
    uploadVideo.single("video"),
    uploadLessonVideo
);

// upload resources
router.post(
    "/:id/resource",
    authenticate,
    isTeacher,
    uploadResource.array("files"),
    uploadLessonResource
);

// delete resources
router.delete(
    "/:id/resource/:resId",
    authenticate,
    isTeacher,
    deleteLessonResource
);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get lesson detail (public)
 * @access  Public
 */
router.get("/:id", optionalAuthenticate, getLessonDetail);

export default router;
