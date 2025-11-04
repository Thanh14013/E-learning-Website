import mongoose from "mongoose";

/**
 * Comment Schema
 * Represents a comment on a discussion thread.
 * Supports nested/threaded comments through the parentId field.
 *
 * @typedef {Object} Comment
 * @property {mongoose.Schema.Types.ObjectId} discussionId - Reference to the discussion this comment belongs to
 * @property {mongoose.Schema.Types.ObjectId} userId - Reference to the user who created the comment
 * @property {String} content - Content of the comment
 * @property {mongoose.Schema.Types.ObjectId} parentId - Reference to parent comment (for nested replies)
 * @property {Array<mongoose.Schema.Types.ObjectId>} likes - Array of user IDs who liked this comment
 * @property {Date} createdAt - Timestamp when comment was created
 * @property {Date} updatedAt - Timestamp when comment was last updated
 */
const commentSchema = new mongoose.Schema(
  {
    // Reference to the Discussion this comment belongs to
    discussionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: [true, "Discussion ID is required."],
      index: true, // Index for faster queries by discussion
    },
    // Reference to the User who created this comment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true, // Index for faster queries by user
    },
    // Content of the comment
    content: {
      type: String,
      required: [true, "Comment content is required."],
      trim: true,
      minlength: [1, "Content must be at least 1 character long."],
      maxlength: [2000, "Content cannot exceed 2000 characters."],
    },
    // Reference to parent comment (null for top-level comments)
    // This enables nested/threaded comment functionality
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true, // Index for faster queries of nested comments
    },
    // Array of user IDs who liked this comment
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Compound index for efficient queries of comments in a discussion
commentSchema.index({ discussionId: 1, createdAt: 1 });

// Compound index for efficient queries of nested comments (replies to a parent comment)
commentSchema.index({ discussionId: 1, parentId: 1, createdAt: 1 });

// Index for efficiently finding all root-level comments (no parent)
commentSchema.index({ discussionId: 1, parentId: 1 });

/**
 * Virtual property to get the count of likes
 * This is a computed property that doesn't get stored in the database
 */
commentSchema.virtual("likesCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

/**
 * Virtual property to populate replies (nested comments)
 * This allows us to populate all replies to this comment
 */
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentId",
});

// Ensure virtual fields are included when converting to JSON
commentSchema.set("toJSON", { virtuals: true });
commentSchema.set("toObject", { virtuals: true });

/**
 * Pre-remove middleware to cascade delete all replies when a comment is deleted
 * This ensures that when a parent comment is deleted, all its nested replies are also deleted
 */
commentSchema.pre("remove", async function (next) {
  try {
    // Find and delete all child comments (replies)
    await this.model("Comment").deleteMany({ parentId: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
