import Lesson from "../models/lesson.model.js";
import Chapter from "../models/chapter.model.js";
import Media from "../models/media.model.js";
import UserProfile from "../models/userProfile.model.js";
import { deleteFile, uploadFile } from "../config/cloudinary.config.js";
import { validateLessonOwnership } from "../middleware/validator.js";
import fs from "fs";

/**
 * @route   POST /api/lessons
 * @desc    Create new lesson (Teacher only)
 * @access  Private (Teacher)
 */
export const createLesson = async (req, res) => {
  try {
    const { chapterId, title, content, isPreview } = req.body;
    const userId = req.user.id;

    const chapter = await Chapter.findById(chapterId).populate("courseId");
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    if (String(chapter.courseId.teacherId) !== userId) {
      return res.status(403).json({ message: "Not authorized to add lesson" });
    }

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
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while creating lesson" });
  }
};

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update existing lesson (Teacher only)
 * @access  Private (Teacher)
 */
export const updateLesson = async (req, res) => {
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

    if (String(lesson.chapterId.courseId.teacherId) !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update lesson" });
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
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while updating lesson" });
  }
};

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete lesson + its media (Teacher only)
 * @access  Private (Teacher)
 */
export const deleteLesson = async (req, res) => {
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

    if (String(lesson.chapterId.courseId.teacherId) !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete lesson" });
    }

    const medias = await Media.find({ lessonId });

    for (const m of medias) {
      await deleteFile(m.filename, {
        resource_type: m.type === "video" ? "video" : "raw",
      });
    }

    await Media.deleteMany({ lessonId });
    await lesson.deleteOne();

    return res.status(200).json({ message: "Lesson deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while deleting lesson" });
  }
};

/**
 * @route   POST /api/lessons/:id/video
 * @desc    Upload lesson video (Teacher only)
 * @access  Private (Teacher)
 */
export const uploadLessonVideo = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No video file provided." });
    }

    const { lesson, error } = await validateLessonOwnership(lessonId, userId);
    if (error) return res.status(403).json({ message: error });

    const result = await uploadFile(req.file.path, { resource_type: "video" });

    await Media.create({
      lessonId,
      type: "video",
      url: result.secure_url,
      filename: result.public_id,
      size: req.file.size,
      uploadedBy: userId,
    });

    lesson.videoUrl = result.secure_url;
    lesson.duration = result.duration || 0;
    await lesson.save();

    fs.unlinkSync(req.file.path);

    return res.json({
      message: "Video uploaded successfully",
      videoUrl: result.secure_url,
      duration: result.duration,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while uploading video" });
  }
};

/**
 * @route   POST /api/lessons/:id/resource
 * @desc    Upload lesson resources (Teacher only)
 * @access  Private (Teacher)
 */
export const uploadLessonResource = async (req, res) => {
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

    return res.json({
      message: "Resources uploaded successfully",
      resources: uploaded,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while uploading resources" });
  }
};

/**
 * @route   DELETE /api/lessons/:id/resource/:resId
 * @desc    Delete resource file (Teacher only)
 * @access  Private (Teacher)
 */
export const deleteLessonResource = async (req, res) => {
  try {
    const { id: lessonId, resId } = req.params;
    const userId = req.user.id;

    const { lesson, error } = await validateLessonOwnership(lessonId, userId);
    if (error) return res.status(403).json({ message: error });

    const media = await Media.findOne({ _id: resId, lessonId });
    if (!media) {
      return res.status(404).json({ message: "Resource not found." });
    }

    await deleteFile(media.filename, { resource_type: "raw" });
    await media.deleteOne();

    return res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while deleting resource" });
  }
};

/**
 * @route   GET /api/lessons/:id
 * @desc    Get lesson detail (public) — include resources, video info
 * @access  Public (but may include user-specific flags if authenticated)
 */
export const getLessonDetail = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await Lesson.findById(lessonId).lean();

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const chapter = await Chapter.findById(lesson.chapterId);
    const courseId = chapter.courseId;

    let canView = false;

    if (req.user) {
      const profile = await UserProfile.findOne({ userId: req.user._id });
      const isEnrolled = profile?.enrolledCourses.includes(courseId);

      if (isEnrolled) canView = true;
    }

    if (!canView && !lesson.isPreview) {
      return res.status(403).json({
        message: "This lesson is locked. Please enroll the course to continue.",
      });
    }

    return res.json({
      success: true,
      data: lesson,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error when fetching lesson detail" });
  }
};
