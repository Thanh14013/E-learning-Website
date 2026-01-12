import express from "express";
import {
  createQuiz,
  deleteQuiz,
  getQuizAttempts,
  getQuizDetail,
  getQuizzesByLesson,
  getQuizResultDetail,
  startQuiz,
  submitQuiz,
  updateQuiz,
  saveProgress,
  getSavedProgress,
  resetQuizAttempts
} from "../controllers/quiz.controller.js";
import { authenticate } from "../middleware/auth.js";
import { isStudent, isTeacher } from "../middleware/authorize.js";
import {
  validateQuizCreation,
  validateQuizUpdate,
  validateQuizSubmission,
  validateObjectId,
} from "../middleware/validator.js";

const router = express.Router();

// Create quiz with validation
router.post("/", authenticate, isTeacher, validateQuizCreation, createQuiz);

// Update quiz with validation
router.put(
  "/:id",
  authenticate,
  isTeacher,
  validateObjectId,
  validateQuizUpdate,
  updateQuiz
);

// Delete quiz with ID validation
router.delete("/:id", authenticate, isTeacher, validateObjectId, deleteQuiz);

// Get quizzes by lesson ID
router.get("/lesson/:lessonId", authenticate, getQuizzesByLesson);

// Get quiz detail with ID validation
router.get("/:id", authenticate, validateObjectId, getQuizDetail);

// Start quiz with ID validation
router.post("/:id/start", authenticate, isStudent, validateObjectId, startQuiz);

// Submit quiz with validation
router.post(
  "/:id/submit",
  authenticate,
  isStudent,
  validateObjectId,
  validateQuizSubmission,
  submitQuiz
);

// Auto-save progress
router.post("/:id/save", authenticate, isStudent, saveProgress);

// Get progress
router.get("/:id/progress", authenticate, isStudent, getSavedProgress);

router.get("/:id/attempts", authenticate, isStudent, getQuizAttempts);

router.get("/:id/results/:attemptId", authenticate, getQuizResultDetail);

// Reset attempts (Teacher only)
router.delete("/:id/attempts/student/:studentId", authenticate, isTeacher, resetQuizAttempts);

export default router;
