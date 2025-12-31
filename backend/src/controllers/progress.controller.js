import Progress from "../models/progress.model.js";
import Lesson from "../models/lesson.model.js";
import User from "../models/user.model.js";
import Chapter from "../models/chapter.model.js";
import Notification from "../models/notification.model.js";
import Course from "../models/course.model.js";

/**
 * @route   PUT /api/progress/lesson/:lessonId
 * @desc    Update watchedDuration and lastWatchedAt for a lesson (Student)
 * @access  Private (Student)
 */
export const updateLessonProgress = async (req, res) => {
  try {
    const { watchedDuration, markCompleted } = req.body;
    const lessonId = req.params.lessonId;
    const userId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Lấy course bằng chapter
    const chapter = await Chapter.findById(lesson.chapterId);
    const courseId = chapter.courseId;

    // Check enrolled
    const user = await User.findById(userId);
    const isEnrolled = user?.enrolledCourses?.some(
      (enrolledCourse) => enrolledCourse.toString() === courseId.toString()
    );
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course" });
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
    return res
      .status(500)
      .json({ message: "Server error when updating progress" });
  }
};

/**
 * @route   GET /api/progress/lesson/:lessonId
 * @desc    Get progress for a specific lesson
 * @access  Private (Student)
 */
export const getLessonProgress = async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const userId = req.user.id;

    const progress = await Progress.findOne({ userId, lessonId }).lean();

    return res.json({
      success: true,
      progress: progress || { isCompleted: false, watchedDuration: 0 },
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error when fetching progress" });
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
    const userId = req.user.id;

    console.log('🔘 Mark Lesson Complete Request:', {
      lessonId,
      userId,
      userIdType: typeof userId
    });

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
      console.log('❌ Lesson not found:', lessonId);
      return res.status(404).json({ message: "Lesson not found" });
    }

    const chapter = await Chapter.findById(lesson.chapterId);
    if (!chapter) {
      console.log('❌ Chapter not found:', lesson.chapterId);
      return res.status(404).json({ message: "Chapter not found" });
    }
    
    const courseId = chapter.courseId;
    console.log('📚 Course ID:', courseId.toString());

    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    const isEnrolled = user?.enrolledCourses?.some(
      (enrolledCourse) => enrolledCourse.toString() === courseId.toString()
    );

    console.log('🎓 Enrollment check:', {
      isEnrolled,
      userCourses: user.enrolledCourses?.map(c => c.toString()),
      targetCourse: courseId.toString()
    });

    if (!isEnrolled)
      return res
        .status(403)
        .json({ message: "You are not enrolled in this course" });

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

    console.log('✅ Marked lesson as completed:', {
      lessonId,
      userId,
      courseId: courseId.toString()
    });

    // Count all lessons in course (not just chapter)
    const allChapters = await Chapter.find({ courseId });
    const allChapterIds = allChapters.map(c => c._id);
    const allLessons = await Lesson.find({ chapterId: { $in: allChapterIds } });
    const totalLessons = allLessons.length;
    
    const completedCount = await Progress.countDocuments({
      userId,
      isCompleted: true,
      courseId,
    });

    console.log('📊 Progress Count:', {
      completedCount,
      totalLessons,
      percentage: Math.round((completedCount / totalLessons) * 100)
    });

    const isCourseCompleted = completedCount === totalLessons;

    // Create notification for lesson completion
    const course = await Course.findById(courseId);
    
    await Notification.create({
      userId,
      type: 'progress',
      title: 'Lesson Completed!',
      content: `You completed "${lesson.title}" in ${course?.title}. Progress: ${completedCount}/${totalLessons} lessons`,
      link: `/courses/${courseId}/lessons/${lessonId}`,
      isRead: false,
    });

    // If Course is fully completed (100%), notify the Teacher
    if (isCourseCompleted && course.teacherId) {
        try {
            await Notification.create({
                userId: course.teacherId,
                type: 'course',
                title: 'Student Completed Course',
                content: `${user.fullName} has completed 100% of your course "${course.title}"`,
                link: `/courses/${courseId}/analytics`,
                isRead: false,
            });
            
             // Real-time socket for teacher
            if (req.io) {
                 req.io.of("/notification").to(course.teacherId.toString()).emit("notification:new", {
                    type: 'course',
                    title: 'Student Completed Course',
                    message: `${user.fullName} has completed 100% of your course "${course.title}"`,
                 });
            }
        } catch (errNotify) {
            console.error('Failed to notify teacher of course completion:', errNotify);
        }
    }

    // Emit notification via socket (if available)
    if (req.io) {
      try {
        req.io.of("/notification").to(userId.toString()).emit("notification:new", {
          type: 'progress',
          title: 'Lesson Completed!',
          message: `Progress: ${completedCount}/${totalLessons} lessons`,
        });

        // Emit socket
        req.io.of("/progress").emit("progress:updated", {
          userId,
          lessonId,
          progress,
          courseCompleted: isCourseCompleted,
          completedCount,
          totalLessons,
        });
      } catch (socketErr) {
        console.error('Socket emit error:', socketErr);
      }
    }

    return res.json({
      message: "Lesson marked as completed",
      isCourseCompleted,
      completedCount,
      totalLessons,
    });
  } catch (err) {
    console.error('❌ Error marking lesson completed:', err);
    console.error('Stack:', err.stack);
    return res
      .status(500)
      .json({ 
        message: "Server error when marking completed",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
  }
};

/**
 * @route   GET /api/progress/dashboard-stats
 * @desc    Get dashboard statistics for student (total courses passed/failed, lessons, avg progress)
 * @access  Private (Student)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's enrolled courses
    const user = await User.findById(userId).select('enrolledCourses');
    if (!user || !user.enrolledCourses || user.enrolledCourses.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCourses: 0,
          coursePassed: 0,
          courseFailed: 0,
          totalLessonsCompleted: 0,
          averageProgress: 0
        }
      });
    }

    const enrolledCourseIds = user.enrolledCourses;

    // Get all courses with their lessons
    const coursesStats = await Promise.all(
      enrolledCourseIds.map(async (courseId) => {
        // Get all chapters for this course
        const chapters = await Chapter.find({ courseId }).select('_id');
        const chapterIds = chapters.map(c => c._id);

        // Get all lessons
        const totalLessons = await Lesson.countDocuments({ 
          chapterId: { $in: chapterIds } 
        });

        // Get completed lessons
        const completedLessons = await Progress.countDocuments({
          userId,
          courseId,
          isCompleted: true
        });

        const progressPercentage = totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0;

        // Consider passed if >= 80% completion
        const isPassed = progressPercentage >= 80;

        return {
          courseId,
          totalLessons,
          completedLessons,
          progressPercentage,
          isPassed
        };
      })
    );

    // Calculate statistics
    const totalCourses = coursesStats.length;
    const coursePassed = coursesStats.filter(c => c.isPassed).length;
    const courseFailed = totalCourses - coursePassed;
    const totalLessonsCompleted = coursesStats.reduce((sum, c) => sum + c.completedLessons, 0);
    const averageProgress = totalCourses > 0
      ? Math.round(coursesStats.reduce((sum, c) => sum + c.progressPercentage, 0) / totalCourses)
      : 0;

    return res.json({
      success: true,
      data: {
        totalCourses,
        coursePassed,
        courseFailed,
        totalLessonsCompleted,
        averageProgress,
        courseDetails: coursesStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error when fetching dashboard stats',
      error: error.message
    });
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
    const userId = req.user.id;

    const chapters = await Chapter.find({ courseId }).select("_id");
    const chapterIds = chapters.map((c) => c._id);

    const lessons = await Lesson.find({ chapterId: { $in: chapterIds } });

    const totalLessons = lessons.length;

    const completedProgress = await Progress.find({
      userId,
      courseId,
      isCompleted: true,
    });

    const completedCount = completedProgress.length;

    const progressPercentage = Math.round(
      (completedCount / totalLessons) * 100
    );

    // Get all progress records for lesson-level details
    const allProgress = await Progress.find({ userId, courseId });

    const lessonProgress = lessons.map((lesson) => {
      const prog = allProgress.find(
        (p) => p.lessonId.toString() === lesson._id.toString()
      );
      return {
        lessonId: lesson._id,
        watchedDuration: prog?.watchedDuration || 0,
        lastWatchedAt: prog?.lastWatchedAt || null,
        completed: prog?.isCompleted || false,
        progressPercentage: prog
          ? Math.round(
              (prog.watchedDuration / (lesson.videoDuration || 1)) * 100
            )
          : 0,
      };
    });

    return res.json({
      totalLessons,
      completedLessons: completedCount,
      progressPercentage,
      lessonProgress,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Server error when getting course progress" });
  }
};
