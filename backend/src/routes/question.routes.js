import express from "express";

import {
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from "../controllers/question.controller.js";
import {isTeacher} from "../middleware/authorize.js";
import {authenticate} from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/questions/quiz/:quizId
 * @desc    Create question for quiz (Teacher only)
 * @access  Private (Teacher)
 */
router.post("/quiz/:quizId", authenticate, isTeacher, createQuestion);

/**
 * @route   PUT /api/questions/:id
 * @desc    Update question (Teacher only)
 * @access  Private (Teacher)
 */
router.put("/:id", authenticate, isTeacher, updateQuestion);

/**
 * @route   DELETE /api/questions/:id
 * @desc    Delete question (Teacher only)
 * @access  Private (Teacher)
 */
router.delete("/:id", authenticate, isTeacher, deleteQuestion);

export default router;
