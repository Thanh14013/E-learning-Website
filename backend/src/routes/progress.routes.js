// src/routes/progress.routes.js
import express from "express";
import { isStudent } from "../middleware/authorize.js";
import {
  updateLessonProgress,
  markLessonCompleted,
  getLessonProgress,
  getCourseProgress,
  getDashboardStats,
} from "../controllers/progress.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /api/progress/lesson/:lessonId
 * @desc    Get progress for a specific lesson (Student)
 * @access  Private (Student)
 */
router.get("/lesson/:lessonId", authenticate, isStudent, getLessonProgress);

/**
 * @route   PUT /api/progress/lesson/:lessonId
 * @desc    Update watchedDuration for lesson (Student)
 * @access  Private (Student)
 */
router.put("/lesson/:lessonId", authenticate, isStudent, updateLessonProgress);

/**
 * @route   POST /api/progress/complete/:lessonId
 * @desc    Mark lesson as completed (Student)
 * @access  Private (Student)
 */
router.post(
  "/complete/:lessonId",
  authenticate,
  isStudent,
  markLessonCompleted
);

/**
 * @route   GET /api/progress/dashboard-stats
 * @desc    Get dashboard statistics for student
 * @access  Private (Student)
 */
router.get("/dashboard-stats", authenticate, isStudent, getDashboardStats);

/**
 * @route   GET /api/progress/course/:courseId
 * @desc    Get course progress for current student
 * @access  Private (Student)
 */
router.get("/course/:courseId", authenticate, isStudent, getCourseProgress);

export default router;
