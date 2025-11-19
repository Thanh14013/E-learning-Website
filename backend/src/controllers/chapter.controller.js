import Course from "../models/course.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lesson.model.js";
import Media from "../models/media.model.js";

/**
 * @route POST /api/chapters
 * @desc Create chapter (Teacher only)
 * @access Private (teacher, admin)
 */
export const createChapter = async (req, res) => {
    try {
        const { courseId, title } = req.body;
        const userId = req.user.id;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        // only owner teacher or admin can create chapter
        if (req.user.role !== "admin" && course.teacherId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You are not the owner of this course.",
            });
        }

        // calculate next chapter order
        const chapterCount = await Chapter.countDocuments({ courseId });
        const order = chapterCount + 1;

        // 4. Create chapter
        const newChapter = await Chapter.create({
            courseId,
            title,
            order,
        });

        return res.status(201).json({
            success: true,
            message: "Chapter created successfully.",
            chapter: newChapter,
        });
    } catch (error) {
        console.error("Create chapter error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while creating chapter.",
        });
    }
};

/**
 * @route PUT /api/chapters/:id
 * @desc Update chapter title
 * @access Private (teacher, admin)
 */
export const updateChapter = async (req, res) => {
    try {
        const chapterId = req.params.id;
        const { title } = req.body;

        // Find chapter
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found.",
            });
        }

        // Validate course ownership
        const course = await Course.findById(chapter.courseId);
        if (req.user.role !== "admin" && course.teacherId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not the owner of this course.",
            });
        }

        // Update title
        chapter.title = title;
        await chapter.save();

        res.status(200).json({
            success: true,
            message: "Chapter updated successfully.",
            chapter,
        });
    } catch (error) {
        console.error("Update chapter error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating chapter.",
        });
    }
};

/**
 * @route PUT /api/chapters/reorder
 * @desc Reorder chapters
 * @access Private (teacher, admin)
 */
export const reorderChapters = async (req, res) => {
    try {
        const { chapters } = req.body; // Array of chapter IDs

        // Get the first chapter to infer courseId
        const firstChapter = await Chapter.findById(chapters[0]);
        if (!firstChapter) {
            return res.status(400).json({
                success: false,
                message: "Invalid chapter list.",
            });
        }

        const course = await Course.findById(firstChapter.courseId);

        // Only owner can reorder
        if (req.user.role !== "admin" && course.teacherId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not the owner of this course.",
            });
        }

        // Update order for all chapters
        const updateOps = chapters.map((id, index) =>
            Chapter.findByIdAndUpdate(id, { order: index + 1 })
        );

        await Promise.all(updateOps);

        res.status(200).json({
            success: true,
            message: "Chapters reordered successfully.",
        });
    } catch (error) {
        console.error("Reorder chapters error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while reordering chapters.",
        });
    }
};

/**
 * @route DELETE /api/chapters/:id
 * @desc Delete chapter + all lessons + media
 * @access Private (teacher, admin)
 */
export const deleteChapter = async (req, res) => {
    try {
        const chapterId = req.params.id;

        // Find chapter
        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({
                success: false,
                message: "Chapter not found.",
            });
        }

        // Check course ownership
        const course = await Course.findById(chapter.courseId);
        if (req.user.role !== "admin" && course.teacherId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not the owner of this course.",
            });
        }

        // Delete lessons
        const lessons = await Lesson.find({ chapterId });
        const lessonIds = lessons.map((l) => l._id);

        // Delete all media associated with lessons
        await Media.deleteMany({ lessonId: { $in: lessonIds } });

        // Delete lessons
        await Lesson.deleteMany({ chapterId });

        // Delete chapter
        await Chapter.findByIdAndDelete(chapterId);

        res.status(200).json({
            success: true,
            message: "Chapter and related lessons/media deleted successfully.",
        });
    } catch (error) {
        console.error("Delete chapter error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting chapter.",
        });
    }
};
