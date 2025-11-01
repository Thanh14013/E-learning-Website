/**
 * Progress Namespace Handler
 * Handles real-time lesson progress updates
 * Namespace: /progress
 */

/**
 * Initialize Progress Namespace
 * @param {Object} io - Socket.IO server instance
 */
export const initializeProgressNamespace = (io) => {
  // Create progress namespace
  const progressNamespace = io.of('/progress');

  console.log('📊 Progress namespace initialized');

  // Namespace connection handler
  progressNamespace.on('connection', (socket) => {
    console.log(`📊 User ${socket.user.id} connected to progress namespace`);

    /**
     * Join Progress Room (Course-specific)
     * Event: progress:join
     * Payload: { courseId: string }
     */
    socket.on('progress:join', (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit('progress:error', { message: 'Course ID is required' });
          return;
        }

        // Join course progress room
        const courseRoom = `course:${courseId}`;
        socket.join(courseRoom);

        // Also join user-specific progress room
        const userRoom = `user:${socket.user.id}`;
        socket.join(userRoom);

        console.log(`📊 User ${socket.user.id} joined progress room: ${courseRoom}`);

        // Notify user of successful join
        socket.emit('progress:joined', {
          courseId,
          userId: socket.user.id,
          message: 'Successfully joined progress tracking',
        });
      } catch (error) {
        console.error('Error joining progress room:', error.message);
        socket.emit('progress:error', { message: 'Failed to join progress tracking' });
      }
    });

    /**
     * Leave Progress Room
     * Event: progress:leave
     * Payload: { courseId: string }
     */
    socket.on('progress:leave', (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit('progress:error', { message: 'Course ID is required' });
          return;
        }

        // Leave course progress room
        const courseRoom = `course:${courseId}`;
        socket.leave(courseRoom);

        console.log(`📊 User ${socket.user.id} left progress room: ${courseRoom}`);

        // Notify user
        socket.emit('progress:left', {
          courseId,
          message: 'Successfully left progress tracking',
        });
      } catch (error) {
        console.error('Error leaving progress room:', error.message);
        socket.emit('progress:error', { message: 'Failed to leave progress tracking' });
      }
    });

    /**
     * Update Video Progress
     * Event: progress:video-update
     * Payload: { courseId: string, lessonId: string, watchedDuration: number, totalDuration: number }
     */
    socket.on('progress:video-update', (data) => {
      try {
        const { courseId, lessonId, watchedDuration, totalDuration } = data;

        if (!courseId || !lessonId || watchedDuration === undefined) {
          socket.emit('progress:error', { message: 'Invalid progress data' });
          return;
        }

        // Calculate percentage
        const percentage = totalDuration ? Math.round((watchedDuration / totalDuration) * 100) : 0;

        // Emit progress update back to user for confirmation
        socket.emit('progress:video-updated', {
          lessonId,
          courseId,
          watchedDuration,
          totalDuration,
          percentage,
          timestamp: new Date().toISOString(),
        });

        console.log(`📊 User ${socket.user.id} video progress: ${percentage}% on lesson ${lessonId}`);
      } catch (error) {
        console.error('Error updating video progress:', error.message);
        socket.emit('progress:error', { message: 'Failed to update progress' });
      }
    });

    /**
     * Lesson Completed
     * Event: progress:lesson-completed
     * Payload: { courseId: string, lessonId: string }
     */
    socket.on('progress:lesson-completed', (data) => {
      try {
        const { courseId, lessonId } = data;

        if (!courseId || !lessonId) {
          socket.emit('progress:error', { message: 'Course ID and Lesson ID are required' });
          return;
        }

        // Emit completion confirmation to user
        socket.emit('progress:lesson-completion-confirmed', {
          lessonId,
          courseId,
          userId: socket.user.id,
          timestamp: new Date().toISOString(),
        });

        // Notify course room about user's completion (for teacher/admin dashboard)
        socket.to(`course:${courseId}`).emit('progress:student-completed-lesson', {
          userId: socket.user.id,
          lessonId,
          courseId,
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ User ${socket.user.id} completed lesson ${lessonId}`);
      } catch (error) {
        console.error('Error marking lesson as completed:', error.message);
        socket.emit('progress:error', { message: 'Failed to mark lesson as completed' });
      }
    });

    /**
     * Course Completed
     * Event: progress:course-completed
     * Payload: { courseId: string }
     */
    socket.on('progress:course-completed', (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit('progress:error', { message: 'Course ID is required' });
          return;
        }

        // Emit course completion confirmation
        socket.emit('progress:course-completion-confirmed', {
          courseId,
          userId: socket.user.id,
          message: 'Congratulations! Course completed!',
          timestamp: new Date().toISOString(),
        });

        // Notify course room (for teacher/admin)
        socket.to(`course:${courseId}`).emit('progress:student-completed-course', {
          userId: socket.user.id,
          courseId,
          timestamp: new Date().toISOString(),
        });

        console.log(`🎉 User ${socket.user.id} completed course ${courseId}`);
      } catch (error) {
        console.error('Error marking course as completed:', error.message);
        socket.emit('progress:error', { message: 'Failed to mark course as completed' });
      }
    });

    /**
     * Request Current Progress
     * Event: progress:get-current
     * Payload: { courseId: string }
     */
    socket.on('progress:get-current', (data) => {
      try {
        const { courseId } = data;

        if (!courseId) {
          socket.emit('progress:error', { message: 'Course ID is required' });
          return;
        }

        // This would typically query the database
        // Emit request acknowledgment
        socket.emit('progress:current-requested', {
          courseId,
          userId: socket.user.id,
        });

        console.log(`📊 User ${socket.user.id} requested current progress for course ${courseId}`);
      } catch (error) {
        console.error('Error getting current progress:', error.message);
        socket.emit('progress:error', { message: 'Failed to get current progress' });
      }
    });

    /**
     * Quiz Progress Update
     * Event: progress:quiz-update
     * Payload: { courseId: string, quizId: string, score: number, isPassed: boolean }
     */
    socket.on('progress:quiz-update', (data) => {
      try {
        const { courseId, quizId, score, isPassed } = data;

        if (!courseId || !quizId || score === undefined || isPassed === undefined) {
          socket.emit('progress:error', { message: 'Invalid quiz progress data' });
          return;
        }

        // Emit quiz progress update confirmation
        socket.emit('progress:quiz-updated', {
          quizId,
          courseId,
          score,
          isPassed,
          timestamp: new Date().toISOString(),
        });

        // Notify course room
        socket.to(`course:${courseId}`).emit('progress:student-quiz-completed', {
          userId: socket.user.id,
          quizId,
          courseId,
          score,
          isPassed,
          timestamp: new Date().toISOString(),
        });

        console.log(`📝 User ${socket.user.id} completed quiz ${quizId} - Score: ${score}, Passed: ${isPassed}`);
      } catch (error) {
        console.error('Error updating quiz progress:', error.message);
        socket.emit('progress:error', { message: 'Failed to update quiz progress' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`📊 User ${socket.user.id} disconnected from progress namespace`);
    });
  });

  return progressNamespace;
};

/**
 * Helper function to emit progress update to specific user
 * Can be called from controllers/services after database update
 * @param {Object} io - Socket.IO server instance
 * @param {string} userId - Target user ID
 * @param {Object} progressData - Progress data
 */
export const emitProgressUpdate = (io, userId, progressData) => {
  const progressNamespace = io.of('/progress');
  const userRoom = `user:${userId}`;

  progressNamespace.to(userRoom).emit('progress:update', {
    ...progressData,
    timestamp: new Date().toISOString(),
  });

  console.log(`📊 Progress update emitted to user ${userId}`);
};

/**
 * Helper function to emit course completion to user
 * @param {Object} io - Socket.IO server instance
 * @param {string} userId - Target user ID
 * @param {string} courseId - Course ID
 */
export const emitCourseCompletion = (io, userId, courseId) => {
  const progressNamespace = io.of('/progress');
  const userRoom = `user:${userId}`;

  progressNamespace.to(userRoom).emit('progress:course-completed', {
    courseId,
    userId,
    message: 'Congratulations! You have completed this course!',
    timestamp: new Date().toISOString(),
  });

  console.log(`🎉 Course completion emitted to user ${userId}`);
};

export default {
  initializeProgressNamespace,
  emitProgressUpdate,
  emitCourseCompletion,
};
