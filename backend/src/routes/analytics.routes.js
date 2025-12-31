import express from "express";
import {
  getCourseAnalytics,
  getStudentAnalytics,
  getDashboardAnalytics,
  exportCourseAnalytics,
  generateStudentReport,
  manualCollectAnalytics,
  getStudentTrend
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

/**
 * @route   GET /api/analytics/course/:courseId
 * @desc    Get analytics data for a course (with trend and growth)
 * @access  Private (Teacher - owner only or Admin)
 */
router.get("/course/:courseId", authenticate, getCourseAnalytics);

/**
 * @route   GET /api/analytics/course/:courseId/student/:studentId
 * @desc    Get daily trend for a specific student in a course
 * @access  Private (Teacher or Admin)
 */
router.get("/course/:courseId/student/:studentId", authenticate, getStudentTrend);

/**
 * @route   GET /api/analytics/student/:userId
 * @desc    Get student analytics and learning statistics
 * @access  Private (Student - own data, Teacher, or Admin)
 */
router.get("/student/:userId", authenticate, getStudentAnalytics);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics summary (teacher or admin)
 * @access  Private (Teacher/Admin)
 */
router.get(
  "/dashboard",
  authenticate,
  authorize(["teacher", "admin"]),
  getDashboardAnalytics
);

/**
 * @route   GET /api/analytics/export
 * @desc    Export course analytics to CSV
 * @access  Private (Teacher - owner only or Admin)
 */
router.get(
  "/export",
  authenticate,
  authorize(["teacher", "admin"]),
  exportCourseAnalytics
);

/**
 * @route   GET /api/analytics/student-report/:userId
 * @desc    Generate comprehensive student report
 * @access  Private (Student - own, Teacher, or Admin)
 */
router.get("/student-report/:userId", authenticate, generateStudentReport);

/**
 * @route   POST /api/analytics/collect
 * @desc    Manually trigger analytics collection (for testing or manual runs)
 * @access  Private (Admin only)
 */
router.post(
  "/collect",
  authenticate,
  authorize(["admin"]),
  manualCollectAnalytics
);

export default router;
