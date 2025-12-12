import {validateQuizOwnership} from "../middleware/validator.js";
import Question from "../models/question.model.js";

/**
 * @route   POST /api/questions/quiz/:quizId
 * @desc    Create new question for quiz (Teacher only)
 * @access  Private (Teacher)
 */
export const createQuestion = async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const teacherId = req.user.id;
        const { type, questionText, options, correctOption, correctBoolean, correctText } = req.body;

        // Validate quiz ownership
        const { quiz, error } = await validateQuizOwnership(quizId, teacherId);
        if (error) return res.status(403).json({ message: error });

        // Validate type fields
        if (type === "multiple_choice") {
            if (!Array.isArray(options) || options.length < 2) {
                return res.status(400).json({ message: "Multiple choice questions need at least 2 options." });
            }
            if (typeof correctOption !== "number") {
                return res.status(400).json({ message: "correctOption must be a number index." });
            }
        }

        if (type === "true_false" && typeof correctBoolean !== "boolean") {
            return res.status(400).json({ message: "True/False question requires correctBoolean field." });
        }

        if (type === "fill_blank" && !correctText) {
            return res.status(400).json({ message: "Fill blank question requires correctText field." });
        }

        const question = await Question.create({
            quizId,
            type,
            questionText,
            options,
            correctOption,
            correctBoolean,
            correctText,
        });

        return res.status(201).json({
            message: "Question created successfully",
            question,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while creating question" });
    }
};

/**
 * @route   PUT /api/questions/:id
 * @desc    Update question (Teacher only)
 * @access  Private (Teacher)
 */
export const updateQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const teacherId = req.user.id;
        const body = req.body;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        // Validate quiz ownership
        const { error } = await validateQuizOwnership(question.quizId, teacherId);
        if (error) return res.status(403).json({ message: error });

        // Validate depending on type
        if (question.type === "multiple_choice") {
            if (body.options && (!Array.isArray(body.options) || body.options.length < 2)) {
                return res.status(400).json({ message: "Multiple choice questions need at least 2 options." });
            }
            if (body.correctOption !== undefined && typeof body.correctOption !== "number") {
                return res.status(400).json({ message: "correctOption must be a number index." });
            }
        }

        if (question.type === "true_false" && body.correctBoolean !== undefined && typeof body.correctBoolean !== "boolean") {
            return res.status(400).json({ message: "True/False question requires correctBoolean." });
        }

        if (question.type === "fill_blank" && body.correctText !== undefined && !body.correctText) {
            return res.status(400).json({ message: "Fill blank question requires correctText." });
        }

        Object.assign(question, body);
        await question.save();

        return res.json({
            message: "Question updated successfully",
            question,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while updating question" });
    }
};

/**
 * @route   DELETE /api/questions/:id
 * @desc    Delete question (Teacher only)
 * @access  Private (Teacher)
 */
export const deleteQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const teacherId = req.user.id;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        const { error } = await validateQuizOwnership(question.quizId, teacherId);
        if (error) return res.status(403).json({ message: error });

        await question.deleteOne();

        return res.json({ message: "Question deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while deleting question" });
    }
};
