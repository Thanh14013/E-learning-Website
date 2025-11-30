import Lesson from "../models/lesson.model.js";
import Chapter from "../models/chapter.model.js";
import Media from "../models/media.model.js";
import { deleteFile } from "../config/cloudinary.config.js";
import { validateLessonOwnership } from "../middleware/validator.js";
import fs from "fs";

/**
 * @route   POST /api/lessons
 * @desc    Create new lesson (Teacher only)
 * @access  Private (Teacher)
 */
export const createLesson = async (req, res, next) => {
    try {
        const { chapterId, title, content, isPreview } = req.body;
        const userId = req.user.id;

        // Validate chapter ownership
        const chapter = await Chapter.findById(chapterId).populate("courseId");
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found" });
        }

        if (String(chapter.courseId.teacherId) !== userId) {
            return res.status(403).json({ message: "Not authorized to add lesson" });
        }

        // Set order automatically
        const lastLesson = await Lesson.find({ chapterId })
            .sort({ order: -1 })
            .limit(1);

        const order = lastLesson.length > 0 ? lastLesson[0].order + 1 : 1;

        const newLesson = await Lesson.create({
            chapterId,
            title,
            content,
            isPreview: isPreview ?? false,
            order,
        });

        return res.status(201).json({
            message: "Lesson created successfully",
            lesson: newLesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update existing lesson (Teacher only)
 * @access  Private (Teacher)
 */
export const updateLesson = async (req, res, next) => {
    try {
        const lessonId = req.params.id;
        const { title, content, isPreview } = req.body;
        const userId = req.user.id;

        const lesson = await Lesson.findById(lessonId).populate({
            path: "chapterId",
            populate: { path: "courseId" },
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Validate ownership
        if (String(lesson.chapterId.courseId.teacherId) !== userId) {
            return res.status(403).json({ message: "Not authorized to update lesson" });
        }

        lesson.title = title ?? lesson.title;
        lesson.content = content ?? lesson.content;
        lesson.isPreview =
            typeof isPreview === "boolean" ? isPreview : lesson.isPreview;

        await lesson.save();

        return res.status(200).json({
            message: "Lesson updated successfully",
            lesson,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete lesson + its media (Teacher only)
 * @access  Private (Teacher)
 */
export const deleteLesson = async (req, res, next) => {
    try {
        const lessonId = req.params.id;
        const userId = req.user.id;

        const lesson = await Lesson.findById(lessonId).populate({
            path: "chapterId",
            populate: { path: "courseId" },
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        // Validate ownership
        if (String(lesson.chapterId.courseId.teacherId) !== userId) {
            return res.status(403).json({ message: "Not authorized to delete lesson" });
        }

        // Find all media
        const medias = await Media.find({ lessonId });

        // Delete from Cloudinary
        for (const m of medias) {
            await deleteFile(m.filename, {
                resource_type: m.type === "video" ? "video" : "raw",
            });
        }

        // Delete from DB
        await Media.deleteMany({ lessonId });

        // Delete lesson
        await lesson.deleteOne();

        return res.status(200).json({ message: "Lesson deleted successfully" });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/lessons/:id/video
 * @desc    Upload lesson video (Teacher only)
 * @access  Private (Teacher)
 */
export const uploadLessonVideo = async (req, res, next) => {
    try {
        const lessonId = req.params.id;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: "No video file provided." });
        }

        const { lesson, error } = await validateLessonOwnership(lessonId, userId);
        if (error) return res.status(403).json({ message: error });

        // Upload Cloudinary
        const filePath = req.file.path;
        const result = await uploadFile(filePath, { resource_type: "video" });

        const { secure_url, public_id, duration } = result;

        await Media.create({
            lessonId,
            type: "video",
            url: secure_url,
            filename: public_id,
            size: req.file.size,
            uploadedBy: userId,
        });

        lesson.videoUrl = secure_url;
        lesson.duration = duration || 0;
        await lesson.save();

        fs.unlinkSync(filePath);

        res.json({
            message: "Video uploaded successfully",
            videoUrl: secure_url,
            duration,
        });
    } catch (e) {
        next(e);
    }
};

/**
 * @route   POST /api/lessons/:id/resource
 * @desc    Upload lesson resources
 * @access  Private (Teacher)
 */
export const uploadLessonResource = async (req, res, next) => {
    try {
        const lessonId = req.params.id;
        const userId = req.user.id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded." });
        }

        const { lesson, error } = await validateLessonOwnership(lessonId, userId);
        if (error) return res.status(403).json({ message: error });

        const uploaded = [];

        for (const file of req.files) {
            const result = await uploadFile(file.path, { resource_type: "raw" });

            const media = await Media.create({
                lessonId,
                type: "resource",
                url: result.secure_url,
                filename: result.public_id,
                size: file.size,
                uploadedBy: userId,
            });

            uploaded.push(media);

            fs.unlinkSync(file.path);
        }

        res.json({
            message: "Resources uploaded successfully",
            resources: uploaded,
        });
    } catch (e) {
        next(e);
    }
};

/**
 * @route   DELETE /api/lessons/:id/resource/:resId
 * @desc    Delete resource file
 * @access  Private (Teacher)
 */
export const deleteLessonResource = async (req, res, next) => {
    try {
        const { id: lessonId, resId } = req.params;
        const userId = req.user.id;

        const { lesson, error } = await validateLessonOwnership(lessonId, userId);
        if (error) return res.status(403).json({ message: error });

        const media = await Media.findOne({ _id: resId, lessonId });
        if (!media) return res.status(404).json({ message: "Resource not found." });

        await deleteFile(media.filename, { resource_type: "raw" });
        await media.deleteOne();

        res.json({ message: "Resource deleted successfully" });
    } catch (e) {
        next(e);
    }
};
