import Analytics from "../models/analytics.model.js";
import Course from "../models/course.model.js";
import Progress from "../models/progress.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lesson.model.js";
import Discussion from "../models/discussion.model.js";
import QuizAttempt from "../models/quizAttempt.model.js";

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

    // Get active students (students who completed at least 1 quiz in the last 7 days)
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Use QuizAttempt instead of Progress
    const activeStudentsList = await QuizAttempt.distinct("userId", {
        // We need to find quizzes belonging to this course first
        // But QuizAttempt has quizId, not courseId directly. 
        // We can filter by quizId where quiz belongs to course.
        // Optimization: Find all quizIds for this course first.
    });
    
    // Allow me to query efficiently. 
    // Optimization: QuizAttempt doesn't have courseId. Quiz has courseId.
    // So: Find quizzes for course -> Find attempts for those quizzes.
    const courseQuizIds = await (await import("../models/quiz.model.js")).default.distinct("_id", { courseId });
    
    const activeStudentsCount = await QuizAttempt.distinct("userId", {
      quizId: { $in: courseQuizIds },
      updatedAt: { $gte: sevenDaysAgo, $lte: date } // updatedAt implies "completed" or "attempted" recently
    });
    
    const activeStudents = activeStudentsCount.length;

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
/**
 * Get analytics trend data for a date range (Dynamic Calculation)
 * @param {String} courseId - Course ID
 * @param {Number} days - Number of days (7, 30, etc.)
 * @returns {Object} Trend data
 */
export const getAnalyticsTrend = async (courseId, days = 7) => {
  try {
    const dates = [];
    const totalStudentsData = [];
    const activeStudentsData = [];
    const completionRateData = [];

    // Get Course and Lessons info once
    const course = await Course.findById(courseId);
    if (!course) return { dates: [], totalStudents: [], activeStudents: [], completionRate: [] };

    const chapters = await Chapter.find({ courseId }).select('_id');
    const chapterIds = chapters.map(ch => ch._id);
    const totalLessons = await Lesson.countDocuments({ chapterId: { $in: chapterIds } });
    const currentTotalStudents = course.enrolledStudents?.length || 0;
    
    // Get all progress for this course
    const allProgress = await Progress.find({ courseId }).select('userId isCompleted updatedAt');

    // Generate daily buckets
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));
      
      dates.push(startOfDay);

      // 1. Active Students (Unique users with activity on this day)
      const activeUsers = new Set(
        allProgress
          .filter(p => {
             const pDate = new Date(p.updatedAt);
             return pDate >= startOfDay && pDate <= endOfDay;
          })
          .map(p => p.userId.toString())
      );
      activeStudentsData.push(activeUsers.size);

      // 2. Completion Rate (Cumulative)
      // Count accumulated cancellations up to end of this day
      if (currentTotalStudents > 0 && totalLessons > 0) {
        const completedCount = allProgress.filter(p => 
            p.isCompleted && new Date(p.updatedAt) <= endOfDay
        ).length;
        
        const possibleCompletions = currentTotalStudents * totalLessons;
        const rate = (completedCount / possibleCompletions) * 100;
        completionRateData.push(Math.round(rate * 100) / 100);
      } else {
        completionRateData.push(0);
      }

      // 3. Total Students (Proxy or Flat)
      // Since we lack enrollment history, we can either:
      // a) Return flat current count
      // b) Count unique users who had strictly touched progress by this day (Proxy for "Started")
      // Let's use Option B for a nice growth curve, bounded by currentTotalStudents
      
      const studentsStartedByNow = new Set(
        allProgress
            .filter(p => new Date(p.updatedAt) <= endOfDay)
            .map(p => p.userId.toString())
      );
      // If a student joined but did nothing, B misses them. 
      // User likely wants to see the "Current" number mostly, but maybe linear growth?
      // Let's stick to "Students who have started" as a good meaningful metric, 
      // OR just flat line if 'currentTotalStudents' > 0.
      // Given user wants "Enrollment" chart, a flat line is boring. 
      // But a proxy based on progress might be misleading if people enroll and don't start.
      // Compromise: Use current Total if > 0, else 0. 
      // Wait, user complained "Yesterday 0, Today 1".
      // Let's use the Proxy: Unique Users in Progress.
      totalStudentsData.push(studentsStartedByNow.size); 
    }

    return {
      dates,
      totalStudents: totalStudentsData,
      activeStudents: activeStudentsData,
      completionRate: completionRateData,
    };
  } catch (error) {
    console.error("Get analytics trend error:", error);
    throw error;
  }
};

/**
 * Get trend for a specific student in a course
 * @param {String} userId
 * @param {String} courseId
 * @param {Number} days
 */
export const getStudentCourseTrend = async (userId, courseId, days = 30) => {
    try {
        const dates = [];
        const completionRateData = [];
        
        const chapters = await Chapter.find({ courseId }).select('_id');
        const chapterIds = chapters.map(ch => ch._id);
        const totalLessons = await Lesson.countDocuments({ chapterId: { $in: chapterIds } });

        const studentProgress = await Progress.find({ userId, courseId, isCompleted: true }).select('updatedAt');

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const endOfDay = new Date(d.setHours(23,59,59,999));
            dates.push(new Date(d.setHours(0,0,0,0))); // Start of day label

            if (totalLessons === 0) {
                completionRateData.push(0);
                continue;
            }

            const completedCount = studentProgress.filter(p => new Date(p.updatedAt) <= endOfDay).length;
            const rate = (completedCount / totalLessons) * 100;
            completionRateData.push(Math.round(rate * 100) / 100);
        }

        return {
            dates,
            completionRate: completionRateData
        };

    } catch (error) {
        console.error("Get student trend error:", error);
        throw error;
    }
};

/**
 * Calculate growth metrics
 * @param {String} courseId - Course ID
 * @param {Number} days - Number of days to compare
 * @returns {Object} Growth metrics
 */
/**
 * Calculate growth metrics (Dynamic)
 * @param {String} courseId - Course ID
 * @param {Number} days - Number of days to compare
 * @returns {Object} Growth metrics
 */
export const calculateGrowthMetrics = async (courseId, days = 7) => {
  try {
    const today = new Date();
    const currentStart = new Date();
    currentStart.setDate(today.getDate() - days);
    
    const prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - days);

    // 1. Student Growth (Net change in new starters)
    // Find all progress for this course, sorted by date asc (to find first interaction)
    const allProgress = await Progress.find({ courseId }).sort({ createdAt: 1 });
    
    // Map userId -> firstSeenDate
    const firstSeenMap = new Map();
    allProgress.forEach(p => {
        if (!firstSeenMap.has(p.userId.toString())) {
            firstSeenMap.set(p.userId.toString(), p.createdAt);
        }
    });

    let currentNew = 0;
    let prevNew = 0;

    firstSeenMap.forEach((date) => {
        if (date >= currentStart && date <= today) {
            currentNew++;
        } else if (date >= prevStart && date < currentStart) {
            prevNew++;
        }
    });

    const studentsGrowth = currentNew - prevNew; // The "Number" user asked for (e.g. +4 or -3)

    // 2. Active Students (Count in current period)
    // Distinct users with ANY progress activity in [currentStart, today]
    const activeUserIds = new Set();
    allProgress.forEach(p => {
        // use updatedAt for activity
        if (p.updatedAt >= currentStart && p.updatedAt <= today) {
            activeUserIds.add(p.userId.toString());
        }
    });
    const activeStudentsCount = activeUserIds.size;

    // 3. Completion Rate Growth (Optional/Removed from request but good to keep logic if needed, 
    // but user wanted to remove the card. I'll just return standard comparison or null.)
    // Let's just return 0 as placeholder since it's being removed.
    
    return {
      studentsGrowth: studentsGrowth, // returns integer delta
      activeStudentsGrowth: activeStudentsCount, // returns count (User said "Active students... is the count")
      completionRateGrowth: 0,
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
        let analyticsData = await Analytics.findOne({
          courseId: course._id,
        }).sort({ date: -1 });

        // If no analytics found, calculate on the fly so dashboard isn't empty
        if (!analyticsData) {
            try {
                // Calculate for "now"
                analyticsData = await calculateCourseAnalytics(course._id, new Date());
            } catch (err) {
                console.error(`Failed to calculate analytics for course ${course._id}`, err);
                analyticsData = null;
            }
        }

        return {
          courseId: course._id,
          courseName: course.title,
          students: course.enrolledStudents?.length || 0,
          rating: course.rating,
          completionRate: analyticsData?.completionRate || 0,
          activeStudents: analyticsData?.activeStudents || 0,
        };
      })
    );

    // Sort by students
    const topCourses = [...courseAnalytics]
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    // Calculate New Discussions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Find discussions in these courses created recently
    const courseIds = courses.map(c => c._id);
    const newDiscussionsCount = await Discussion.countDocuments({
        courseId: { $in: courseIds },
        createdAt: { $gte: sevenDaysAgo }
    });

    // --- Calculate Aggregate Trend (30 Days) ---
    const trendDates = [];
    const trendTotalStudents = [];
    const trendActiveStudents = [];
    const trendCompletionRate = [];

    // Fetch all progress for teacher's courses ONCE (for Enrollment trend)
    const allTeacherProgress = await Progress.find({ 
        courseId: { $in: courseIds } 
    }).select('userId courseId isCompleted updatedAt createdAt');

    // Fetch all quiz attempts for teacher's courses ONCE (for Active Students trend)
    // 1. Get all quizzes for these courses
    const Quiz = (await import("../models/quiz.model.js")).default;
    const allTeacherQuizIds = await Quiz.distinct('_id', { courseId: { $in: courseIds } });
    
    // 2. Get attempts
    const allTeacherAttempts = await QuizAttempt.find({
        quizId: { $in: allTeacherQuizIds }
    }).select('userId updatedAt');

    // Pre-calculate total lessons per course
    const courseLessonCounts = {};
    let totalChaptersCount = 0;
    let totalLessonsCount = 0;

    for (const course of courses) {
         const chapters = await Chapter.find({ courseId: course._id }).select('_id');
         totalChaptersCount += chapters.length;

         const chIds = chapters.map(c => c._id);
         const count = await Lesson.countDocuments({ chapterId: { $in: chIds } });
         totalLessonsCount += count;
         
         courseLessonCounts[course._id.toString()] = count;
    }

    const DAYS_TREND = 30;
    for (let i = DAYS_TREND - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const startOfDay = new Date(d.setHours(0,0,0,0));
        const endOfDay = new Date(d.setHours(23,59,59,999));
        
        trendDates.push(startOfDay);

        // 1. Active Students (Unique users active on this day)
        // 1. Active Students (Unique users active on this day via Quiz)
        const activeUsersSet = new Set();
        // Check past 7 days window relative to 'startOfDay'? 
        // User said "Active students is ... in the last week". 
        // So for the trend point at 'startOfDay', we should look at [startOfDay - 6 days, startOfDay].
        // Or if the trend is "Daily Active Users", it's just that day. 
        // "Active Students" card usually implies "Currently Active" (Last 7 days).
        // If the chart plots "Active Students", it usually plots the rolling 7-day count OR daily active users.
        // Given the scale (0-4), let's assume it's Daily Active or Rolling. 
        // Let's stick to the definition: "Active ... in last week". 
        // So for each data point `date`, we count users who did a quiz in [date - 7 days, date].
        
        const trendWindowStart = new Date(startOfDay);
        trendWindowStart.setDate(trendWindowStart.getDate() - 7);

        allTeacherAttempts.forEach(a => {
             const aDate = new Date(a.updatedAt);
             if (aDate >= trendWindowStart && aDate <= endOfDay) {
                 activeUsersSet.add(a.userId.toString());
             }
        });
        trendActiveStudents.push(activeUsersSet.size);

        // 2. Total Students (Unique started enrollments by this day)
        const enrolledPairs = new Set();
        allTeacherProgress.forEach(p => {
            if (new Date(p.updatedAt) <= endOfDay) {
                enrolledPairs.add(`${p.userId}-${p.courseId}`); // unique enrollment signature
            }
        });
        trendTotalStudents.push(enrolledPairs.size);

        // 3. Overall Completion Rate
        let totalCompletedLessonsCount = 0;
        let totalPossibleLessonsCount = 0;
        
        // Filter progress up to this day
        const relevantProgress = allTeacherProgress.filter(p => new Date(p.updatedAt) <= endOfDay);
        totalCompletedLessonsCount = relevantProgress.filter(p => p.isCompleted).length;
        
        // Sum total lessons for all started enrollments
        enrolledPairs.forEach(pair => {
            const cId = pair.split('-')[1];
            totalPossibleLessonsCount += (courseLessonCounts[cId] || 0);
        });
        
        if (totalPossibleLessonsCount > 0) {
            const rate = (totalCompletedLessonsCount / totalPossibleLessonsCount) * 100;
            trendCompletionRate.push(Math.round(rate * 100) / 100);
        } else {
            trendCompletionRate.push(0);
        }
    }

    return {
      totalCourses,
      publishedCourses,
      totalStudents,
      totalChapters: totalChaptersCount,
      totalLessons: totalLessonsCount,
      averageRating: Math.round(averageRating * 100) / 100,
      courseAnalytics,
      topCourses,
      pendingQuizzes: 0, 
      newDiscussions: newDiscussionsCount,
      recentActivities: [],
      activeStudents: trendActiveStudents[trendActiveStudents.length - 1] || 0,
      trend: {
          dates: trendDates,
          totalStudents: trendTotalStudents,
          activeStudents: trendActiveStudents,
          completionRate: trendCompletionRate
      }
    };
  } catch (error) {
    console.error("Get teacher dashboard error:", error);
    throw error;
  }
};

/**
 * Get dashboard stats for Admin (includes analytics for ALL courses)
 * @returns {Object} Dashboard summary
 */
export const getAdminDashboardStats = async () => {
    try {
        // Get all courses
        const courses = await Course.find().populate('teacherId', 'fullName email');

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
        
        // Calculate New Discussions (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newDiscussionsCount = await Discussion.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });

        return {
            totalCourses,
            publishedCourses,
            totalStudents,
            averageRating: Math.round(averageRating * 100) / 100,
            courseAnalytics,
            newDiscussions: newDiscussionsCount,
        };
    } catch (error) {
        console.error("Get admin dashboard stats error:", error);
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

/**
 * Get detailed course analytics for a specific student
 * @param {String} courseId 
 * @param {String} studentId 
 */
export const getStudentCourseDetails = async (courseId, studentId) => {
    try {
        const User = (await import("../models/user.model.js")).default;
        
        // 1. Get Student Info
        const student = await User.findById(studentId).select('fullName email avatar createdAt');
        if (!student) throw new Error('Student not found');

        // 1b. Get Enrollment Date (from Notification)
        const Notification = (await import("../models/notification.model.js")).default;
        const enrollmentNotification = await Notification.findOne({
            userId: studentId,
            "metadata.courseId": courseId,
            type: "course"
        }).sort({ createdAt: 1 });
        
        const enrollmentDate = enrollmentNotification ? enrollmentNotification.createdAt : null;

        // 2. Get Course Structure (Chapters & Lessons)
        const chapters = await Chapter.find({ courseId }).sort({ order: 1 });
        const chapterIds = chapters.map(c => c._id);
        const lessons = await Lesson.find({ chapterId: { $in: chapterIds } }).sort({ order: 1 });
        
        // Map lessons by chapter for easier frontend consumption
        const courseStructure = chapters.map(ch => ({
            id: ch._id,
            title: ch.title,
            order: ch.order,
            lessons: lessons.filter(l => l.chapterId.toString() === ch._id.toString()).map(l => ({
                id: l._id,
                title: l.title,
                order: l.order,
                videoDuration: l.videoDuration
            }))
        }));

        // 3. Get Student Progress (Map to Lesson IDs)
        const progressList = await Progress.find({ courseId, userId: studentId });
        const progressMap = {};
        progressList.forEach(p => {
            progressMap[p.lessonId.toString()] = {
                isCompleted: p.isCompleted,
                watchedDuration: p.watchedDuration,
                lastWatchedAt: p.lastWatchedAt,
                videoProgressPercent: p.videoProgressPercent
            };
        });

        // 4. Get Quiz Attempts
        // Find all quizzes for this course
        const Quiz = (await import("../models/quiz.model.js")).default;
        const quizzes = await Quiz.find({ courseId }).sort({ order: 1 });
        const quizIds = quizzes.map(q => q._id);

        const attempts = await QuizAttempt.find({ 
            userId: studentId, 
            quizId: { $in: quizIds } 
        }).sort({ createdAt: -1 });

        // Map attempts by quiz
        const quizzesData = quizzes.map(q => {
            const studentAttempts = attempts.filter(a => a.quizId.toString() === q._id.toString());
            const bestAttempt = studentAttempts.reduce((prev, current) => (prev && prev.score > current.score) ? prev : current, null);
            const latestAttempt = studentAttempts[0] || null;

            return {
                id: q._id,
                title: q.title,
                lessonId: q.lessonId,
                passingScore: q.passingScore,
                attemptsAllowed: q.attemptsAllowed,
                attemptsUsed: studentAttempts.length,
                bestScore: bestAttempt ? bestAttempt.score : null,
                isPassed: bestAttempt ? bestAttempt.isPassed : false,
                lastAttemptDate: latestAttempt ? latestAttempt.createdAt : null
            };
        });

        // 5. Calculate Overviews
        const totalLessons = lessons.length;
        const completedLessons = progressList.filter(p => p.isCompleted).length;
        const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        
        const totalWatchTime = progressList.reduce((sum, p) => sum + (p.watchedDuration || 0), 0);
        
        const attemptedQuizzes = quizzesData.filter(q => q.attemptsUsed > 0);
        const avgQuizScore = attemptedQuizzes.length > 0
            ? attemptedQuizzes.reduce((sum, q) => sum + (q.bestScore || 0), 0) / attemptedQuizzes.length
            : 0;

        return {
            student: {
                ...student.toObject(),
                enrollmentDate
            },
            overview: {
                completionRate: Math.round(completionRate * 100) / 100,
                totalWatchTime, // seconds
                avgQuizScore: Math.round(avgQuizScore * 10), 
                completedLessons,
                totalLessons
            },
            courseStructure, 
            progressMap,
            quizzes: quizzesData
        };

    } catch (error) {
        console.error("Get student course details error:", error);
        throw error;
    }
};

/**
 * Reset quiz attempts for a student
 * @param {String} quizId 
 * @param {String} studentId 
 */
export const resetQuizAttempts = async (quizId, studentId) => {
    try {
        await QuizAttempt.deleteMany({ quizId, userId: studentId });
        return { success: true };
    } catch (error) {
        console.error("Reset quiz attempts error:", error);
        throw error;
    }
};
