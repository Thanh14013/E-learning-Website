import Discussion from '../models/discussion.model.js';
import Comment from '../models/comment.model.js';
import User from '../models/user.model.js';
import { getSocketIOInstance } from '../config/socket.config.js';
import { emitDiscussionCreated, emitDiscussionLiked } from '../socket/index.js';
import { notifyDiscussionCreated, notifyDiscussionLiked, notifyDiscussionPinned } from '../services/notification.service.js';

/**
 * Discussion Controller
 * Handles CRUD operations for course discussions
 * Integrates with Socket.IO for real-time updates and notification service
 */



/**
 * Create a new discussion in a course
 * POST /api/discussions
 * @access Protected - Student/Teacher (must be enrolled or teaching the course)
 */
export const createDiscussion = async (req, res) => {
  try {
    const { courseId, title, content } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required.',
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required.',
      });
    }

    // Validate title length
    if (title.length < 5 || title.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Title must be between 5 and 200 characters.',
      });
    }

    // Validate content length
    if (content.length < 1 || content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Content must be between 1 and 5000 characters.',
      });
    }

    // Validate that user is enrolled in the course or is the teacher
    const Course = (await import("../models/course.model.js")).default;
    const course = await Course.findById(courseId).select('teacherId enrolledStudents');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    // Check if user is enrolled (student) or is the teacher
    const isTeacher = course.teacherId.toString() === userId.toString();
    const isEnrolled = course.enrolledStudents.some(
      (studentId) => studentId.toString() === userId.toString()
    );

    if (!isTeacher && !isEnrolled && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to create discussions.',
      });
    }

    // Create discussion
    const discussion = await Discussion.create({
      courseId,
      userId,
      title: title.trim(),
      content: content.trim(),
      isPinned: false,
      likes: [],
      views: 0,
    });

    // Populate user information
    await discussion.populate('userId', 'fullName email avatar role');

    // Get creator information for notifications
    const creator = {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
    };

    // Emit Socket.IO event for real-time update
    try {
      const io = getSocketIOInstance();
      emitDiscussionCreated(io, courseId, {
        _id: discussion._id,
        title: discussion.title,
        content: discussion.content,
        courseId: discussion.courseId,
        userId: discussion.userId,
        isPinned: discussion.isPinned,
        likesCount: discussion.likesCount,
        views: discussion.views,
        createdAt: discussion.createdAt,
        updatedAt: discussion.updatedAt,
      });
    } catch (socketError) {
      // Log socket error but don't fail the request
      console.error('Socket.IO error:', socketError.message);
    }

    // Send notifications to course members
    try {
      await notifyDiscussionCreated(courseId, discussion, creator);
    } catch (notificationError) {
      // Log notification error but don't fail the request
      console.error('Notification error:', notificationError.message);
    }

    // Return created discussion
    return res.status(201).json({
      success: true,
      message: 'Discussion created successfully.',
      data: {
        discussion: {
          _id: discussion._id,
          courseId: discussion.courseId,
          userId: discussion.userId,
          title: discussion.title,
          content: discussion.content,
          isPinned: discussion.isPinned,
          likesCount: discussion.likesCount,
          views: discussion.views,
          createdAt: discussion.createdAt,
          updatedAt: discussion.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Create discussion error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: messages,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A discussion with this information already exists.',
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      message: 'Failed to create discussion. Please try again later.',
    });
  }
};

/**
 * Get all discussions for a course
 * GET /api/discussions/course/:courseId
 * @access Public
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @query search - Search in title and content
 * @query sortBy - Sort field (default: createdAt)
 * @query order - Sort order: asc or desc (default: desc)
 */
export const getDiscussionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Validate courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required.',
      });
    }

    // Build query
    const query = { courseId };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration - pinned discussions first, then by specified field
    const sortConfig = {
      isPinned: -1, // Pinned first
    };
    sortConfig[sortBy] = order === 'asc' ? 1 : -1;

    // Get total count for pagination
    const totalDiscussions = await Discussion.countDocuments(query);

    // Get discussions with pagination and sorting
    const discussions = await Discussion.find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'fullName email avatar role')
      .populate('commentCount')
      .lean();

    // Add likesCount to each discussion
    const discussionsWithCommentCount = discussions.map((discussion) => ({
      ...discussion,
      likesCount: discussion.likes ? discussion.likes.length : 0,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalDiscussions / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      message: 'Discussions retrieved successfully.',
      data: {
        discussions: discussionsWithCommentCount,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalDiscussions,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error('Get discussions by course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve discussions. Please try again later.',
    });
  }
};

/**
 * Get discussion detail with all comments (nested support)
 * GET /api/discussions/:id
 * @access Public
 */
export const getDiscussionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Find discussion and populate user info
    const discussion = await Discussion.findById(id)
      .populate('userId', 'fullName email avatar role')
      .populate('commentCount')
      .lean();

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found.',
      });
    }

    // Increment views count
    await Discussion.findByIdAndUpdate(id, { $inc: { views: 1 } });
    discussion.views += 1;

    // Get all comments for this discussion
    const comments = await Comment.find({ discussionId: id })
      .populate('userId', 'fullName email avatar role')
      .sort({ createdAt: 1 })
      .lean();

    // Organize comments into nested structure
    const commentMap = {};
    const rootComments = [];

    // First, create a map of all comments
    comments.forEach((comment) => {
      commentMap[comment._id.toString()] = {
        ...comment,
        likesCount: comment.likes ? comment.likes.length : 0,
        replies: [],
      };
    });

    // Then, organize into nested structure
    comments.forEach((comment) => {
      const commentWithReplies = commentMap[comment._id.toString()];
      if (comment.parentId) {
        // This is a reply, add it to parent's replies array
        const parentComment = commentMap[comment.parentId.toString()];
        if (parentComment) {
          parentComment.replies.push(commentWithReplies);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Discussion detail retrieved successfully.',
      data: {
        discussion: {
          ...discussion,
          likesCount: discussion.likes ? discussion.likes.length : 0,
        },
        comments: rootComments,
        totalComments: comments.length,
      },
    });
  } catch (error) {
    console.error('Get discussion detail error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve discussion detail. Please try again later.',
    });
  }
};

/**
 * Update a discussion
 * PUT /api/discussions/:id
 * @access Protected - Owner or Teacher of the course
 */
export const updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found.',
      });
    }

    // Check ownership (owner or teacher or admin)
    const isOwner = discussion.userId.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    // Determine course teacher
    const Course = (await import("../models/course.model.js")).default;
    const course = await Course.findById(discussion.courseId).select('teacherId');
    const isTeacher = course && course.teacherId.toString() === userId.toString();

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this discussion.',
      });
    }

    // Validate fields if provided
    if (title !== undefined) {
      if (title.length < 5 || title.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Title must be between 5 and 200 characters.',
        });
      }
      discussion.title = title.trim();
    }

    if (content !== undefined) {
      if (content.length < 10 || content.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Content must be between 10 and 5000 characters.',
        });
      }
      discussion.content = content.trim();
    }

    // Save updated discussion
    await discussion.save();

    // Populate user info
    await discussion.populate('userId', 'fullName email avatar role');

    return res.status(200).json({
      success: true,
      message: 'Discussion updated successfully.',
      data: {
        discussion: {
          _id: discussion._id,
          courseId: discussion.courseId,
          userId: discussion.userId,
          title: discussion.title,
          content: discussion.content,
          isPinned: discussion.isPinned,
          likesCount: discussion.likesCount,
          views: discussion.views,
          createdAt: discussion.createdAt,
          updatedAt: discussion.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update discussion error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: messages,
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update discussion. Please try again later.',
    });
  }
};

/**
 * Delete a discussion and all its comments
 * DELETE /api/discussions/:id
 * @access Protected - Owner or Teacher of the course
 */
export const deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found.',
      });
    }

    // Check ownership (owner or teacher or admin)
    const isOwner = discussion.userId.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    // Determine course teacher
    const Course = (await import("../models/course.model.js")).default;
    const course = await Course.findById(discussion.courseId).select('teacherId');
    const isTeacher = course && course.teacherId.toString() === userId.toString();

    if (!isOwner && !isTeacher && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this discussion.',
      });
    }

    // Delete all comments associated with this discussion
    await Comment.deleteMany({ discussionId: id });

    // Delete the discussion
    await Discussion.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Discussion and all associated comments deleted successfully.',
    });
  } catch (error) {
    console.error('Delete discussion error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete discussion. Please try again later.',
    });
  }
};

/**
 * Toggle like on a discussion
 * PUT /api/discussions/:id/like
 * @access Protected - Authenticated users
 */
export const likeDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found.',
      });
    }

    // Check if user already liked this discussion
    const likeIndex = discussion.likes.findIndex(
      (likeId) => likeId.toString() === userId.toString()
    );

    let isLiked = false;

    if (likeIndex > -1) {
      // User already liked, remove the like
      discussion.likes.splice(likeIndex, 1);
      isLiked = false;
    } else {
      // User hasn't liked, add the like
      discussion.likes.push(userId);
      isLiked = true;
    }

    // Save the discussion
    await discussion.save();

    const likesCount = discussion.likes.length;

    // Emit Socket.IO event for real-time update
    try {
      const io = getSocketIOInstance();
      emitDiscussionLiked(
        io,
        discussion.courseId.toString(),
        id,
        userId,
        likesCount
      );
    } catch (socketError) {
      console.error('Socket.IO error:', socketError.message);
    }

    // Send notification to discussion owner (only if liking, not unliking)
    if (isLiked && discussion.userId.toString() !== userId.toString()) {
      try {
        const liker = {
          id: req.user.id,
          fullName: req.user.fullName,
        };
        await notifyDiscussionLiked(
          discussion.userId.toString(),
          discussion.courseId.toString(),
          discussion,
          liker
        );
      } catch (notificationError) {
        console.error('Notification error:', notificationError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Discussion liked successfully.' : 'Discussion unliked successfully.',
      data: {
        isLiked,
        likesCount,
      },
    });
  } catch (error) {
    console.error('Like discussion error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to like discussion. Please try again later.',
    });
  }
};

/**
 * Toggle pin status on a discussion (Teacher only)
 * PUT /api/discussions/:id/pin
 * @access Protected - Teacher or Admin only
 */
export const pinDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can pin discussions.',
      });
    }

    // Find the discussion
    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found.',
      });
    }

    // TODO: Validate that teacher owns the course when Course model is available
    /*
    const course = await Course.findById(discussion.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
      });
    }

    const isTeacherOfCourse = course.teacherId.toString() === userId.toString();
    if (!isTeacherOfCourse && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to pin discussions in this course.',
      });
    }
    */

    // Toggle pin status
    discussion.isPinned = !discussion.isPinned;
    await discussion.save();

    // Emit Socket.IO event for real-time update (optional)
    // This could notify all course members that a discussion was pinned

    // Send notification if pinned
    if (discussion.isPinned) {
      try {
        const teacher = {
          id: req.user.id,
          fullName: req.user.fullName,
        };
        await notifyDiscussionPinned(
          discussion.courseId.toString(),
          discussion,
          teacher
        );
      } catch (notificationError) {
        console.error('Notification error:', notificationError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: discussion.isPinned
        ? 'Discussion pinned successfully.'
        : 'Discussion unpinned successfully.',
      data: {
        isPinned: discussion.isPinned,
      },
    });
  } catch (error) {
    console.error('Pin discussion error:', error);

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid discussion ID format.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to pin discussion. Please try again later.',
    });
  }
};

export default {
  createDiscussion,
  getDiscussionsByCourse,
  getDiscussionDetail,
  updateDiscussion,
  deleteDiscussion,
  likeDiscussion,
  pinDiscussion,
};
