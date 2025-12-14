import Analytics from "../models/analytics.model.js";
import Course from "../models/course.model.js";
import Progress from "../models/progress.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lesson.model.js";

/**
 * Calculate analytics data for a specific course on a specific date
 * @param {String} courseId - Course ID
 * @param {Date} date - Date for analytics
 * @returns {Object} Analytics data
 */
export const calculateCourseAnalytics = async (courseId, date) => {
  try {
    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Get total enrolled students
    const totalStudents = course.enrolledStudents?.length || 0;

    // Get active students (students who made progress in the last 7 days)
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeStudentsProgress = await Progress.distinct("userId", {
      courseId,
      lastWatchedAt: { $gte: sevenDaysAgo, $lte: date },
    });
    const activeStudents = activeStudentsProgress.length;

    // Get all chapters and lessons
    const chapters = await Chapter.find({ courseId });
    const chapterIds = chapters.map((ch) => ch._id);
    const totalLessons = await Lesson.countDocuments({
      chapterId: { $in: chapterIds },
    });

    // Get total completed lessons by all students
    const completedLessons = await Progress.countDocuments({
      courseId,
      isCompleted: true,
    });

    // Calculate completion rate
    let completionRate = 0;
    if (totalStudents > 0 && totalLessons > 0) {
      const totalPossibleCompletions = totalStudents * totalLessons;
      completionRate = (completedLessons / totalPossibleCompletions) * 100;
    }

    // Calculate average score (if quizzes exist, placeholder for now)
    const averageScore = 0;

    // Get total progress records
    const totalProgress = await Progress.countDocuments({ courseId });

    // Count new enrollments for the day
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Note: We need to track enrollment date in Course model or separate collection
    // For now, we'll use a placeholder
    const newEnrollments = 0;

    // Calculate average watch time
    const progressRecords = await Progress.find({ courseId });
    const totalWatchTime = progressRecords.reduce(
      (sum, p) => sum + (p.watchedDuration || 0),
      0
    );
    const averageWatchTime =
      progressRecords.length > 0 ? totalWatchTime / progressRecords.length : 0;

    return {
      courseId,
      date: startOfDay,
      totalStudents,
      activeStudents,
      completionRate: Math.round(completionRate * 100) / 100,
      averageScore,
      totalLessons,
      completedLessons,
      totalProgress,
      newEnrollments,
      totalViews: 0, // Placeholder
      averageWatchTime: Math.round(averageWatchTime),
    };
  } catch (error) {
    console.error("Calculate course analytics error:", error);
    throw error;
  }
};

/**
 * Collect and save analytics data for all courses
 * This should be run as a daily cron job
 * @param {Date} date - Date for analytics (defaults to yesterday)
 */
export const collectDailyAnalytics = async (date = null) => {
  try {
    // Default to yesterday
    const analyticsDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000);
    analyticsDate.setHours(0, 0, 0, 0);

    console.log(
      `📊 Collecting analytics for date: ${analyticsDate.toISOString()}`
    );

    // Get all published courses
    const courses = await Course.find({ isPublished: true });

    let successCount = 0;
    let errorCount = 0;

    for (const course of courses) {
      try {
        // Calculate analytics
        const analyticsData = await calculateCourseAnalytics(
          course._id,
          new Date(analyticsDate)
        );

        // Check if analytics already exists for this date
        const existingAnalytics = await Analytics.findOne({
          courseId: course._id,
          date: analyticsDate,
        });

        if (existingAnalytics) {
          // Update existing
          await Analytics.findByIdAndUpdate(
            existingAnalytics._id,
            analyticsData
          );
        } else {
          // Create new
          await Analytics.create(analyticsData);
        }

        successCount++;
      } catch (error) {
        console.error(
          `Error collecting analytics for course ${course._id}:`,
          error
        );
        errorCount++;
      }
    }

    console.log(
      `✅ Analytics collection completed: ${successCount} success, ${errorCount} errors`
    );

    return {
      success: true,
      date: analyticsDate,
      coursesProcessed: courses.length,
      successCount,
      errorCount,
    };
  } catch (error) {
    console.error("Collect daily analytics error:", error);
    throw error;
  }
};

/**
 * Get analytics trend data for a date range
 * @param {String} courseId - Course ID
 * @param {Number} days - Number of days (7, 30, etc.)
 * @returns {Object} Trend data
 */
export const getAnalyticsTrend = async (courseId, days = 7) => {
  try {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const analyticsData = await Analytics.find({
      courseId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    if (analyticsData.length === 0) {
      return {
        dates: [],
        totalStudents: [],
        activeStudents: [],
        completionRate: [],
        averageScore: [],
      };
    }

    // Extract trends
    const trend = {
      dates: analyticsData.map((a) => a.date),
      totalStudents: analyticsData.map((a) => a.totalStudents),
      activeStudents: analyticsData.map((a) => a.activeStudents),
      completionRate: analyticsData.map((a) => a.completionRate),
      averageScore: analyticsData.map((a) => a.averageScore),
      completedLessons: analyticsData.map((a) => a.completedLessons),
    };

    return trend;
  } catch (error) {
    console.error("Get analytics trend error:", error);
    throw error;
  }
};

/**
 * Calculate growth metrics
 * @param {String} courseId - Course ID
 * @param {Number} days - Number of days to compare
 * @returns {Object} Growth metrics
 */
export const calculateGrowthMetrics = async (courseId, days = 7) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const previousDate = new Date(today);
    previousDate.setDate(previousDate.getDate() - days);

    // Get current and previous analytics
    const currentAnalytics = await Analytics.findOne({
      courseId,
      date: { $lte: today },
    }).sort({ date: -1 });

    const previousAnalytics = await Analytics.findOne({
      courseId,
      date: { $lte: previousDate },
    }).sort({ date: -1 });

    if (!currentAnalytics || !previousAnalytics) {
      return {
        studentsGrowth: 0,
        activeStudentsGrowth: 0,
        completionRateGrowth: 0,
      };
    }

    // Calculate growth percentages
    const studentsGrowth =
      previousAnalytics.totalStudents > 0
        ? ((currentAnalytics.totalStudents - previousAnalytics.totalStudents) /
            previousAnalytics.totalStudents) *
          100
        : 0;

    const activeStudentsGrowth =
      previousAnalytics.activeStudents > 0
        ? ((currentAnalytics.activeStudents -
            previousAnalytics.activeStudents) /
            previousAnalytics.activeStudents) *
          100
        : 0;

    const completionRateGrowth =
      previousAnalytics.completionRate > 0
        ? ((currentAnalytics.completionRate -
            previousAnalytics.completionRate) /
            previousAnalytics.completionRate) *
          100
        : 0;

    return {
      studentsGrowth: Math.round(studentsGrowth * 100) / 100,
      activeStudentsGrowth: Math.round(activeStudentsGrowth * 100) / 100,
      completionRateGrowth: Math.round(completionRateGrowth * 100) / 100,
    };
  } catch (error) {
    console.error("Calculate growth metrics error:", error);
    throw error;
  }
};

/**
 * Get student learning statistics
 * @param {String} userId - User ID
 * @returns {Object} Student statistics
 */
export const getStudentStatistics = async (userId) => {
  try {
    // Get enrolled courses
    const enrolledCourses = await Course.find({
      enrolledStudents: userId,
    });

    const totalCourses = enrolledCourses.length;

    // Get progress data
    const progressData = await Progress.find({ userId });

    const totalLessonsWatched = progressData.length;
    const completedLessons = progressData.filter((p) => p.isCompleted).length;

    // Calculate total time spent
    const totalTimeSpent = progressData.reduce(
      (sum, p) => sum + (p.watchedDuration || 0),
      0
    );

    // Calculate course completion
    const courseProgress = await Promise.all(
      enrolledCourses.map(async (course) => {
        const chapters = await Chapter.find({ courseId: course._id });
        const chapterIds = chapters.map((ch) => ch._id);
        const totalLessons = await Lesson.countDocuments({
          chapterId: { $in: chapterIds },
        });

        const completedInCourse = await Progress.countDocuments({
          userId,
          courseId: course._id,
          isCompleted: true,
        });

        const percentage =
          totalLessons > 0
            ? Math.round((completedInCourse / totalLessons) * 100)
            : 0;

        return {
          courseId: course._id,
          courseName: course.title,
          totalLessons,
          completedLessons: completedInCourse,
          percentage,
        };
      })
    );

    // Calculate average completion
    const averageCompletion =
      courseProgress.length > 0
        ? courseProgress.reduce((sum, c) => sum + c.percentage, 0) /
          courseProgress.length
        : 0;

    // Get quiz scores (placeholder)
    const quizScores = [];
    const averageQuizScore = 0;

    return {
      totalCourses,
      totalLessonsWatched,
      completedLessons,
      totalTimeSpent: Math.round(totalTimeSpent),
      averageCompletion: Math.round(averageCompletion * 100) / 100,
      courseProgress,
      quizScores,
      averageQuizScore,
      lastActivity:
        progressData.length > 0
          ? progressData.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)[0]
              .lastWatchedAt
          : null,
    };
  } catch (error) {
    console.error("Get student statistics error:", error);
    throw error;
  }
};

/**
 * Get dashboard summary for teacher
 * @param {String} teacherId - Teacher ID
 * @returns {Object} Dashboard summary
 */
export const getTeacherDashboard = async (teacherId) => {
  try {
    // Get all courses by teacher
    const courses = await Course.find({ teacherId });

    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.isPublished).length;

    // Calculate total students
    const totalStudents = courses.reduce(
      (sum, c) => sum + (c.enrolledStudents?.length || 0),
      0
    );

    // Get average rating
    const coursesWithRating = courses.filter((c) => c.rating > 0);
    const averageRating =
      coursesWithRating.length > 0
        ? coursesWithRating.reduce((sum, c) => sum + c.rating, 0) /
          coursesWithRating.length
        : 0;

    // Get latest analytics for each course
    const courseAnalytics = await Promise.all(
      courses.map(async (course) => {
        const latestAnalytics = await Analytics.findOne({
          courseId: course._id,
        }).sort({ date: -1 });

        return {
          courseId: course._id,
          courseName: course.title,
          students: course.enrolledStudents?.length || 0,
          rating: course.rating,
          completionRate: latestAnalytics?.completionRate || 0,
          activeStudents: latestAnalytics?.activeStudents || 0,
        };
      })
    );

    // Sort by students
    const topCourses = [...courseAnalytics]
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    return {
      totalCourses,
      publishedCourses,
      totalStudents,
      averageRating: Math.round(averageRating * 100) / 100,
      courseAnalytics,
      topCourses,
      pendingQuizzes: 0, // Placeholder - implement if needed
      newDiscussions: 0, // Placeholder - implement if needed
      recentActivities: [], // Placeholder - implement if needed
    };
  } catch (error) {
    console.error("Get teacher dashboard error:", error);
    throw error;
  }
};

/**
 * Get platform-wide statistics for admin
 * @returns {Object} Platform statistics
 */
export const getPlatformStatistics = async () => {
  try {
    // Get total counts
    const totalCourses = await Course.countDocuments({ isPublished: true });
    const totalTeachers = await Course.distinct("teacherId");

    // Get all courses
    const courses = await Course.find({ isPublished: true });
    const totalStudents = courses.reduce(
      (sum, c) => sum + (c.enrolledStudents?.length || 0),
      0
    );

    // Get latest analytics
    const latestDate = new Date();
    latestDate.setHours(0, 0, 0, 0);

    const latestAnalytics = await Analytics.find({
      date: { $lte: latestDate },
    }).sort({ date: -1 });

    // Calculate platform averages
    const averageCompletionRate =
      latestAnalytics.length > 0
        ? latestAnalytics.reduce((sum, a) => sum + a.completionRate, 0) /
          latestAnalytics.length
        : 0;

    // Top courses by students
    const topCourses = courses
      .sort(
        (a, b) =>
          (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0)
      )
      .slice(0, 10)
      .map((c) => ({
        courseId: c._id,
        title: c.title,
        students: c.enrolledStudents?.length || 0,
        rating: c.rating,
      }));

    return {
      totalCourses,
      totalTeachers: totalTeachers.length,
      totalStudents,
      averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
      topCourses,
    };
  } catch (error) {
    console.error("Get platform statistics error:", error);
    throw error;
  }
};
