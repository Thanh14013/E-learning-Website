import Progress from "../models/progress.model.js";
import Lesson from "../models/lesson.model.js";
import UserProfile from "../models/userProfile.model.js";
import Chapter from "../models/chapter.model.js";

/**
 * @route   PUT /api/progress/lesson/:lessonId
 * @desc    Update watchedDuration and lastWatchedAt for a lesson (Student)
 * @access  Private (Student)
 */
export const updateLessonProgress = async (req, res) => {
    try {
        const { watchedDuration, markCompleted } = req.body;
        const lessonId = req.params.lessonId;
        const userId = req.user._id;

        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Lấy course bằng chapter
        const chapter = await Chapter.findById(lesson.chapterId);
        const courseId = chapter.courseId;

        // Check enrolled
        const profile = await UserProfile.findOne({ userId });
        const isEnrolled = profile.enrolledCourses.includes(courseId);
        if (!isEnrolled) {
            return res.status(403).json({ message: "You are not enrolled in this course" });
        }

        let progress = await Progress.findOne({ userId, lessonId });

        if (!progress) {
            progress = new Progress({
                userId,
                lessonId,
                courseId,
                watchedDuration: 0,
            });
        }

        // Update fields
        if (watchedDuration > progress.watchedDuration) {
            progress.watchedDuration = watchedDuration;
        }

        progress.lastWatchedAt = new Date();

        const isAutoComplete = watchedDuration / lesson.videoDuration >= 0.9;

        if (markCompleted || isAutoComplete) {
            progress.isCompleted = true;
        }

        await progress.save();

        // Emit socket
        req.io.of("/progress").emit("progress:updated", {
            userId,
            lessonId,
            progress,
        });

        return res.json({ message: "Progress updated", progress });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error when updating progress" });
    }
};

/**
 * @route   POST /api/progress/complete/:lessonId
 * @desc    Mark lesson as completed (Student)
 * @access  Private (Student)
 */
export const markLessonCompleted = async (req, res) => {
    try {
        const lessonId = req.params.lessonId;
        const userId = req.user._id;

        const lesson = await Lesson.findById(lessonId).lean();
        if (!lesson) return res.status(404).json({ message: "Lesson not found" });

        const chapter = await Chapter.findById(lesson.chapterId);
        const courseId = chapter.courseId;

        const profile = await UserProfile.findOne({ userId });
        const isEnrolled = profile.enrolledCourses.includes(courseId);

        if (!isEnrolled)
            return res.status(403).json({ message: "You are not enrolled in this course" });

        let progress = await Progress.findOne({ userId, lessonId });
        if (!progress) {
            progress = new Progress({
                userId,
                lessonId,
                courseId,
                watchedDuration: lesson.videoDuration,
            });
        }

        progress.isCompleted = true;
        await progress.save();

        const lessons = await Lesson.find({ chapterId: chapter._id });
        const completedCount = await Progress.countDocuments({
            userId,
            isCompleted: true,
            courseId,
        });

        const isCourseCompleted = completedCount === lessons.length;

        // Emit socket
        req.io.of("/progress").emit("progress:updated", {
            userId,
            lessonId,
            progress,
            courseCompleted: isCourseCompleted,
        });

        return res.json({
            message: "Lesson marked as completed",
            isCourseCompleted,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error when marking completed" });
    }
};

/**
 * @route   GET /api/progress/course/:courseId
 * @desc    Get course progress for current student
 * @access  Private (Student)
 */
export const getCourseProgress = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user._id;

        const chapters = await Chapter.find({ courseId }).select("_id");
        const chapterIds = chapters.map(c => c._id);

        const lessons = await Lesson.find({ chapterId: { $in: chapterIds } });

        const totalLessons = lessons.length;

        const completedProgress = await Progress.find({
            userId,
            courseId,
            isCompleted: true,
        });

        const completedCount = completedProgress.length;

        const percentage = Math.round((completedCount / totalLessons) * 100);

        const lastProgress = await Progress.findOne({
            userId,
            courseId,
        })
            .sort({ lastWatchedAt: -1 })
            .select("lessonId watchedDuration lastWatchedAt");

        return res.json({
            totalLessons,
            completedCount,
            percentage,
            lastWatched: lastProgress || null,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error when getting course progress" });
    }
};
