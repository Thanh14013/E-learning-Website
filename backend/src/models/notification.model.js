import mongoose from "mongoose";

/**
 * Notification Schema
 * Represents in-app notifications targeted to a single user.
 *
 * @typedef {Object} Notification
 * @property {mongoose.Schema.Types.ObjectId} userId - Owner of the notification.
 * @property {String} type - Logical type of the notification (quiz, course, system, etc.).
 * @property {String} title - Short title displayed in notification list.
 * @property {String} content - Detailed message shown when viewing notification.
 * @property {String} link - Optional relative URL to navigate when notification is clicked.
 * @property {mongoose.Schema.Types.Mixed} metadata - Optional payload for domain specific data.
 * @property {Boolean} isRead - Whether the notification has been read by the user.
 * @property {Date} readAt - Timestamp when the notification was marked as read.
 * @property {Date} expiresAt - Optional expiry time (used with TTL index).
 * @property {Date} createdAt - Timestamp when the notification was created.
 * @property {Date} updatedAt - Timestamp when the notification was last updated.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required for a notification."],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "system",
        "course",
        "quiz_assigned",
        "quiz_due",
        "quiz_submitted",
        "quiz_graded",
        "discussion",
        "session",
        "progress",
        "custom",
      ],
      default: "system",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required."],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long."],
      maxlength: [150, "Title cannot exceed 150 characters."],
    },
    content: {
      type: String,
      required: [true, "Notification content is required."],
      trim: true,
      maxlength: [1000, "Content cannot exceed 1000 characters."],
    },
    link: {
      type: String,
      trim: true,
      maxlength: [500, "Link cannot exceed 500 characters."],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to fetch notifications efficiently per user ordered by recency/read state
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// TTL index for optional expiration (documents expire when expiresAt < now)
notificationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { expiresAt: { $type: "date" } },
  }
);

/**
 * Mark the notification as read.
 */
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
};

notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;

