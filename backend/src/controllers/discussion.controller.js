import Discussion from '../models/discussion.model.js';
import User from '../models/user.model.js';
import { getSocketIOInstance } from '../config/socket.config.js';
import { emitDiscussionCreated } from '../socket/index.js';
import { notifyDiscussionCreated } from '../services/notification.service.js';

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
    if (content.length < 10 || content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Content must be between 10 and 5000 characters.',
      });
    }

    // TODO: Validate that user is enrolled in the course or is the teacher
    // This will be implemented when Course model is available
    // For now, we'll allow any authenticated user to create discussions
    
    // Note: When Course model is available, add this validation:
    /*
    const course = await Course.findById(courseId);
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
        message: 'You must be enrolled in this course or be the teacher to create discussions.',
      });
    }
    */

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

export default {
  createDiscussion,
};
