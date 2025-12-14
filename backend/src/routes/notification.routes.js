import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  getPreferences,
  updatePreferences,
} from "../controllers/notification.controller.js";

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user with pagination and filters
 * @access  Private
 */
router.get("/", authenticate, getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get("/unread-count", authenticate, getUnreadCount);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences
 * @access  Private
 */
router.get("/preferences", authenticate, getPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put("/preferences", authenticate, updatePreferences);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/read-all", authenticate, markAllNotificationsRead);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.put("/:id/read", authenticate, markNotificationRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete single notification
 * @access  Private
 */
router.delete("/:id", authenticate, deleteNotification);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications for current user
 * @access  Private
 */
router.delete("/", authenticate, deleteAllNotifications);

export default router;
