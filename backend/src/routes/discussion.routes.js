import express from "express";
import {
  createDiscussion,
  getDiscussionsByCourse,
  getDiscussionDetail,
  updateDiscussion,
  deleteDiscussion,
  likeDiscussion,
  pinDiscussion,
} from "../controllers/discussion.controller.js";
import { createComment } from "../controllers/comment.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import {
  isStudentOrTeacher,
  isTeacherOrAdmin,
} from "../middleware/authorize.js";

/**
 * Discussion Routes
 * Handles all discussion-related endpoints
 * Base path: /api/discussions
 */
const router = express.Router();

/**
 * POST /api/discussions
 * Create a new discussion in a course
 * @access Protected - Students and Teachers only
 * @body { courseId, title, content }
 */
router.post("/", authenticate, isStudentOrTeacher, createDiscussion);

/**
 * GET /api/discussions/course/:courseId
 * Get all discussions for a specific course
 * @access Public
 * @query page, limit, search, sortBy, order
 */
router.get("/course/:courseId", getDiscussionsByCourse);

/**
 * GET /api/discussions/:id
 * Get discussion detail with all comments
 * @access Public
 */
router.get("/:id", getDiscussionDetail);

/**
 * PUT /api/discussions/:id
 * Update a discussion (title and/or content)
 * @access Protected - Owner, Teacher, or Admin
 * @body { title?, content? }
 */
router.put("/:id", authenticate, updateDiscussion);

/**
 * DELETE /api/discussions/:id
 * Delete a discussion and all its comments
 * @access Protected - Owner, Teacher, or Admin
 */
router.delete("/:id", authenticate, deleteDiscussion);

/**
 * PUT /api/discussions/:id/like
 * Toggle like on a discussion
 * @access Protected - Authenticated users
 */
router.put("/:id/like", authenticate, likeDiscussion);

/**
 * PUT /api/discussions/:id/pin
 * Pin or unpin a discussion (Teacher/Admin only)
 * @access Protected - Teacher or Admin only
 */
router.put("/:id/pin", authenticate, isTeacherOrAdmin, pinDiscussion);

/**
 * POST /api/discussions/:id/comment
 * Create a comment on a discussion
 * @access Protected - Authenticated users
 * @body { content, parentId? }
 */
router.post("/:id/comment", authenticate, createComment);

export default router;
