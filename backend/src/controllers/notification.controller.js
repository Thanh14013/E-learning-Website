import Notification from "../models/notification.model.js";

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user
 * @access  Private
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, isRead } = req.query;

    // Build filter
    const filter = { userId };

    // Add type filter if provided
    if (type) {
      filter.type = type;
    }

    // Add isRead filter if provided
    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Notification.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for current user
 * @access  Private
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching unread count",
    });
  }
};

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Find notification
    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Mark as read
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    // Emit socket event
    const io = req.io; // Assuming req.io is available, or use getSocketIOInstance
    if (io) {
       // Import dynamically to avoid circular dependencies if any, or use the helper from socket/index
       const { sendNotificationToUser } = (await import("../socket/notification.handler.js"));
       sendNotificationToUser(io, userId, {
         type: "notification_updated",
         notification
       });
       
       // Also emit unread count update
       const unreadCount = await Notification.countDocuments({ userId, isRead: false });
       sendNotificationToUser(io, userId, {
           type: "notification_count",
           count: unreadCount
       });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking notification as read",
    });
  }
};

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for current user
 * @access  Private
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications
    const result = await Notification.updateMany(
      { userId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Emit socket event
    const io = req.io;
    if (io) {
        const { sendNotificationToUser } = (await import("../socket/notification.handler.js"));
        sendNotificationToUser(io, userId, {
            type: "notifications_all_read"
        });
        
        sendNotificationToUser(io, userId, {
            type: "notification_count",
            count: 0
        });
    }

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking all notifications as read",
    });
  }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Find and delete notification
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Emit socket event
    const io = req.io;
    if (io) {
        const { sendNotificationToUser } = (await import("../socket/notification.handler.js"));
        sendNotificationToUser(io, userId, {
            type: "notification_deleted",
            id: notificationId
        });
        
        // Update count if the deleted one was unread
        if (!notification.isRead) {
             const unreadCount = await Notification.countDocuments({ userId, isRead: false });
             sendNotificationToUser(io, userId, {
                 type: "notification_count",
                 count: unreadCount
             });
        }
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting notification",
    });
  }
};

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for current user
 * @access  Private
 */
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all notifications for the user
    const result = await Notification.deleteMany({ userId });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting notifications",
    });
  }
};

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences for current user
 * @access  Private
 */
export const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Get preferences from user profile or separate preferences model
    // For now, return default preferences
    const defaultPreferences = {
      email: {
        courseUpdates: true,
        newLessons: true,
        quizResults: true,
        discussionReplies: true,
        systemAnnouncements: true,
      },
      push: {
        courseUpdates: true,
        newLessons: true,
        quizResults: true,
        discussionReplies: true,
        systemAnnouncements: true,
      },
      inApp: {
        courseUpdates: true,
        newLessons: true,
        quizResults: true,
        discussionReplies: true,
        systemAnnouncements: true,
      },
    };

    return res.status(200).json({
      success: true,
      data: defaultPreferences,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching preferences",
    });
  }
};

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences for current user
 * @access  Private
 */
export const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // TODO: Save preferences to user profile or separate preferences model
    // For now, just return the preferences back

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating preferences",
    });
  }
};
