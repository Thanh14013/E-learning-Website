import express from "express";
import {authenticate} from "../middleware/auth.js";
import {isTeacher} from "../middleware/authorize.js";
import {
    createLesson,
    updateLesson,
    deleteLesson, deleteLessonResource, uploadLessonResource, uploadLessonVideo,
} from "../controllers/lesson.controller.js";
import {uploadResource, uploadVideo} from "../middleware/upload.js";

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

// UPLOAD VIDEO
router.post(
    "/:id/video",
    authenticate,
    isTeacher,
    uploadVideo.single("video"),
    uploadLessonVideo
);

// UPLOAD RESOURCES
router.post(
    "/:id/resource",
    authenticate,
    isTeacher,
    uploadResource.array("files"),
    uploadLessonResource
);

// DELETE RESOURCE
router.delete(
    "/:id/resource/:resId",
    authenticate,
    isTeacher,
    deleteLessonResource
);


export default router;
