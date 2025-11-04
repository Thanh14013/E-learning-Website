import express from 'express';
import { createDiscussion } from '../controllers/discussion.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isStudentOrTeacher } from '../middleware/authorize.js';

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
router.post(
  '/',
  authenticate,
  isStudentOrTeacher,
  createDiscussion
);

export default router;
