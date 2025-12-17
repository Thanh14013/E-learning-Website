import express from "express";
import {
  createSession,
  getCourseSessions,
  getSessionDetail,
  updateSession,
  startSession,
  endSession,
  joinSession,
  deleteSession,
  getMySessions,
  getEnrolledCourseSessions,
  seedDemoSessions,
} from "../controllers/session.controller.js";
import { authenticate } from "../middleware/auth.js";
import { isTeacherOrAdmin } from "../middleware/authorize.js";
import {
  validateObjectId,
  validateCourseIdParam,
  validatePagination,
  validateSessionCreation,
  validateSessionUpdate,
} from "../middleware/validator.js";

const router = express.Router();

/**
 * @route   POST /api/sessions
 * @desc    Create new live session
 * @access  Private (Teacher/Admin)
 */
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  validateSessionCreation,
  createSession
);

// Seed demo live sessions (testing)
router.post(
  "/seed-demo",
  authenticate,
  isTeacherOrAdmin,
  seedDemoSessions
);

/**
 * @route   GET /api/sessions/my-sessions
 * @desc    Get sessions hosted by current teacher
 * @access  Private (Teacher/Admin)
 */
router.get(
  "/my-sessions",
  authenticate,
  isTeacherOrAdmin,
  validatePagination,
  getMySessions
);

/**
 * @route   GET /api/sessions/my-enrolled-sessions
 * @desc    Get all sessions from enrolled courses for calendar
 * @access  Private (Student)
 */
router.get(
  "/my-enrolled-sessions",
  authenticate,
  getEnrolledCourseSessions
);

/**
 * @route   GET /api/sessions/course/:courseId
 * @desc    Get all sessions for a course
 * @access  Public
 */
router.get(
  "/course/:courseId",
  validateCourseIdParam,
  validatePagination,
  getCourseSessions
);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session detail
 * @access  Public
 */
router.get("/:id", validateObjectId, getSessionDetail);

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session
 * @access  Private (Teacher/Admin - Owner)
 */
router.put(
  "/:id",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  validateSessionUpdate,
  updateSession
);

/**
 * @route   PUT /api/sessions/:id/start
 * @desc    Start live session
 * @access  Private (Teacher/Admin - Owner)
 */
router.put(
  "/:id/start",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  startSession
);

/**
 * @route   PUT /api/sessions/:id/end
 * @desc    End live session
 * @access  Private (Teacher/Admin - Owner)
 */
router.put(
  "/:id/end",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  endSession
);

/**
 * @route   POST /api/sessions/:id/join
 * @desc    Join live session (validate enrollment)
 * @access  Private
 */
router.post("/:id/join", authenticate, validateObjectId, joinSession);

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete session
 * @access  Private (Teacher/Admin - Owner)
 */
router.delete(
  "/:id",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  deleteSession
);

export default router;
