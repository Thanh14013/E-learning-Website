import Course from "../models/course.model.js";
import Analytics from "../models/analytics.model.js";
import Progress from "../models/progress.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lesson.model.js";
import {
  calculateCourseAnalytics,
  getAnalyticsTrend,
  calculateGrowthMetrics,
  getStudentStatistics,
  getTeacherDashboard,
  getPlatformStatistics,
} from "../services/analytics.service.js";
import { Parser } from "json2csv";

/**
 * @route   GET /api/analytics/course/:courseId
 * @desc    Get analytics data for a course
 * @access  Private (Teacher - owner only)
 */
export const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { days = 7 } = req.query;

    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check ownership
    if (course.teacherId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    // Get latest analytics
    const latestAnalytics = await Analytics.findOne({ courseId }).sort({
      date: -1,
    });

    // If no analytics exist, calculate now
    let currentData;
    if (!latestAnalytics) {
      currentData = await calculateCourseAnalytics(courseId, new Date());
    } else {
      currentData = latestAnalytics;
    }

    // Get trend data
    const trendData = await getAnalyticsTrend(courseId, parseInt(days));

    // Get growth metrics
    const growthMetrics = await calculateGrowthMetrics(
      courseId,
      parseInt(days)
    );

    return res.status(200).json({
      success: true,
      message: "Course analytics fetched successfully",
      data: {
        current: currentData,
        trend: trendData,
        growth: growthMetrics,
      },
    });
  } catch (error) {
    console.error("Get course analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics",
    });
  }
};

/**
 * @route   GET /api/analytics/student/:userId
 * @desc    Get student analytics and learning statistics
 * @access  Private (Student/Teacher/Admin)
 */
export const getStudentAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;

    // Students can only view their own analytics
    // Teachers and admins can view any student
    if (
      userId !== requesterId &&
      req.user.role !== "teacher" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own analytics.",
      });
    }

    // Get student statistics
    const statistics = await getStudentStatistics(userId);

    return res.status(200).json({
      success: true,
      message: "Student analytics fetched successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Get student analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching student analytics",
    });
  }
};

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard analytics summary
 * @access  Private (Teacher/Admin)
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== "teacher" && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only teachers and admins can access dashboard.",
      });
    }

    let dashboardData;

    if (userRole === "admin") {
      // Get platform-wide statistics for admin
      dashboardData = await getPlatformStatistics();
    } else {
      // Get teacher-specific dashboard
      dashboardData = await getTeacherDashboard(userId);
    }

    return res.status(200).json({
      success: true,
      message: "Dashboard analytics fetched successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Get dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard analytics",
    });
  }
};

/**
 * @route   GET /api/analytics/export
 * @desc    Export course analytics to CSV
 * @access  Private (Teacher - owner only)
 */
export const exportCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.query;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    // Find course
    const course = await Course.findById(courseId).populate(
      "teacherId",
      "fullName email"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check ownership
    if (
      course.teacherId._id.toString() !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    // Get enrolled students with progress
    const studentIds = course.enrolledStudents;

    // Get all chapters and lessons
    const chapters = await Chapter.find({ courseId }).sort({ order: 1 });
    const chapterIds = chapters.map((ch) => ch._id);
    const lessons = await Lesson.find({ chapterId: { $in: chapterIds } }).sort({
      order: 1,
    });

    const totalLessons = lessons.length;

    // Get detailed data for each student
    const studentsData = await Promise.all(
      studentIds.map(async (studentId) => {
        const user = await User.findById(studentId).select(
          "fullName email createdAt"
        );

        if (!user) return null;

        // Get progress
        const completedLessons = await Progress.countDocuments({
          userId: studentId,
          courseId,
          isCompleted: true,
        });

        const progressRecords = await Progress.find({
          userId: studentId,
          courseId,
        });

        const totalWatchTime = progressRecords.reduce(
          (sum, p) => sum + (p.watchedDuration || 0),
          0
        );

        const completionPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Get last activity
        const lastProgress = await Progress.findOne({
          userId: studentId,
          courseId,
        })
          .sort({ lastWatchedAt: -1 })
          .select("lastWatchedAt");

        return {
          "Student Name": user.fullName,
          Email: user.email,
          "Enrollment Date": user.createdAt.toISOString().split("T")[0],
          "Total Lessons": totalLessons,
          "Completed Lessons": completedLessons,
          "Completion %": completionPercentage,
          "Total Watch Time (minutes)": Math.round(totalWatchTime / 60),
          "Last Activity": lastProgress?.lastWatchedAt
            ? lastProgress.lastWatchedAt.toISOString().split("T")[0]
            : "N/A",
        };
      })
    );

    // Filter out null values
    const filteredData = studentsData.filter((data) => data !== null);

    if (filteredData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No student data to export",
        data: [],
      });
    }

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(filteredData);

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="course-${courseId}-analytics.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export course analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while exporting analytics",
    });
  }
};

/**
 * @route   GET /api/analytics/student-report/:userId
 * @desc    Generate comprehensive student report
 * @access  Private (Teacher/Admin or own student)
 */
export const generateStudentReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;

    // Check permissions
    if (
      userId !== requesterId &&
      req.user.role !== "teacher" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    // Get user info
    const user = await User.findById(userId).select(
      "fullName email avatar createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get enrolled courses with detailed progress
    const enrolledCourses = await Course.find({
      enrolledStudents: userId,
    }).populate("teacherId", "fullName");

    const courseReports = await Promise.all(
      enrolledCourses.map(async (course) => {
        // Get chapters and lessons
        const chapters = await Chapter.find({ courseId: course._id });
        const chapterIds = chapters.map((ch) => ch._id);
        const totalLessons = await Lesson.countDocuments({
          chapterId: { $in: chapterIds },
        });

        // Get progress
        const completedLessons = await Progress.countDocuments({
          userId,
          courseId: course._id,
          isCompleted: true,
        });

        const progressRecords = await Progress.find({
          userId,
          courseId: course._id,
        });

        const totalWatchTime = progressRecords.reduce(
          (sum, p) => sum + (p.watchedDuration || 0),
          0
        );

        const completionPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        // Get last activity
        const lastActivity =
          progressRecords.length > 0
            ? progressRecords.sort(
                (a, b) => b.lastWatchedAt - a.lastWatchedAt
              )[0].lastWatchedAt
            : null;

        return {
          courseId: course._id,
          courseName: course.title,
          teacher: course.teacherId.fullName,
          category: course.category,
          level: course.level,
          totalLessons,
          completedLessons,
          completionPercentage,
          totalWatchTime: Math.round(totalWatchTime / 60), // in minutes
          lastActivity,
        };
      })
    );

    // Calculate overall statistics
    const totalCourses = enrolledCourses.length;
    const completedCourses = courseReports.filter(
      (c) => c.completionPercentage === 100
    ).length;
    const totalWatchTime = courseReports.reduce(
      (sum, c) => sum + c.totalWatchTime,
      0
    );
    const averageCompletion =
      courseReports.length > 0
        ? courseReports.reduce((sum, c) => sum + c.completionPercentage, 0) /
          courseReports.length
        : 0;

    const report = {
      student: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        avatar: user.avatar,
        memberSince: user.createdAt,
      },
      summary: {
        totalCourses,
        completedCourses,
        inProgressCourses: totalCourses - completedCourses,
        totalWatchTime,
        averageCompletion: Math.round(averageCompletion * 100) / 100,
      },
      courses: courseReports,
      generatedAt: new Date(),
    };

    return res.status(200).json({
      success: true,
      message: "Student report generated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Generate student report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while generating student report",
    });
  }
};

// Import User model (add at top of file)
import User from "../models/user.model.js";
import { triggerAnalyticsCollection } from "../services/cron.service.js";

/**
 * @route   POST /api/analytics/collect
 * @desc    Manually trigger analytics collection (Admin only)
 * @access  Private (Admin)
 */
export const manualCollectAnalytics = async (req, res) => {
  try {
    const { date } = req.body;

    // Parse date if provided
    const collectionDate = date ? new Date(date) : null;

    // Trigger collection
    const result = await triggerAnalyticsCollection(collectionDate);

    return res.status(200).json({
      success: true,
      message: "Analytics collection triggered successfully",
      data: result,
    });
  } catch (error) {
    console.error("Manual collect analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while collecting analytics",
    });
  }
};
