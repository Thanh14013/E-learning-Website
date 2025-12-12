import express from "express";
import { createQuiz, deleteQuiz, getQuizAttempts, getQuizDetail, getQuizResultDetail, startQuiz, submitQuiz, updateQuiz } from "../controllers/quiz.controller.js";
import { authenticate } from "../middleware/auth.js";
import { isStudent, isTeacher } from "../middleware/authorize.js";

const router = express.Router();

router.post("/", authenticate, isTeacher, createQuiz);
router.put("/:id", authenticate, isTeacher, updateQuiz);
router.delete("/:id", authenticate, isTeacher, deleteQuiz);

router.get("/:id", getQuizDetail);

router.post("/:id/start", authenticate, isStudent, startQuiz);
router.post("/:id/submit", authenticate, isStudent, submitQuiz);
router.get("/:id/attempts", authenticate, isStudent, getQuizAttempts);

router.get("/:id/results/:attemptId", authenticate, getQuizResultDetail);

export default router;
