/**
 * Notification Namespace Handler
 * Handles real-time notification delivery to users
 * Namespace: /notification
 */

import User from "../models/user.model.js";
import { verifyAccessToken } from "../config/jwt.config.js";

/**
 * Initialize Notification Namespace
 * @param {Object} io - Socket.IO server instance
 */
export const initializeNotificationNamespace = (io) => {
  // Create notification namespace
  const notificationNamespace = io.of("/notification");

  // Namespace-level auth (handshake token)
  notificationNamespace.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token)
        return next(new Error("Authentication error: No token provided"));
      const decoded = verifyAccessToken(token);
      if (!decoded)
        return next(new Error("Authentication error: Invalid token"));
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  console.log("🔔 Notification namespace initialized");

  // Namespace connection handler
  notificationNamespace.on("connection", async (socket) => {
    // Safety: ensure auth middleware attached user
    if (!socket.user || !socket.user.id) {
      console.error(
        "🔔 Notification namespace missing user on socket; disconnecting"
      );
      socket.emit("notification:error", {
        message: "Unauthorized notification socket connection",
      });
      socket.disconnect(true);
      return;
    }

    console.log(
      `🔔 User ${socket.user.id} connected to notification namespace`
    );

    /**
     * Join User-specific Notification Room
     * Automatically join user's personal notification room
     */
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);
    console.log(
      `🔔 User ${socket.user.id} joined notification room: ${userRoom}`
    );

    // Automatically join enrolled courses rooms
    try {
      const user = await User.findById(socket.user.id).select(
        "enrolledCourses"
      );
      if (user && user.enrolledCourses && user.enrolledCourses.length > 0) {
        user.enrolledCourses.forEach((courseId) => {
          const courseRoom = `course:${courseId}`;
          socket.join(courseRoom);
          console.log(
            `🔔 User ${socket.user.id} auto-joined notification room: ${courseRoom}`
          );
        });
      }
    } catch (error) {
      console.error("Error auto-joining course rooms:", error);
    }

    // Notify user of successful connection
    socket.emit("notification:connected", {
      userId: socket.user.id,
      message: "Connected to notification service",
      timestamp: new Date().toISOString(),
    });

    /**
     * Mark Notification as Read
     * Event: notification:mark-read
     * Payload: { notificationId: string }
     */
    socket.on("notification:mark-read", (data) => {
      try {
        const { notificationId } = data;

        if (!notificationId) {
          socket.emit("notification:error", {
            message: "Notification ID is required",
          });
          return;
        }

        // Acknowledge read status
        socket.emit("notification:read-acknowledged", {
          notificationId,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `🔔 User ${socket.user.id} marked notification ${notificationId} as read`
        );
      } catch (error) {
        console.error("Error marking notification as read:", error.message);
        socket.emit("notification:error", {
          message: "Failed to mark notification as read",
        });
      }
    });

    /**
     * Mark All Notifications as Read
     * Event: notification:mark-all-read
     * Payload: {}
     */
    socket.on("notification:mark-all-read", () => {
      try {
        // Acknowledge all read
        socket.emit("notification:all-read-acknowledged", {
          userId: socket.user.id,
          timestamp: new Date().toISOString(),
        });

        console.log(
          `🔔 User ${socket.user.id} marked all notifications as read`
        );
      } catch (error) {
        console.error(
          "Error marking all notifications as read:",
          error.message
        );
        socket.emit("notification:error", {
          message: "Failed to mark all as read",
        });
      }
    });

    /**
     * Request Unread Count
     * Event: notification:get-unread-count
     * Payload: {}
     */
    socket.on("notification:get-unread-count", () => {
      try {
        // This would typically query the database
        // For now, emit a response that the controller would handle
        socket.emit("notification:unread-count-requested", {
          userId: socket.user.id,
        });

        console.log(`🔔 User ${socket.user.id} requested unread count`);
      } catch (error) {
        console.error("Error getting unread count:", error.message);
        socket.emit("notification:error", {
          message: "Failed to get unread count",
        });
      }
    });

    /**
     * Subscribe to Course Notifications
     * Event: notification:subscribe-course
     * Payload: { courseId: string }
     */
    socket.on("notification:subscribe-course", (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit("notification:error", {
            message: "Course ID is required",
          });
          return;
        }

        // Join course notification room
        const courseRoom = `course:${courseId}`;
        socket.join(courseRoom);

        socket.emit("notification:subscribed", {
          courseId,
          message: `Subscribed to notifications for course ${courseId}`,
        });

        console.log(
          `🔔 User ${socket.user.id} subscribed to course ${courseId} notifications`
        );
      } catch (error) {
        console.error(
          "Error subscribing to course notifications:",
          error.message
        );
        socket.emit("notification:error", {
          message: "Failed to subscribe to course",
        });
      }
    });

    /**
     * Unsubscribe from Course Notifications
     * Event: notification:unsubscribe-course
     * Payload: { courseId: string }
     */
    socket.on("notification:unsubscribe-course", (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit("notification:error", {
            message: "Course ID is required",
          });
          return;
        }

        // Leave course notification room
        const courseRoom = `course:${courseId}`;
        socket.leave(courseRoom);

        socket.emit("notification:unsubscribed", {
          courseId,
          message: `Unsubscribed from notifications for course ${courseId}`,
        });

        console.log(
          `🔔 User ${socket.user.id} unsubscribed from course ${courseId} notifications`
        );
      } catch (error) {
        console.error(
          "Error unsubscribing from course notifications:",
          error.message
        );
        socket.emit("notification:error", {
          message: "Failed to unsubscribe from course",
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(
        `🔔 User ${socket.user.id} disconnected from notification namespace`
      );
    });
  });

  return notificationNamespace;
};

/**
 * Helper function to send notification to a specific user
 * Can be called from controllers/services
 * @param {Object} io - Socket.IO server instance
 * @param {string} userId - Target user ID
 * @param {Object} notification - Notification data
 */
export const sendNotificationToUser = (io, userId, notification) => {
  const notificationNamespace = io.of("/notification");
  const userRoom = `user:${userId}`;

  notificationNamespace.to(userRoom).emit("notification:new", {
    ...notification,
    timestamp: new Date().toISOString(),
  });

  console.log(`🔔 Notification sent to user ${userId}`);
};

/**
 * Helper function to send notification to all users in a course
 * @param {Object} io - Socket.IO server instance
 * @param {string} courseId - Course ID
 * @param {Object} notification - Notification data
 */
export const sendNotificationToCourse = (io, courseId, notification) => {
  const notificationNamespace = io.of("/notification");
  const courseRoom = `course:${courseId}`;

  notificationNamespace.to(courseRoom).emit("notification:new", {
    ...notification,
    timestamp: new Date().toISOString(),
  });

  console.log(`🔔 Notification sent to course ${courseId}`);
};

/**
 * Helper function to broadcast notification to all connected users
 * @param {Object} io - Socket.IO server instance
 * @param {Object} notification - Notification data
 */
export const broadcastNotification = (io, notification) => {
  const notificationNamespace = io.of("/notification");

  notificationNamespace.emit("notification:broadcast", {
    ...notification,
    timestamp: new Date().toISOString(),
  });

  console.log("🔔 Notification broadcasted to all users");
};

export default {
  initializeNotificationNamespace,
  sendNotificationToUser,
  sendNotificationToCourse,
  broadcastNotification,
};
