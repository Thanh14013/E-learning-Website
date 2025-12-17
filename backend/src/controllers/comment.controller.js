import Comment from "../models/comment.model.js";
import Discussion from "../models/discussion.model.js";
import { getSocketIOInstance } from "../config/socket.config.js";
import { emitCommentCreated, emitCommentLiked } from "../socket/index.js";
import {
  notifyCommentCreated,
  notifyCommentReply,
} from "../services/notification.service.js";

/**
 * Comment Controller
 * Handles CRUD operations for discussion comments
 * Supports nested comments (replies) and real-time updates via Socket.IO
 */

/**
 * Create a new comment on a discussion
 * POST /api/discussions/:id/comment
 * @access Protected - Authenticated users
 * @body { content, parentId? }
 */
export const createComment = async (req, res) => {
  try {
    const { id: discussionId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required.",
      });
    }

    // Validate content length
    if (content.length < 1 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Content must be between 1 and 2000 characters.",
      });
    }

    // Check if discussion exists
    const discussion = await Discussion.findById(discussionId).populate(
      "userId",
      "fullName email"
    );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found.",
      });
    }

    // TODO: Validate that user is enrolled in the course when Course model is available
    /*
    const course = await Course.findById(discussion.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const isEnrolled = course.enrolledStudents.some(
      (studentId) => studentId.toString() === userId.toString()
    );
    const isTeacher = course.teacherId.toString() === userId.toString();

    if (!isEnrolled && !isTeacher && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to comment.',
      });
    }
    */

    // If parentId is provided, verify parent comment exists
    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId).populate(
        "userId",
        "fullName"
      );

      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found.",
        });
      }

      // Verify parent comment belongs to the same discussion
      if (parentComment.discussionId.toString() !== discussionId.toString()) {
        return res.status(400).json({
          success: false,
          message: "Parent comment does not belong to this discussion.",
        });
      }
    }

    // Create comment
    const comment = await Comment.create({
      discussionId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
      likes: [],
    });

    // Populate user information
    await comment.populate("userId", "fullName email avatar role");

    // Get commenter information for notifications
    const commenter = {
      _id: req.user.id,
      id: req.user.id,
      fullName: req.user.fullName,
    };

    // Emit Socket.IO event for real-time update
    try {
      const io = getSocketIOInstance();
      emitCommentCreated(
        io,
        discussion.courseId.toString(),
        {
          _id: comment._id,
          discussionId: comment.discussionId,
          userId: {
            _id: comment.userId._id,
            fullName: comment.userId.fullName,
            email: comment.userId.email,
            avatar: comment.userId.avatar,
            role: comment.userId.role
          },
          content: comment.content,
          parentId: comment.parentId,
          likesCount: comment.likesCount,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
        discussionId
      );
    } catch (socketError) {
      console.error("Socket.IO error:", socketError.message);
    }

    // Send notifications
    try {
      if (parentId && parentComment) {
        // This is a reply to another comment
        await notifyCommentReply(
          discussion.courseId.toString(),
          parentComment.userId.toString(),
          comment,
          commenter,
          discussion.title
        );
      } else {
        // This is a top-level comment on the discussion
        // Only send notification if commenter is not the discussion owner
        if (discussion.userId._id.toString() !== commenter._id.toString()) {
          await notifyCommentCreated(
            discussion.courseId.toString(),
            discussion.userId._id.toString(),
            comment,
            commenter,
            discussion.title
          );
        }
      }
    } catch (notificationError) {
      console.error("Notification error:", notificationError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Comment created successfully.",
      data: {
        comment: {
          _id: comment._id,
          discussionId: comment.discussionId,
          userId: comment.userId,
          content: comment.content,
          parentId: comment.parentId,
          likesCount: comment.likesCount,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: messages,
      });
    }

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create comment. Please try again later.",
    });
  }
};

/**
 * Update a comment
 * PUT /api/comments/:id
 * @access Protected - Owner only
 * @body { content }
 */
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required.",
      });
    }

    if (content.length < 1 || content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Content must be between 1 and 2000 characters.",
      });
    }

    // Find the comment
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    // Check ownership
    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this comment.",
      });
    }

    // Update content
    comment.content = content.trim();
    await comment.save();

    // Populate user info
    await comment.populate("userId", "fullName email avatar role");

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      data: {
        comment: {
          _id: comment._id,
          discussionId: comment.discussionId,
          userId: comment.userId,
          content: comment.content,
          parentId: comment.parentId,
          likesCount: comment.likesCount,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update comment error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: messages,
      });
    }

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update comment. Please try again later.",
    });
  }
};

/**
 * Delete a comment
 * DELETE /api/comments/:id
 * @access Protected - Owner or Teacher
 * Note: If comment has replies, we do a hard delete (cascade delete all replies)
 */
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the comment
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    // Check ownership (owner or teacher or admin)
    const isOwner = comment.userId.toString() === userId.toString();
    const isTeacher = req.user.role === "teacher";
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this comment.",
      });
    }

    // Check if comment has replies
    const hasReplies = await Comment.exists({ parentId: id });

    if (hasReplies) {
      // Hard delete: Delete comment and all its replies recursively
      await deleteCommentAndReplies(id);
    } else {
      // Simple delete: No replies, just delete the comment
      await Comment.findByIdAndDelete(id);
    }

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment. Please try again later.",
    });
  }
};

/**
 * Helper function to recursively delete a comment and all its replies
 * @param {string} commentId - Comment ID to delete
 */
const deleteCommentAndReplies = async (commentId) => {
  // Find all direct replies to this comment
  const replies = await Comment.find({ parentId: commentId });

  // Recursively delete each reply and its nested replies
  for (const reply of replies) {
    await deleteCommentAndReplies(reply._id.toString());
  }

  // Delete the comment itself
  await Comment.findByIdAndDelete(commentId);
};

/**
 * Toggle like on a comment
 * PUT /api/comments/:id/like
 * @access Protected - Authenticated users
 */
export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the comment
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    // Check if user already liked this comment
    const likeIndex = comment.likes.findIndex(
      (likeId) => likeId.toString() === userId.toString()
    );

    let isLiked = false;

    if (likeIndex > -1) {
      // User already liked, remove the like
      comment.likes.splice(likeIndex, 1);
      isLiked = false;
    } else {
      // User hasn't liked, add the like
      comment.likes.push(userId);
      isLiked = true;
    }

    // Save the comment
    await comment.save();

    const likesCount = comment.likes.length;

    // Get discussion to emit event to correct course room
    const discussion = await Discussion.findById(comment.discussionId);

    // Emit Socket.IO event for real-time update
    if (discussion) {
      try {
        const io = getSocketIOInstance();
        emitCommentLiked(
          io,
          discussion.courseId.toString(),
          id,
          userId,
          likesCount
        );
      } catch (socketError) {
        console.error("Socket.IO error:", socketError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: isLiked
        ? "Comment liked successfully."
        : "Comment unliked successfully.",
      data: {
        isLiked,
        likesCount,
      },
    });
  } catch (error) {
    console.error("Like comment error:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID format.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to like comment. Please try again later.",
    });
  }
};

export default {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
};
