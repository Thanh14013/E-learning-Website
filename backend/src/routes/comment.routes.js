import express from "express";
import {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
} from "../controllers/comment.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validator.js";

/**
 * Comment Routes
 * Handles all comment-related endpoints
 * Base path: /api/comments (for direct comment operations)
 * Also mounted on /api/discussions for creating comments
 */
const router = express.Router();

/**
 * PUT /api/comments/:id
 * Update a comment
 * @access Protected - Owner only
 * @body { content }
 */
router.put("/:id", authenticate, validateObjectId, updateComment);

/**
 * DELETE /api/comments/:id
 * Delete a comment (and all its replies if any)
 * @access Protected - Owner, Teacher, or Admin
 */
router.delete("/:id", authenticate, validateObjectId, deleteComment);

/**
 * PUT /api/comments/:id/like
 * Toggle like on a comment
 * @access Protected - Authenticated users
 */
router.put("/:id/like", authenticate, validateObjectId, likeComment);

export default router;
