import Course from "../models/course.model.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/question.model.js";
import QuizAttempt from "../models/quizAttempt.model.js";
import User from "../models/user.model.js";
import Progress from "../models/progress.model.js";
import { checkAndUpdateLessonCompletion } from "./progress.controller.js";

/**
 * @route   POST /api/quizzes
 * @desc    Create new quiz (Teacher only)
 * @access  Private (Teacher)
 */
export const createQuiz = async (req, res) => {
  try {
    const {
      courseId,
      lessonId,
      title,
      duration,
      passingScore,
      attemptsAllowed,
    } = req.body;
    const userId = req.user.id;

    // Validate course ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (String(course.teacherId) !== userId) {
      return res.status(403).json({ message: "Not authorized to create quiz" });
    }

    // Calculate order
    const lastQuiz = await Quiz.find({ lessonId }).sort({ order: -1 }).limit(1);
    const order = lastQuiz.length > 0 ? lastQuiz[0].order + 1 : 1;

    const quiz = await Quiz.create({
      courseId,
      lessonId,
      title,
      duration,
      passingScore,
      attemptsAllowed,
      order,
      isPublished: true, // Default to true when created
    });

    return res.status(201).json({
      message: "Quiz created successfully",
      quiz,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error while creating quiz" });
  }
};

/**
 * @route   GET /api/quizzes/course/:courseId
 * @desc    Get all quizzes for a course (Teacher/Admin) - includes drafts
 * @access  Private (Teacher/Admin)
 */
export const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id; // Teacher ID

    // Check course ownership if not admin
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.user.role !== "admin" && String(course.teacherId) !== userId) {
      return res.status(403).json({ message: "Not authorized to view quizzes for this course" });
    }

    const quizzes = await Quiz.find({ courseId })
      .select("title duration passingScore attemptsAllowed isPublished lessonId")
      .sort({ order: 1 })
      .lean();

    return res.json({
      success: true,
      data: quizzes,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error while fetching course quizzes" });
  }
};

/**
 * @route   GET /api/quizzes/lesson/:lessonId
 * @desc    Get all quizzes for a lesson
 * @access  Public
 */
export const getQuizzesByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const quizzes = await Quiz.find({ lessonId })
      .select("title duration passingScore attemptsAllowed")
      .sort({ order: 1 }) // Sorted by order
      .lean();

    return res.json({
      success: true,
      data: quizzes,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error while fetching quizzes" });
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

    console.log("🔍 [QUIZ] getQuizDetail called");
    console.log("   Quiz ID:", quizId);
    console.log("   req.user:", req.user);
    console.log("   userId:", userId);

    const quiz = await Quiz.findById(quizId).populate("courseId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    let isEnrolled = false;

    if (userId) {
      const user = await User.findById(userId);
      console.log("🔍 [QUIZ] Check enrollment:");
      console.log("   User:", user?.fullName, `(${userId})`);
      console.log("   Course:", quiz.courseId.title);
      console.log("   CourseId:", quiz.courseId._id.toString());
      console.log(
        "   Enrolled:",
        user?.enrolledCourses?.map((c) => c.toString())
      );

      isEnrolled = user?.enrolledCourses?.some(
        (courseObjId) => courseObjId.toString() === quiz.courseId._id.toString()
      );

      console.log("   ✅ Result:", isEnrolled);
    }

    let questions = [];

    if (isEnrolled) {
      questions = await Question.find({ quizId }).sort({ order: 1 }).lean();
      console.log("   📝 Questions:", questions.length);
    } else {
      console.log("   ❌ Blocked - not enrolled");
    }

    // Prevent caching for quiz questions (enrollment status may change)
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.json({
      success: true,
      data: {
        quiz,
        canViewQuestions: isEnrolled,
        questions,
      },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error while fetching quiz detail" });
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
    const user = await User.findById(userId);
    const isEnrolled = user?.enrolledCourses?.some(
      (courseObjId) => courseObjId.toString() === quiz.courseId._id.toString()
    );
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course" });
    }

    // Count attempts
    const previousAttempts = await QuizAttempt.countDocuments({
      quizId,
      userId,
    });

    console.log(`🎯 Quiz Start Attempt Check:`, {
      quizId,
      userId,
      quizTitle: quiz.title,
      previousAttempts,
      attemptsAllowed: quiz.attemptsAllowed,
      remaining: quiz.attemptsAllowed - previousAttempts
    });

    if (previousAttempts >= quiz.attemptsAllowed) {
      return res.status(400).json({ 
        message: "No attempts remaining",
        previousAttempts,
        attemptsAllowed: quiz.attemptsAllowed
      });
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
    return res
      .status(500)
      .json({ message: "Server error while starting quiz" });
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

    console.log('📝 Submit Quiz Request:', {
      quizId,
      attemptId,
      userId,
      userFromToken: req.user
    });

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      console.log('❌ Attempt not found:', attemptId);
      return res.status(404).json({ message: "Attempt not found" });
    }

    console.log('🔍 Attempt Check:', {
      attemptUserId: attempt.userId.toString(),
      requestUserId: userId.toString(),
      userIdType: typeof userId,
      attemptUserIdType: typeof attempt.userId,
      match: String(attempt.userId) === String(userId)
    });

    if (String(attempt.userId) !== String(userId)) {
      console.log('❌ User mismatch!', {
        attemptUserId: attempt.userId.toString(),
        requestUserId: userId.toString()
      });
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

    // If passed, check if lesson is now complete
    if (isPassed) {
      try {
        const lessonId = quiz.lessonId;
        let progress = await Progress.findOne({ userId, lessonId });
        if (progress) {
          await checkAndUpdateLessonCompletion(userId, lessonId, progress);
        }
      } catch (progressErr) {
        console.error("Error updating lesson progress after quiz:", progressErr);
      }
    }

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
    return res
      .status(500)
      .json({ message: "Server error while submitting quiz" });
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
    return res
      .status(500)
      .json({ message: "Server error while fetching attempts" });
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
      return res
        .status(400)
        .json({ message: "Attempt does not belong to this quiz" });
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
      return res
        .status(403)
        .json({ message: "Not authorized to view this result" });
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

      // Check if answer is correct
      let isCorrect = false;
      if (userAnswer) {
        if (q.type === "multiple_choice") {
          isCorrect = userAnswer.selectedOption === q.correctOption;
        } else if (q.type === "true_false") {
          isCorrect = userAnswer.selectedBoolean === q.correctBoolean;
        } else if (q.type === "fill_blank") {
          isCorrect =
            userAnswer.filledText?.trim().toLowerCase() ===
            q.correctText?.trim().toLowerCase();
        }
      }

      return {
        questionId: q._id,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        correctAnswer,
        userAnswer,
        isCorrect,
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

    const { title, duration, passingScore, attemptsAllowed, isPublished } =
      req.body;

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
    return res
      .status(500)
      .json({ message: "Server error while updating quiz" });
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
    return res
      .status(500)
      .json({ message: "Server error while deleting quiz" });
  }
};

/**
 * @route   PUT /api/quizzes/:id/publish
 * @desc    Toggle quiz publish status (Teacher only)
 * @access  Private (Teacher)
 */
export const togglePublishQuiz = async (req, res) => {
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

    quiz.isPublished = !quiz.isPublished;
    await quiz.save();

    return res.json({
      message: `Quiz ${quiz.isPublished ? "published" : "unpublished"} successfully`,
      quiz,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error while toggling quiz publish status" });
  }
};
