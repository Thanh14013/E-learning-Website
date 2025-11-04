import mongoose from "mongoose";

/**
 * Discussion Schema
 * Represents a discussion thread created by students or teachers within a course.
 * Supports features like pinning, likes, and view tracking.
 *
 * @typedef {Object} Discussion
 * @property {mongoose.Schema.Types.ObjectId} courseId - Reference to the course this discussion belongs to
 * @property {mongoose.Schema.Types.ObjectId} userId - Reference to the user who created the discussion
 * @property {String} title - Title of the discussion thread
 * @property {String} content - Main content/body of the discussion
 * @property {Boolean} isPinned - Whether this discussion is pinned to the top by teacher
 * @property {Array<mongoose.Schema.Types.ObjectId>} likes - Array of user IDs who liked this discussion
 * @property {Number} views - Number of times this discussion has been viewed
 * @property {Date} createdAt - Timestamp when discussion was created
 * @property {Date} updatedAt - Timestamp when discussion was last updated
 */
const discussionSchema = new mongoose.Schema(
  {
    // Reference to the Course this discussion belongs to
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required."],
      index: true, // Index for faster queries by course
    },
    // Reference to the User who created this discussion
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true, // Index for faster queries by user
    },
    // Title of the discussion thread
    title: {
      type: String,
      required: [true, "Discussion title is required."],
      trim: true,
      minlength: [5, "Title must be at least 5 characters long."],
      maxlength: [200, "Title cannot exceed 200 characters."],
    },
    // Main content of the discussion
    content: {
      type: String,
      required: [true, "Discussion content is required."],
      trim: true,
      minlength: [10, "Content must be at least 10 characters long."],
      maxlength: [5000, "Content cannot exceed 5000 characters."],
    },
    // Whether this discussion is pinned to the top (only teachers can pin)
    isPinned: {
      type: Boolean,
      default: false,
      index: true, // Index for faster sorting (pinned first)
    },
    // Array of user IDs who liked this discussion
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // View count - incremented each time someone views the discussion
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative."],
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Compound index for efficient sorting by course and creation time
discussionSchema.index({ courseId: 1, createdAt: -1 });

// Compound index for efficient queries on pinned discussions within a course
discussionSchema.index({ courseId: 1, isPinned: -1, createdAt: -1 });

// Text index for full-text search on title and content
discussionSchema.index({ title: "text", content: "text" });

/**
 * Virtual property to get the count of likes
 * This is a computed property that doesn't get stored in the database
 */
discussionSchema.virtual("likesCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

/**
 * Virtual property to populate comments
 * This allows us to populate all comments associated with this discussion
 */
discussionSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "discussionId",
});

// Ensure virtual fields are included when converting to JSON
discussionSchema.set("toJSON", { virtuals: true });
discussionSchema.set("toObject", { virtuals: true });

const Discussion = mongoose.model("Discussion", discussionSchema);

export default Discussion;
