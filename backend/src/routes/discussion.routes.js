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
import {
  validateObjectId,
  validatePagination,
  validateCourseIdParam,
} from "../middleware/validator.js";

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
 * Get all discussions for a specific course or lesson
 * @access Public
 * @query page, limit, search, sortBy, order, lessonId
 * @note Pass lessonId='null' to get only course-level discussions
 *       Pass lessonId=<id> to get specific lesson discussions
 *       Omit lessonId to get all discussions
 */
router.get(
  "/course/:courseId",
  validateCourseIdParam,
  validatePagination,
  getDiscussionsByCourse
);

/**
 * GET /api/discussions/lesson/:lessonId
 * Get all discussions for a specific lesson
 * @access Public
 * @query page, limit, search, sortBy, order
 */
router.get(
  "/lesson/:lessonId",
  validatePagination,
  async (req, res, next) => {
    // Convert lessonId param to query for reuse of getDiscussionsByCourse
    req.query.lessonId = req.params.lessonId;
    // We need courseId - will be fetched from lesson -> chapter
    try {
      const Lesson = (await import("../models/lesson.model.js")).default;
      const Chapter = (await import("../models/chapter.model.js")).default;

      console.log("🔍 Finding lesson with ID:", req.params.lessonId);
      const lesson = await Lesson.findById(req.params.lessonId).select(
        "chapterId"
      );
      if (!lesson) {
        console.log("❌ Lesson not found in database");
        return res.status(404).json({
          success: false,
          message: "Lesson not found.",
        });
      }

      console.log("✅ Lesson found, chapterId:", lesson.chapterId);

      // Get courseId from chapter
      const chapter = await Chapter.findById(lesson.chapterId).select(
        "courseId"
      );
      if (!chapter) {
        console.log("❌ Chapter not found for lesson");
        return res.status(404).json({
          success: false,
          message: "Chapter not found.",
        });
      }

      console.log("✅ Chapter found, courseId:", chapter.courseId);
      req.params.courseId = chapter.courseId.toString();
      next();
    } catch (error) {
      console.error("❌ Error fetching lesson/chapter:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve lesson.",
        error: error.message,
      });
    }
  },
  getDiscussionsByCourse
);

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
router.put("/:id", authenticate, validateObjectId, updateDiscussion);

/**
 * DELETE /api/discussions/:id
 * Delete a discussion and all its comments
 * @access Protected - Owner, Teacher, or Admin
 */
router.delete("/:id", authenticate, validateObjectId, deleteDiscussion);

/**
 * PUT /api/discussions/:id/like
 * Toggle like on a discussion
 * @access Protected - Authenticated users
 */
router.put("/:id/like", authenticate, validateObjectId, likeDiscussion);

/**
 * PUT /api/discussions/:id/pin
 * Pin or unpin a discussion (Teacher/Admin only)
 * @access Protected - Teacher or Admin only
 */
router.put(
  "/:id/pin",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  pinDiscussion
);

/**
 * POST /api/discussions/:id/comment
 * Create a comment on a discussion
 * @access Protected - Authenticated users
 * @body { content, parentId? }
 */
router.post("/:id/comment", authenticate, validateObjectId, createComment);

export default router;
