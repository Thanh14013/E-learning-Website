/**
 * Discussion Namespace Handler
 * Handles real-time discussion events for course discussions
 * Namespace: /discussion
 */

/**
 * Initialize Discussion Namespace
 * @param {Object} io - Socket.IO server instance
 */
export const initializeDiscussionNamespace = (io) => {
  // Create discussion namespace
  const discussionNamespace = io.of('/discussion');

  console.log('📢 Discussion namespace initialized');

  // Namespace connection handler
  discussionNamespace.on('connection', (socket) => {
    console.log(`📢 User ${socket.user.id} connected to discussion namespace`);

    /**
     * Join Discussion Room (Course-specific)
     * Event: discussion:join
     * Payload: { courseId: string }
     */
    socket.on('discussion:join', (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit('discussion:error', { message: 'Course ID is required' });
          return;
        }

        // Join course discussion room
        socket.join(`course:${courseId}`);
        console.log(`📢 User ${socket.user.id} joined discussion room: course:${courseId}`);

        // Notify user of successful join
        socket.emit('discussion:joined', {
          courseId,
          message: 'Successfully joined course discussion',
        });

        // Notify other users in the room
        socket.to(`course:${courseId}`).emit('discussion:user-joined', {
          userId: socket.user.id,
          email: socket.user.email,
        });
      } catch (error) {
        console.error('Error joining discussion:', error.message);
        socket.emit('discussion:error', { message: 'Failed to join discussion' });
      }
    });

    /**
     * Leave Discussion Room
     * Event: discussion:leave
     * Payload: { courseId: string }
     */
    socket.on('discussion:leave', (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit('discussion:error', { message: 'Course ID is required' });
          return;
        }

        // Leave course discussion room
        socket.leave(`course:${courseId}`);
        console.log(`📢 User ${socket.user.id} left discussion room: course:${courseId}`);

        // Notify user of successful leave
        socket.emit('discussion:left', {
          courseId,
          message: 'Successfully left course discussion',
        });

        // Notify other users in the room
        socket.to(`course:${courseId}`).emit('discussion:user-left', {
          userId: socket.user.id,
          email: socket.user.email,
        });
      } catch (error) {
        console.error('Error leaving discussion:', error.message);
        socket.emit('discussion:error', { message: 'Failed to leave discussion' });
      }
    });

    /**
     * New Discussion Created
     * Server emits this event when a new discussion is created via API
     * Event: discussion:created
     * This is typically called from the discussion controller
     */

    /**
     * New Comment Created
     * Server emits this event when a new comment is posted via API
     * Event: discussion:comment-created
     * This is typically called from the comment controller
     */

    /**
     * Discussion Liked
     * Event: discussion:like
     * Payload: { discussionId: string, courseId: string }
     */
    socket.on('discussion:like', (data) => {
      try {
        const { discussionId, courseId } = data;

        if (!discussionId || !courseId) {
          socket.emit('discussion:error', { message: 'Discussion ID and Course ID are required' });
          return;
        }

        // Broadcast like event to all users in the course room
        discussionNamespace.to(`course:${courseId}`).emit('discussion:liked', {
          discussionId,
          userId: socket.user.id,
          timestamp: new Date().toISOString(),
        });

        console.log(`👍 User ${socket.user.id} liked discussion ${discussionId}`);
      } catch (error) {
        console.error('Error liking discussion:', error.message);
        socket.emit('discussion:error', { message: 'Failed to like discussion' });
      }
    });

    /**
     * Comment Liked
     * Event: discussion:comment-like
     * Payload: { commentId: string, courseId: string }
     */
    socket.on('discussion:comment-like', (data) => {
      try {
        const { commentId, courseId } = data;

        if (!commentId || !courseId) {
          socket.emit('discussion:error', { message: 'Comment ID and Course ID are required' });
          return;
        }

        // Broadcast comment like event to all users in the course room
        discussionNamespace.to(`course:${courseId}`).emit('discussion:comment-liked', {
          commentId,
          userId: socket.user.id,
          timestamp: new Date().toISOString(),
        });

        console.log(`👍 User ${socket.user.id} liked comment ${commentId}`);
      } catch (error) {
        console.error('Error liking comment:', error.message);
        socket.emit('discussion:error', { message: 'Failed to like comment' });
      }
    });

    /**
     * User is Typing
     * Event: discussion:typing
     * Payload: { courseId: string, discussionId: string }
     */
    socket.on('discussion:typing', (data) => {
      try {
        const { courseId, discussionId } = data;

        if (!courseId) {
          return;
        }

        // Broadcast typing indicator to other users in the room
        socket.to(`course:${courseId}`).emit('discussion:user-typing', {
          userId: socket.user.id,
          email: socket.user.email,
          discussionId,
        });
      } catch (error) {
        console.error('Error broadcasting typing:', error.message);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`📢 User ${socket.user.id} disconnected from discussion namespace`);
    });
  });

  return discussionNamespace;
};

/**
 * Helper function to emit new discussion created event to course room
 * Can be called from controllers/services
 * @param {Object} io - Socket.IO server instance
 * @param {string} courseId - Course ID
 * @param {Object} discussion - Discussion data
 */
export const emitDiscussionCreated = (io, courseId, discussion) => {
  const discussionNamespace = io.of('/discussion');
  const courseRoom = `course:${courseId}`;

  discussionNamespace.to(courseRoom).emit('discussion:created', {
    discussion,
    timestamp: new Date().toISOString(),
  });

  console.log(`📢 Discussion created event emitted to course ${courseId}`);
};

/**
 * Helper function to emit new comment created event to course room
 * @param {Object} io - Socket.IO server instance
 * @param {string} courseId - Course ID
 * @param {Object} comment - Comment data
 * @param {string} discussionId - Discussion ID
 */
export const emitCommentCreated = (io, courseId, comment, discussionId) => {
  const discussionNamespace = io.of('/discussion');
  const courseRoom = `course:${courseId}`;

  discussionNamespace.to(courseRoom).emit('comment:created', {
    comment,
    discussionId,
    timestamp: new Date().toISOString(),
  });

  console.log(`📢 Comment created event emitted to course ${courseId}`);
};

/**
 * Helper function to emit discussion liked event to course room
 * @param {Object} io - Socket.IO server instance
 * @param {string} courseId - Course ID
 * @param {string} discussionId - Discussion ID
 * @param {string} userId - User ID who liked
 * @param {number} likesCount - Updated likes count
 */
export const emitDiscussionLiked = (io, courseId, discussionId, userId, likesCount) => {
  const discussionNamespace = io.of('/discussion');
  const courseRoom = `course:${courseId}`;

  discussionNamespace.to(courseRoom).emit('discussion:liked', {
    discussionId,
    userId,
    likesCount,
    timestamp: new Date().toISOString(),
  });

  console.log(`👍 Discussion ${discussionId} liked event emitted to course ${courseId}`);
};

/**
 * Helper function to emit comment liked event to course room
 * @param {Object} io - Socket.IO server instance
 * @param {string} courseId - Course ID
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID who liked
 * @param {number} likesCount - Updated likes count
 */
export const emitCommentLiked = (io, courseId, commentId, userId, likesCount) => {
  const discussionNamespace = io.of('/discussion');
  const courseRoom = `course:${courseId}`;

  discussionNamespace.to(courseRoom).emit('comment:liked', {
    commentId,
    userId,
    likesCount,
    timestamp: new Date().toISOString(),
  });

  console.log(`👍 Comment ${commentId} liked event emitted to course ${courseId}`);
};

export default initializeDiscussionNamespace;
