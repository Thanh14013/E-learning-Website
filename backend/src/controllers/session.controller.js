import LiveSession from "../models/liveSession.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import {
  sendNotificationToCourse,
  sendNotificationToUser,
} from "../socket/index.js";
import { getSocketIOInstance } from "../config/socket.config.js";
import {
  notifySessionScheduled,
  notifySessionStarted,
  notifySessionCanceled,
  notifySessionUpdated,
} from "../services/notification.service.js";
import { seedLiveSessions } from "../utils/seedSessions.js";

/**
 * @route   POST /api/sessions
 * @desc    Create new live session (teacher only)
 * @access  Private (Teacher/Admin)
 */
export const createSession = async (req, res) => {
  try {
    const { courseId, title, description, scheduledAt } = req.body;
    const hostId = req.user.id;

    // Validate course ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user is the course teacher or admin
    if (course.teacherId.toString() !== hostId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this course.",
      });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future",
      });
    }

    // Create session
    const newSession = await LiveSession.create({
      courseId,
      hostId,
      title,
      description,
      scheduledAt: scheduledDate,
      status: "scheduled",
    });

    // Populate course and host info
    await newSession.populate([
      { path: "courseId", select: "title enrolledStudents" },
      { path: "hostId", select: "fullName email" },
    ]);

    // Get enrolled students from the course
    const enrolledStudents = await User.find({
      _id: { $in: course.enrolledStudents },
    }).select("_id");

    const studentIds = enrolledStudents.map((student) => student._id);

    // Send notifications to enrolled students (DB + realtime)
    await notifySessionScheduled(enrolledStudents, newSession, course);

    return res.status(201).json({
      success: true,
      message: "Live session created successfully",
      data: newSession,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating session",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/sessions/course/:courseId
 * @desc    Get all sessions for a course
 * @access  Public
 */
export const getCourseSessions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status } = req.query;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { courseId };
    if (
      status &&
      ["scheduled", "live", "ended", "cancelled"].includes(status)
    ) {
      filter.status = status;
    }

    // Query sessions
    const [sessions, total] = await Promise.all([
      LiveSession.find(filter)
        .populate("hostId", "fullName email avatar")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveSession.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Sessions fetched successfully",
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: sessions,
    });
  } catch (error) {
    console.error("Get course sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sessions",
    });
  }
};

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session detail
 * @access  Public
 */
export const getSessionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await LiveSession.findById(id)
      .populate("courseId", "title description thumbnail")
      .populate("hostId", "fullName email avatar")
      .populate("participants.userId", "fullName email avatar")
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Filter out participants who have left
    const activeParticipants = session.participants.filter(
      (p) => !p.leftAt || p.leftAt === null
    );

    return res.status(200).json({
      success: true,
      message: "Session detail fetched successfully",
      data: {
        ...session,
        activeParticipants,
        totalParticipants: activeParticipants.length,
      },
    });
  } catch (error) {
    console.error("Get session detail error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching session detail",
    });
  }
};

/**
 * @route   PUT /api/sessions/:id
 * @desc    Update session
 * @access  Private (Teacher/Admin - Owner only)
 */
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, scheduledAt } = req.body;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Validate ownership
    if (session.hostId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not the host of this session.",
      });
    }

    // Cannot update live or ended sessions
    if (session.status === "live" || session.status === "ended") {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${session.status} session`,
      });
    }

    // Update fields
    if (title) session.title = title;
    if (description) session.description = description;
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Scheduled time must be in the future",
        });
      }
      session.scheduledAt = scheduledDate;
    }

    await session.save();

    // Notify enrolled students about updates to the session
    const course = await Course.findById(session.courseId).select(
      "title enrolledStudents"
    );
    if (course) {
      const enrolledStudents = (course.enrolledStudents || []).map((sid) => ({
        _id: sid,
      }));
      await notifySessionUpdated(enrolledStudents, session, course);
    }

    return res.status(200).json({
      success: true,
      message: "Session updated successfully",
      data: session,
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating session",
    });
  }
};

/**
 * @route   PUT /api/sessions/:id/start
 * @desc    Start live session
 * @access  Private (Teacher/Admin - Owner only)
 */
export const startSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await LiveSession.findById(id).populate(
      "courseId",
      "title enrolledStudents"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Validate ownership
    if (session.hostId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not the host of this session.",
      });
    }

    // Check if session is scheduled
    if (session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: `Cannot start session with status: ${session.status}`,
      });
    }

    // Update status to live
    session.status = "live";
    session.startedAt = new Date();
    await session.save();

    // Notify enrolled students session started
    const enrolledStudents = (session.courseId.enrolledStudents || []).map(
      (id) => ({ _id: id })
    );
    await notifySessionStarted(enrolledStudents, session, session.courseId);

    // Broadcast session live notification via Socket.IO
    if (req.io) {
      sendNotificationToCourse(req.io, session.courseId._id, {
        type: "session_live",
        title: "Live Session Started",
        content: `The session "${session.title}" is now live! Join now.`,
        link: `/courses/${session.courseId._id}/sessions/${session._id}/join`,
        sessionId: session._id,
      });

      // Also emit to session namespace
      const sessionNamespace = req.io.of("/session");
      sessionNamespace.emit("session:live", {
        sessionId: session._id,
        session: session,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session started successfully",
      data: session,
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while starting session",
    });
  }
};

/**
 * @route   PUT /api/sessions/:id/end
 * @desc    End live session
 * @access  Private (Teacher/Admin - Owner only)
 */
export const endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Validate ownership
    if (session.hostId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not the host of this session.",
      });
    }

    // Check if session is live
    if (session.status !== "live") {
      return res.status(400).json({
        success: false,
        message: `Cannot end session with status: ${session.status}`,
      });
    }

    // Update status to ended
    session.status = "ended";
    session.endedAt = new Date();

    // Calculate duration in minutes
    if (session.startedAt) {
      const durationMs = session.endedAt - session.startedAt;
      session.duration = Math.round(durationMs / 60000); // Convert to minutes
    }

    await session.save();

    // Broadcast session ended event via Socket.IO
    if (req.io) {
      const sessionNamespace = req.io.of("/session");
      const roomId = `session:${session._id}`;

      sessionNamespace.to(roomId).emit("session:ended", {
        sessionId: session._id,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session ended successfully",
      data: session,
    });
  } catch (error) {
    console.error("End session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while ending session",
    });
  }
};

/**
 * @route   POST /api/sessions/:id/join
 * @desc    Join live session (student)
 * @access  Private
 */
export const joinSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await LiveSession.findById(id).populate(
      "courseId",
      "enrolledStudents"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Check if session is live
    if (session.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Session is not live",
        status: session.status,
      });
    }

    // Check if user is enrolled in the course
    const isEnrolled = session.courseId.enrolledStudents.some(
      (studentId) => studentId.toString() === userId
    );

    const isHost = session.hostId.toString() === userId;

    if (!isEnrolled && !isHost && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled in the course to join this session",
      });
    }

    return res.status(200).json({
      success: true,
      message: "You can join the session",
      data: {
        sessionId: session._id,
        title: session.title,
        hostId: session.hostId,
        status: session.status,
      },
    });
  } catch (error) {
    console.error("Join session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while joining session",
    });
  }
};

/**
 * @route   DELETE /api/sessions/:id
 * @desc    Delete session
 * @access  Private (Teacher/Admin - Owner only)
 */
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Validate ownership
    if (session.hostId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not the host of this session.",
      });
    }

    // Cannot delete live sessions
    if (session.status === "live") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete live session. End it first.",
      });
    }

    // Delete recording from Cloudinary if exists
    if (session.recordingUrl) {
      // TODO: Implement Cloudinary deletion
      // const fileName = session.recordingUrl.split("/").pop().split(".")[0];
      // await deleteFile(`recordings/${fileName}`, { resource_type: "video" });
    }

    await LiveSession.findByIdAndDelete(id);

    // Notify enrolled students session canceled/deleted
    const course = await Course.findById(session.courseId).select(
      "title enrolledStudents"
    );
    if (course) {
      const enrolledStudents = (course.enrolledStudents || []).map((sid) => ({
        _id: sid,
      }));
      await notifySessionCanceled(enrolledStudents, session, course);
    }

    return res.status(200).json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting session",
    });
  }
};

/**
 * @route   GET /api/sessions/my-sessions
 * @desc    Get sessions hosted by current teacher
 * @access  Private (Teacher/Admin)
 */
export const getMySessions = async (req, res) => {
  try {
    const hostId = req.user.id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      LiveSession.find({ hostId })
        .populate("courseId", "title thumbnail")
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveSession.countDocuments({ hostId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Your sessions fetched successfully",
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: sessions,
    });
  } catch (error) {
    console.error("Get my sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sessions",
    });
  }
};

/**
 * @route   GET /api/sessions/my-enrolled-sessions
 * @desc    Get all sessions from enrolled courses for calendar (Student)
 * @access  Private (Student)
 * @query startDate, endDate - Filter sessions by date range
 */
export const getEnrolledCourseSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Get user's enrolled courses
    const user = await User.findById(userId).select("enrolledCourses");
    if (!user || !user.enrolledCourses || user.enrolledCourses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No enrolled courses found",
        data: [],
      });
    }

    const enrolledCourseIds = user.enrolledCourses;

    // Build filter
    const filter = {
      courseId: { $in: enrolledCourseIds },
      status: { $in: ["scheduled", "live"] }, // Only show upcoming and live sessions
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.scheduledAt = {};
      if (startDate) {
        filter.scheduledAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.scheduledAt.$lte = new Date(endDate);
      }
    }

    // Get sessions
    const sessions = await LiveSession.find(filter)
      .populate("courseId", "title thumbnail")
      .populate("hostId", "fullName avatar")
      .sort({ scheduledAt: 1 })
      .lean();

    // Group sessions by date for easier calendar rendering
    const sessionsByDate = {};
    sessions.forEach((session) => {
      // Use local date instead of UTC to avoid timezone issues
      const localDate = new Date(session.scheduledAt);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, "0");
      const day = String(localDate.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`; // YYYY-MM-DD in local timezone

      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    });

    return res.status(200).json({
      success: true,
      message: "Sessions fetched successfully",
      data: sessions,
      sessionsByDate,
    });
  } catch (error) {
    console.error("Get enrolled sessions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching sessions",
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/sessions/seed-demo
 * @desc    Seed demo live sessions for testing calendar
 * @access  Private (Teacher/Admin)
 */
export const seedDemoSessions = async (_req, res) => {
  try {
    const created = await seedLiveSessions();
    return res.status(201).json({
      success: true,
      message: "Demo sessions seeded successfully",
      createdCount: created?.length || 0,
    });
  } catch (error) {
    console.error("Seed demo sessions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to seed demo sessions",
    });
  }
};
