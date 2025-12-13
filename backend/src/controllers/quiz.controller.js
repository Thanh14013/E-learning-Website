import Course from "../models/course.model.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/question.model.js";
import QuizAttempt from "../models/quizAttempt.model.js";
import UserProfile from "../models/userProfile.model.js";

/**
 * @route   POST /api/quizzes
 * @desc    Create new quiz (Teacher only)
 * @access  Private (Teacher)
 */
export const createQuiz = async (req, res) => {
    try {
        const { courseId, lessonId, title, duration, passingScore, attemptsAllowed } = req.body;
        const userId = req.user.id;

        // Validate course ownership
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        if (String(course.teacherId) !== userId) {
            return res.status(403).json({ message: "Not authorized to create quiz" });
        }

        const quiz = await Quiz.create({
            courseId,
            lessonId,
            title,
            duration,
            passingScore,
            attemptsAllowed,
        });

        return res.status(201).json({
            message: "Quiz created successfully",
            quiz,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while creating quiz" });
    }
};

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get quiz detail (public)
 * @access  Public
 */
export const getQuizDetail = async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user?.id;

        const quiz = await Quiz.findById(quizId).populate("courseId");
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        let isEnrolled = false;

        if (userId) {
            const profile = await UserProfile.findOne({ userId });
            isEnrolled = profile?.enrolledCourses.includes(quiz.courseId._id);
        }

        let questions = [];

        if (isEnrolled) {
            questions = await Question.find({ quizId }).select(
                "-correctOption -correctBoolean -correctText"
            );
        }

        return res.json({
            quiz,
            canViewQuestions: isEnrolled,
            questions,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while fetching quiz detail" });
    }
};

/**
 * @route   POST /api/quizzes/:id/start
 * @desc    Start quiz attempt (student)
 * @access  Private (Student)
 */
export const startQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user.id;

        const quiz = await Quiz.findById(quizId).populate("courseId");
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        // Check enrolled
        const profile = await UserProfile.findOne({ userId });
        const isEnrolled = profile.enrolledCourses.includes(quiz.courseId._id);
        if (!isEnrolled) {
            return res.status(403).json({ message: "You are not enrolled in this course" });
        }

        // Count attempts
        const previousAttempts = await QuizAttempt.countDocuments({ quizId, userId });

        if (previousAttempts >= quiz.attemptsAllowed) {
            return res.status(400).json({ message: "No attempts remaining" });
        }

        // Create attempt
        const attempt = await QuizAttempt.create({
            quizId,
            userId,
            attemptNumber: previousAttempts + 1,
            startedAt: new Date(),
            isPassed: false,
            score: 0,
            answers: [],
        });

        // get questions (without answers)
        const questions = await Question.find({ quizId }).select(
            "-correctOption -correctBoolean -correctText"
        );

        return res.json({
            message: "Quiz attempt started",
            attemptId: attempt._id,
            attemptNumber: attempt.attemptNumber,
            questions,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while starting quiz" });
    }
};

/**
 * @route   POST /api/quizzes/:id/submit
 * @desc    Submit quiz attempt
 * @access  Private (Student)
 */
export const submitQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const { attemptId, answers } = req.body;
        const userId = req.user.id;

        const attempt = await QuizAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        if (String(attempt.userId) !== userId) {
            return res.status(403).json({ message: "Not your attempt" });
        }

        if (attempt.submittedAt) {
            return res.status(400).json({ message: "Attempt already submitted" });
        }

        const questions = await Question.find({ quizId });

        let correctCount = 0;

        const results = [];

        for (const q of questions) {
            const a = answers.find((x) => String(x.questionId) === String(q._id));

            let isCorrect = false;

            if (q.type === "multiple_choice") {
                isCorrect = a?.selectedOption === q.correctOption;
            }

            if (q.type === "true_false") {
                isCorrect = a?.selectedBoolean === q.correctBoolean;
            }

            if (q.type === "fill_blank") {
                isCorrect =
                    a?.filledText?.trim().toLowerCase() ===
                    q.correctText.trim().toLowerCase();
            }

            if (isCorrect) correctCount++;

            results.push({
                questionId: q._id,
                isCorrect,
                userAnswer: a,
            });
        }

        const score = correctCount;
        const total = questions.length;
        const percentage = Math.round((score / total) * 100);

        const quiz = await Quiz.findById(quizId);
        const isPassed = percentage >= quiz.passingScore;

        // Update attempt
        attempt.score = score;
        attempt.percentage = percentage;
        attempt.isPassed = isPassed;
        attempt.answers = answers;
        attempt.submittedAt = new Date();

        await attempt.save();

        return res.json({
            message: "Quiz submitted successfully",
            score,
            percentage,
            isPassed,
            totalQuestions: total,
            results,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while submitting quiz" });
    }
};

/**
 * @route   GET /api/quizzes/:id/attempts
 * @desc    Get attempts of current user for a quiz
 * @access  Private (Student)
 */
export const getQuizAttempts = async (req, res) => {
    try {
        const quizId = req.params.id;
        const userId = req.user.id;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const attempts = await QuizAttempt.find({ quizId, userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("score percentage isPassed createdAt attemptNumber");

        const count = await QuizAttempt.countDocuments({ quizId, userId });

        return res.json({
            attempts,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while fetching attempts" });
    }
};

/**
 * @route   GET /api/quizzes/:id/results/:attemptId
 * @desc    Get detailed quiz result (student or teacher)
 * @access  Private
 */
export const getQuizResultDetail = async (req, res) => {
    try {
        const quizId = req.params.id;
        const attemptId = req.params.attemptId;
        const userId = req.user.id;
        const role = req.user.role;

        const attempt = await QuizAttempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        if (String(attempt.quizId) !== quizId) {
            return res.status(400).json({ message: "Attempt does not belong to this quiz" });
        }

        // Fetch quiz + course
        const quiz = await Quiz.findById(quizId).populate("courseId");

        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // Ownership rules
        let canView = false;

        if (role === "student" && String(attempt.userId) === userId) {
            canView = true;
        }

        if (role === "teacher" && String(quiz.courseId.teacherId) === userId) {
            canView = true;
        }

        if (!canView) {
            return res.status(403).json({ message: "Not authorized to view this result" });
        }

        const questions = await Question.find({ quizId });

        // Build detailed result with answers + explanations
        const details = questions.map((q) => {
            const userAnswer = attempt.answers.find(
                (a) => String(a.questionId) === String(q._id)
            );

            const correctAnswer =
                q.type === "multiple_choice"
                    ? q.correctOption
                    : q.type === "true_false"
                        ? q.correctBoolean
                        : q.type === "fill_blank"
                            ? q.correctText
                            : null;

            return {
                questionId: q._id,
                questionText: q.questionText,
                type: q.type,
                options: q.options,
                correctAnswer,
                userAnswer,
                isCorrect:
                    attempt.results?.find((r) => String(r.questionId) === String(q._id))
                        ?.isCorrect || false,
                explanation: q.explanation || null,
            };
        });

        return res.json({
            attemptId,
            quizId,
            score: attempt.score,
            percentage: attempt.percentage,
            isPassed: attempt.isPassed,
            details,
            submittedAt: attempt.submittedAt,
        });
    } catch (err) {
        console.error(err);
        return res
            .status(500)
            .json({ message: "Server error while getting quiz result detail" });
    }
};

/**
 * @route   PUT /api/quizzes/:id
 * @desc    Update quiz (Teacher only)
 * @access  Private (Teacher)
 */
export const updateQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const teacherId = req.user.id;

        const quiz = await Quiz.findById(quizId).populate("courseId");
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        if (String(quiz.courseId.teacherId) !== teacherId) {
            return res.status(403).json({ message: "Not authorized to update quiz" });
        }

        const { title, duration, passingScore, attemptsAllowed, isPublished } = req.body;

        if (title !== undefined) quiz.title = title;
        if (duration !== undefined) quiz.duration = duration;
        if (passingScore !== undefined) quiz.passingScore = passingScore;
        if (attemptsAllowed !== undefined) quiz.attemptsAllowed = attemptsAllowed;
        if (isPublished !== undefined) quiz.isPublished = isPublished;

        await quiz.save();

        return res.json({
            message: "Quiz updated successfully",
            quiz,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while updating quiz" });
    }
};

/**
 * @route   DELETE /api/quizzes/:id
 * @desc    Delete quiz + questions + attempts (Teacher only)
 * @access  Private (Teacher)
 */
export const deleteQuiz = async (req, res) => {
    try {
        const quizId = req.params.id;
        const teacherId = req.user.id;

        const quiz = await Quiz.findById(quizId).populate("courseId");
        if (!quiz) {
            return res.status(404).json({ message: "Quiz not found" });
        }

        if (String(quiz.courseId.teacherId) !== teacherId) {
            return res.status(403).json({ message: "Not authorized to delete quiz" });
        }

        await Question.deleteMany({ quizId });
        await QuizAttempt.deleteMany({ quizId });
        await quiz.deleteOne();

        return res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error while deleting quiz" });
    }
};
