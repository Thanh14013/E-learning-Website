import Course from "../models/course.model.js";
import { deleteFile, uploadFile } from "../config/cloudinary.config.js";
import fs from "fs";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lesson.model.js";
import Progress from "../models/progress.model.js";
import User from "../models/user.model.js";
import { notifyEnrollment } from "../services/notification.service.js";

/**
 * @route   POST /api/courses
 * @desc    Create new course (teacher only)
 * @access  Private (Teacher/Admin)
 */
export const createCourse = async (req, res) => {
  try {
    const { title, description, category, level } = req.body;
    const teacherId = req.user.id;

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only teachers can create courses.",
      });
    }

    const newCourse = await Course.create({
      title,
      description,
      category,
      level: level.toLowerCase(),
      teacherId,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating course",
    });
  }
};

/**
 * @route   POST /api/courses/:id/thumbnail
 * @desc    Upload or replace course thumbnail
 * @access  Private (Teacher/Admin)
 */
export const uploadCourseThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check course ownership
    if (
      course.teacherId.toString() !== teacherId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    // Check file existence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    // Upload to Cloudinary
    const filePath = req.file.path;
    const secureUrl = await uploadFile(filePath, {
      folder: "courses",
      resource_type: "image",
    });

    // Remove local file after upload
    fs.unlinkSync(filePath);

    // Update course thumbnail
    course.thumbnail = secureUrl;
    await course.save();

    return res.status(200).json({
      success: true,
      message: "Thumbnail uploaded successfully",
      data: { thumbnail: secureUrl },
    });
  } catch (error) {
    console.error("Upload thumbnail error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading thumbnail",
    });
  }
};

/**
 * @route  GET /api/courses
 * @desc   Get all courses (Public)
 * @access Public
 */
export const getAllCourses = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level.toLowerCase();
    if (req.query.teacher) filter.teacherId = req.query.teacher;
    if (req.query.isPublished !== undefined)
      filter.isPublished = req.query.isPublished === "true";

    // Text search (title/description)
    if (req.query.q) {
      filter.$text = { $search: req.query.q };
    }

    // Sorting
    let sort = { createdAt: -1 }; // default newest first
    if (req.query.sortBy === "rating") sort = { rating: -1 };
    else if (req.query.sortBy === "createdAt") sort = { createdAt: -1 };

    // Query with population
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("teacherId", "fullName email")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: courses,
    });
  } catch (error) {
    console.error("Get all courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
    });
  }
};

/**
 * @route  GET /api/courses/:id
 * @desc   Get course detail (Public)
 * @access Public
 */
export const getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // Fetch course + teacher
    const course = await Course.findById(id)
      .populate("teacherId", "fullName email role")
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Fetch chapters + lessons
    const chapters = await Chapter.find({ courseId: id })
      .sort({ order: 1 })
      .lean();

    const chapterIds = chapters.map((ch) => ch._id);
    const lessons = await Lesson.find({ chapterId: { $in: chapterIds } })
      .sort({ order: 1 })
      .lean();

    // Build structure
    const structuredChapters = chapters.map((chapter) => ({
      ...chapter,
      lessons: lessons
        .filter(
          (lesson) => lesson.chapterId.toString() === chapter._id.toString()
        )
        .map((l) => ({
          _id: l._id,
          title: l.title,
          videoUrl: l.isPreview ? l.videoUrl : undefined,
          content: l.isPreview ? l.content : undefined,
          isPreview: l.isPreview,
          order: l.order,
        })),
    }));

    // Check enrollment
    const isEnrolled = userId
      ? course.enrolledStudents?.some(
          (id) => id.toString() === userId.toString()
        )
      : false;

    // If not enrolled → show only preview lessons
    if (!isEnrolled) {
      structuredChapters.forEach((ch) => {
        ch.lessons = ch.lessons.filter((l) => l.isPreview);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course detail fetched successfully",
      data: {
        ...course,
        isEnrolled,
        chapters: structuredChapters,
      },
    });
  } catch (error) {
    console.error("Get course detail error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching course detail",
    });
  }
};

/**
 * @route  PUT /api/courses/:id
 * @desc   Update Course
 * @access Private (teacher/admin + owner)
 */
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Ownership check
    if (course.teacherId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    // Fields allowed to update
    const allowedFields = ["title", "description", "category", "level"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        // normalize level
        if (field === "level") {
          course[field] = req.body[field].toLowerCase();
        } else {
          course[field] = req.body[field];
        }
      }
    });

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating course",
    });
  }
};

/**
 * @route  PUT /api/courses/:id/publish
 * @desc   Publish or Unpublish a Course
 * @access Private (teacher/admin BUT must be owner)
 */
export const togglePublishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ownership check (admin override)
    if (course.teacherId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    // check if course ready for publish (only if publishing → true)
    const nextState = !course.isPublished;

    if (nextState === true) {
      const chapters = await Chapter.find({ courseId: id });

      if (!chapters.length) {
        return res.status(400).json({
          success: false,
          message: "Course must have at least 1 chapter before publishing.",
        });
      }

      const chapterIds = chapters.map((c) => c._id);
      const lessons = await Lesson.find({ chapterId: { $in: chapterIds } });

      if (!lessons.length) {
        return res.status(400).json({
          success: false,
          message: "Course must have at least 1 lesson before publishing.",
        });
      }
    }

    // toggle publish status
    course.isPublished = nextState;
    await course.save();

    return res.status(200).json({
      success: true,
      message: nextState
        ? "Course published successfully"
        : "Course unpublished successfully",
      data: course,
    });
  } catch (error) {
    console.error("Publish course error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while publishing course",
    });
  }
};

/**
 * Delete Course (teacher owner or admin)
 *
 * @route DELETE /api/courses/:id
 * @access Private
 */
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // ownership check (admin override)
    if (course.teacherId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    if (course.thumbnail) {
      const fileName = course.thumbnail.split("/").pop().split(".")[0];
      await deleteFile(`courses/${fileName}`);
    }

    const chapters = await Chapter.find({ courseId: id });
    const chapterIds = chapters.map((c) => c._id);

    const lessons = await Lesson.find({ chapterId: { $in: chapterIds } });

    // delete lesson videos on Cloudinary
    for (const lesson of lessons) {
      if (lesson.videoUrl) {
        const fileName = lesson.videoUrl.split("/").pop().split(".")[0];
        await deleteFile(`lessons/${fileName}`, { resource_type: "video" });
      }
    }

    await Progress.deleteMany({ courseId: id });
    await Lesson.deleteMany({ chapterId: { $in: chapterIds } });
    await Chapter.deleteMany({ courseId: id });
    await Course.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Course and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting course",
    });
  }
};

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in a course
 * @access  Private (Student)
 */
export const enrollCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if course is published
    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Cannot enroll in unpublished course",
      });
    }

    // Check if already enrolled
    const isAlreadyEnrolled = course.enrolledStudents.some(
      (id) => id.toString() === studentId
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Add student to enrolled list
    course.enrolledStudents.push(studentId);
    await course.save();

    // Get student and teacher info for notification
    const student = await User.findById(studentId);
    const teacher = await User.findById(course.teacherId);

    // Send enrollment notification
    if (student && teacher) {
      await notifyEnrollment(
        studentId,
        student,
        course.teacherId.toString(),
        teacher,
        course
      );
    }

    return res.status(200).json({
      success: true,
      message: "Successfully enrolled in course",
      data: course,
    });
  } catch (error) {
    console.error("Enroll course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while enrolling in course",
    });
  }
};

/**
 * @route   DELETE /api/courses/:id/unenroll
 * @desc    Unenroll from a course
 * @access  Private (Student)
 */
export const unenrollCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if enrolled
    const enrollmentIndex = course.enrolledStudents.findIndex(
      (id) => id.toString() === studentId
    );

    if (enrollmentIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Remove student from enrolled list
    course.enrolledStudents.splice(enrollmentIndex, 1);
    await course.save();

    // Delete associated progress records
    await Progress.deleteMany({
      userId: studentId,
      courseId,
    });

    return res.status(200).json({
      success: true,
      message: "Successfully unenrolled from course",
    });
  } catch (error) {
    console.error("Unenroll course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while unenrolling from course",
    });
  }
};

/**
 * @route   GET /api/courses/enrolled
 * @desc    Get enrolled courses for current user
 * @access  Private (Student)
 */
export const getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find courses where student is enrolled
    const courses = await Course.find({
      enrolledStudents: studentId,
    })
      .populate("teacherId", "fullName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        // Get all chapters and lessons for this course
        const chapters = await Chapter.find({ courseId: course._id });
        const chapterIds = chapters.map((c) => c._id);
        const totalLessons = await Lesson.countDocuments({
          chapterId: { $in: chapterIds },
        });

        // Get completed lessons
        const completedLessons = await Progress.countDocuments({
          userId: studentId,
          courseId: course._id,
          isCompleted: true,
        });

        // Calculate progress percentage
        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          ...course,
          progress: {
            totalLessons,
            completedLessons,
            percentage: progressPercentage,
          },
        };
      })
    );

    // Get total count
    const total = await Course.countDocuments({
      enrolledStudents: studentId,
    });

    return res.status(200).json({
      success: true,
      data: coursesWithProgress,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get enrolled courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching enrolled courses",
    });
  }
};

/**
 * @route   GET /api/courses/my-courses
 * @desc    Get courses created by current teacher
 * @access  Private (Teacher)
 */
export const getMyCourses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only teachers can access this endpoint.",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find courses created by teacher
    const courses = await Course.find({ teacherId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add student count and rating for each course
    const coursesWithStats = courses.map((course) => ({
      ...course,
      studentCount: course.enrolledStudents?.length || 0,
    }));

    // Get total count
    const total = await Course.countDocuments({ teacherId });

    return res.status(200).json({
      success: true,
      data: coursesWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get my courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching my courses",
    });
  }
};

/**
 * @route   GET /api/courses/:id/students
 * @desc    Get list of enrolled students for a course
 * @access  Private (Teacher - owner only)
 */
export const getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.id;
    const teacherId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check ownership
    if (
      course.teacherId.toString() !== teacherId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get enrolled students
    const studentIds = course.enrolledStudents;
    const students = await User.find({
      _id: { $in: studentIds },
    })
      .select("fullName email avatar createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get progress for each student
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        // Get all chapters and lessons for this course
        const chapters = await Chapter.find({ courseId });
        const chapterIds = chapters.map((c) => c._id);
        const totalLessons = await Lesson.countDocuments({
          chapterId: { $in: chapterIds },
        });

        // Get completed lessons
        const completedLessons = await Progress.countDocuments({
          userId: student._id,
          courseId,
          isCompleted: true,
        });

        // Calculate progress percentage
        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          ...student,
          progress: {
            totalLessons,
            completedLessons,
            percentage: progressPercentage,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: studentsWithProgress,
      pagination: {
        total: studentIds.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(studentIds.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get course students error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching course students",
    });
  }
};

/**
 * @route POST /api/courses/:id/review
 * @desc Add review to course (student only)
 * @access Private
 */
export const reviewCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.user.id;
        const { rating, comment } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        // must be enrolled
        if (!course.enrolledStudents.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: "You must enroll in this course before leaving a review.",
            });
        }

        // must complete at least 1 lesson
        const progress = await Progress.find({
            userId,
            courseId,
            completed: true,
        });

        if (progress.length === 0) {
            return res.status(400).json({
                success: false,
                message: "You must complete a lesson before reviewing this course.",
            });
        }

        // prevent duplicate review
        const hasReviewed = course.reviews.some(
            (r) => r.userId.toString() === userId
        );

        if (hasReviewed) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this course.",
            });
        }

        // add review
        course.reviews.push({
            userId,
            rating,
            comment,
            createdAt: new Date(),
        });

        // recalculate rating
        course.totalReviews = course.reviews.length;
        course.rating =
            course.reviews.reduce((sum, r) => sum + r.rating, 0) /
            course.totalReviews;

        await course.save();

        return res.status(201).json({
            success: true,
            message: "Review added successfully.",
            rating: course.rating,
            totalReviews: course.totalReviews,
        });
    } catch (error) {
        console.error("Review course error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while reviewing course.",
        });
    }
};