import { getSocketIOInstance } from "../config/socket.config.js";
import {
  sendNotificationToUser,
  sendNotificationToCourse,
} from "../socket/index.js";
import Notification from "../models/notification.model.js";
// Email service import removed - notifications are in-app only

/**
 * Notification Service
 * Handles creation and delivery of notifications via Socket.IO and database
 * Supports real-time notifications and email notifications
 */

/**
 * Helper function to create and send notification
 * @param {string} userId - Target user ID
 * @param {Object} notificationData - Notification data
 * @param {boolean} sendEmailNotification - Whether to send email
 * @param {string} userEmail - User email (optional)
 * @param {string} userName - User name (optional)
 */
const createAndSendNotification = async (
  userId,
  notificationData,
  sendEmailNotification = false,
  userEmail = null,
  userName = null
) => {
  try {
    // Save notification to database
    const notification = await Notification.create({
      userId,
      ...notificationData,
    });

    // Send real-time notification via Socket.IO
    const io = getSocketIOInstance();
    if (io) {
      sendNotificationToUser(io, userId, {
        _id: notification._id,
        ...notificationData,
      });
    }

    // Email notifications disabled - use in-app notifications only
    // if (sendEmailNotification && userEmail && userName) {
    //   await sendEmail({
    //     to: userEmail,
    //     subject: notificationData.title,
    //     html: `...`,
    //   });
    // }

    return notification;
  } catch (error) {
    console.error("Error creating and sending notification:", error.message);
    throw error;
  }
};

/**
 * Helper function to create and send notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data
 */
const createAndSendBatchNotifications = async (userIds, notificationData) => {
  try {
    // Create notifications for all users
    const notifications = userIds.map((userId) => ({
      userId,
      ...notificationData,
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    // Send real-time notifications via Socket.IO
    const io = getSocketIOInstance();
    if (io) {
      userIds.forEach((userId) => {
        sendNotificationToUser(io, userId, notificationData);
      });
    }

    return createdNotifications;
  } catch (error) {
    console.error("Error creating batch notifications:", error.message);
    throw error;
  }
};

/**
 * Send notification when a user enrolls in a course
 * @param {string} studentId - Student user ID
 * @param {Object} student - Student user object
 * @param {string} teacherId - Teacher user ID
 * @param {Object} teacher - Teacher user object
 * @param {Object} course - Course object
 */
export const notifyEnrollment = async (
  studentId,
  student,
  teacherId,
  teacher,
  course
) => {
  try {
    // Notify teacher about new enrollment
    await createAndSendNotification(
      teacherId,
      {
        type: "course",
        title: "New Student Enrolled",
        content: `${student.fullName} has enrolled in your course "${course.title}"`,
        link: `/courses/${course._id}/students`,
        metadata: {
          courseId: course._id,
          studentId,
          action: "enrollment",
        },
      },
      false
    );

    // Notify student about successful enrollment
    await createAndSendNotification(
      studentId,
      {
        type: "course",
        title: "Course Enrollment Successful",
        content: `You have successfully enrolled in "${course.title}"`,
        link: `/courses/${course._id}`,
        metadata: {
          courseId: course._id,
          teacherId,
          action: "enrollment_confirmation",
        },
      },
      false
    );

    console.log(`📚 Enrollment notification sent for course ${course._id}`);
  } catch (error) {
    console.error("Error sending enrollment notification:", error.message);
  }
};

/**
 * Send notification when a quiz is assigned/published
 * @param {Array} enrolledStudents - Array of enrolled student objects
 * @param {Object} quiz - Quiz object
 * @param {Object} course - Course object
 */
export const notifyQuizAssigned = async (enrolledStudents, quiz, course) => {
  try {
    const notificationData = {
      type: "quiz_assigned",
      title: "New Quiz Available",
      content: `A new quiz "${quiz.title}" has been published in "${course.title}"`,
      link: `/courses/${course._id}/quizzes/${quiz._id}`,
      metadata: {
        courseId: course._id,
        quizId: quiz._id,
        dueDate: quiz.dueDate || null,
      },
    };

    // Get student user IDs
    const studentIds = enrolledStudents.map((student) =>
      student._id.toString()
    );

    // Send batch notifications
    await createAndSendBatchNotifications(studentIds, notificationData);

    // Email notifications disabled - use in-app notifications only

    console.log(
      `📝 Quiz assignment notification sent to ${studentIds.length} students`
    );
  } catch (error) {
    console.error("Error sending quiz assignment notification:", error.message);
  }
};

/**
 * Send notification when a discussion receives a reply
 * @param {string} discussionOwnerId - User ID of discussion owner
 * @param {Object} discussionOwner - Discussion owner user object
 * @param {Object} comment - Comment object
 * @param {Object} commenter - User who created the comment
 * @param {Object} discussion - Discussion object
 * @param {string} courseId - Course ID
 */
export const notifyDiscussionReply = async (
  discussionOwnerId,
  discussionOwner,
  comment,
  commenter,
  discussion,
  courseId
) => {
  try {
    // Don't notify if replying to own discussion
    if (discussionOwnerId.toString() === commenter._id.toString()) {
      return;
    }

    await createAndSendNotification(
      discussionOwnerId,
      {
        type: "discussion",
        title: "New Reply to Your Discussion",
        content: `${commenter.fullName} replied to your discussion "${discussion.title}"`,
        link: `/courses/${courseId}/discussions/${discussion._id}`,
        metadata: {
          courseId,
          discussionId: discussion._id,
          commentId: comment._id,
          commenterId: commenter._id,
        },
      },
      false
    );
    discussionOwner.email, discussionOwner.fullName;

    console.log(
      `💬 Discussion reply notification sent to ${discussionOwnerId}`
    );
  } catch (error) {
    console.error(
      "Error sending discussion reply notification:",
      error.message
    );
  }
};

/**
 * Send notification when a quiz is graded
 * @param {string} studentId - Student user ID
 * @param {Object} student - Student user object
 * @param {Object} quiz - Quiz object
 * @param {Object} quizAttempt - Quiz attempt object with score
 * @param {Object} course - Course object
 */
export const notifyGrade = async (
  studentId,
  student,
  quiz,
  quizAttempt,
  course
) => {
  try {
    const passed = quizAttempt.isPassed ? "passed" : "failed";
    const emoji = quizAttempt.isPassed ? "🎉" : "📚";

    await createAndSendNotification(
      studentId,
      {
        type: "quiz_graded",
        title: `Quiz ${passed.charAt(0).toUpperCase() + passed.slice(1)}`,
        content: `${emoji} You ${passed} the quiz "${quiz.title}" with a score of ${quizAttempt.score}/${quiz.totalPoints}`,
        link: `/courses/${course._id}/quizzes/${quiz._id}/results/${quizAttempt._id}`,
        metadata: {
          courseId: course._id,
          quizId: quiz._id,
          attemptId: quizAttempt._id,
          score: quizAttempt.score,
          passed: quizAttempt.isPassed,
        },
      },
      true,
      student.email,
      student.fullName
    );

    console.log(`📊 Grade notification sent to student ${studentId}`);
  } catch (error) {
    console.error("Error sending grade notification:", error.message);
  }
};

/**
 * Send notification when a live session is scheduled
 * @param {Array} enrolledStudents - Array of enrolled student objects
 * @param {Object} session - Live session object
 * @param {Object} course - Course object
 */
export const notifySessionScheduled = async (
  enrolledStudents,
  session,
  course
) => {
  try {
    const scheduledDate = new Date(session.scheduledAt).toLocaleString();

    const notificationData = {
      type: "session",
      title: "Live Session Scheduled",
      content: `A live session "${session.title}" is scheduled for ${scheduledDate} in "${course.title}"`,
      link: `/courses/${course._id}/sessions/${session._id}`,
      metadata: {
        courseId: course._id,
        sessionId: session._id,
        scheduledAt: session.scheduledAt,
      },
    };

    // Get student user IDs
    const studentIds = enrolledStudents.map((student) =>
      student._id.toString()
    );

    // Send batch notifications
    await createAndSendBatchNotifications(studentIds, notificationData);

    console.log(
      `🎥 Session scheduled notification sent to ${studentIds.length} students`
    );
  } catch (error) {
    console.error(
      "Error sending session scheduled notification:",
      error.message
    );
  }
};

/**
 * Send notification when a live session starts
 * @param {Array} enrolledStudents - Array of enrolled student objects
 * @param {Object} session - Live session object
 * @param {Object} course - Course object
 */
export const notifySessionStarted = async (
  enrolledStudents,
  session,
  course
) => {
  try {
    const notificationData = {
      type: "session",
      title: "Live Session Started",
      content: `The live session "${session.title}" has started in "${course.title}". Join now!`,
      link: `/courses/${course._id}/sessions/${session._id}/join`,
      metadata: {
        courseId: course._id,
        sessionId: session._id,
        startedAt: new Date(),
      },
    };

    // Get student user IDs
    const studentIds = enrolledStudents.map((student) =>
      student._id.toString()
    );

    // Send batch notifications
    await createAndSendBatchNotifications(studentIds, notificationData);

    // Send real-time notification to course room
    const io = getSocketIOInstance();
    if (io) {
      sendNotificationToCourse(io, course._id.toString(), {
        ...notificationData,
        urgent: true,
      });
    }

    console.log(
      `🔴 Session started notification sent to ${studentIds.length} students`
    );
  } catch (error) {
    console.error("Error sending session started notification:", error.message);
  }
};

/**
 * Send reminder notification before live session starts
 * @param {Array} enrolledStudents - Array of enrolled student objects
 * @param {Object} session - Live session object
 * @param {Object} course - Course object
 * @param {number} minutesBefore - Minutes before session starts
 */
export const notifySessionReminder = async (
  enrolledStudents,
  session,
  course,
  minutesBefore = 5
) => {
  try {
    const notificationData = {
      type: "session",
      title: `Session Starting in ${minutesBefore} Minutes`,
      content: `Reminder: The live session "${session.title}" in "${course.title}" starts in ${minutesBefore} minutes`,
      link: `/courses/${course._id}/sessions/${session._id}/join`,
      metadata: {
        courseId: course._id,
        sessionId: session._id,
        scheduledAt: session.scheduledAt,
        reminderMinutes: minutesBefore,
      },
    };

    // Get student user IDs
    const studentIds = enrolledStudents.map((student) =>
      student._id.toString()
    );

    // Send batch notifications
    await createAndSendBatchNotifications(studentIds, notificationData);

    console.log(`⏰ Session reminder sent to ${studentIds.length} students`);
  } catch (error) {
    console.error(
      "Error sending session reminder notification:",
      error.message
    );
  }
};

/**
 * Send notification when a user is mentioned in a comment
 * @param {string} mentionedUserId - User ID of mentioned user
 * @param {Object} mentionedUser - Mentioned user object
 * @param {Object} comment - Comment object
 * @param {Object} commenter - User who mentioned
 * @param {Object} discussion - Discussion object
 * @param {string} courseId - Course ID
 */
export const notifyMention = async (
  mentionedUserId,
  mentionedUser,
  comment,
  commenter,
  discussion,
  courseId
) => {
  try {
    // Don't notify if mentioning self
    if (mentionedUserId.toString() === commenter._id.toString()) {
      return;
    }

    await createAndSendNotification(
      mentionedUserId,
      {
        type: "discussion",
        title: "You Were Mentioned",
        content: `${commenter.fullName} mentioned you in "${discussion.title}"`,
        link: `/courses/${courseId}/discussions/${discussion._id}`,
        metadata: {
          courseId,
          discussionId: discussion._id,
          commentId: comment._id,
          mentionedBy: commenter._id,
        },
      },
      true,
      mentionedUser.email,
      mentionedUser.fullName
    );

    console.log(`@️ Mention notification sent to ${mentionedUserId}`);
  } catch (error) {
    console.error("Error sending mention notification:", error.message);
  }
};

/**
 * Send notification when a course is updated
 * @param {Array} enrolledStudents - Array of enrolled student objects
 * @param {Object} course - Course object
 * @param {string} updateType - Type of update (e.g., 'new_chapter', 'new_lesson')
 * @param {string} updateDetails - Details of the update
 */
export const notifyCourseUpdate = async (
  enrolledStudents,
  course,
  updateType,
  updateDetails
) => {
  try {
    const notificationData = {
      type: "course",
      title: "Course Updated",
      content: `"${course.title}" has been updated: ${updateDetails}`,
      link: `/courses/${course._id}`,
      metadata: {
        courseId: course._id,
        updateType,
      },
    };

    // Get student user IDs
    const studentIds = enrolledStudents.map((student) =>
      student._id.toString()
    );

    // Send batch notifications
    await createAndSendBatchNotifications(studentIds, notificationData);

    console.log(
      `🔄 Course update notification sent to ${studentIds.length} students`
    );
  } catch (error) {
    console.error("Error sending course update notification:", error.message);
  }
};

/**
 * Send notification when a new discussion is created
 * @param {string} courseId - Course ID
 * @param {Object} discussion - Discussion object
 * @param {Object} creator - User who created the discussion
 */
export const notifyDiscussionCreated = async (
  courseId,
  discussion,
  creator
) => {
  try {
    const io = getSocketIOInstance();

    // Notification data
    const notification = {
      type: "discussion",
      title: "New Discussion Created",
      content: `${creator.fullName} started a new discussion: "${discussion.title}"`,
      link: `/discussions/${discussion._id}`,
      metadata: {
        courseId,
        discussionId: discussion._id,
        createdBy: creator._id,
      },
    };

    // Send real-time notification to all users in the course
    sendNotificationToCourse(io, courseId, notification);

    console.log(
      `📢 Discussion creation notification sent for course ${courseId}`
    );
  } catch (error) {
    console.error(
      "Error sending discussion creation notification:",
      error.message
    );
  }
};

/**
 * Send notification when a new comment is posted on a discussion
 * @param {string} courseId - Course ID
 * @param {string} discussionOwnerId - User ID of discussion owner
 * @param {Object} comment - Comment object
 * @param {Object} commenter - User who created the comment
 * @param {string} discussionTitle - Title of the discussion
 */
export const notifyCommentCreated = async (
  courseId,
  discussionOwnerId,
  comment,
  commenter,
  discussionTitle
) => {
  try {
    const io = getSocketIOInstance();

    // Notification data for discussion owner
    const notification = {
      type: "discussion",
      title: "New Comment on Your Discussion",
      content: `${commenter.fullName} commented on your discussion: "${discussionTitle}"`,
      link: `/discussions/${comment.discussionId}`,
      metadata: {
        courseId,
        discussionId: comment.discussionId,
        commentId: comment._id,
        createdBy: commenter._id,
      },
    };

    // Send notification to discussion owner (if not the commenter)
    if (discussionOwnerId.toString() !== commenter._id.toString()) {
      sendNotificationToUser(io, discussionOwnerId.toString(), notification);
    }

    console.log(`📢 Comment creation notification sent to discussion owner`);
  } catch (error) {
    console.error(
      "Error sending comment creation notification:",
      error.message
    );
  }
};

/**
 * Send notification when a user replies to a comment
 * @param {string} courseId - Course ID
 * @param {string} parentCommentOwnerId - User ID of parent comment owner
 * @param {Object} reply - Reply comment object
 * @param {Object} replier - User who created the reply
 * @param {string} discussionTitle - Title of the discussion
 */
export const notifyCommentReply = async (
  courseId,
  parentCommentOwnerId,
  reply,
  replier,
  discussionTitle
) => {
  try {
    const io = getSocketIOInstance();

    // Notification data for parent comment owner
    const notification = {
      type: "discussion",
      title: "New Reply to Your Comment",
      content: `${replier.fullName} replied to your comment on "${discussionTitle}"`,
      link: `/discussions/${reply.discussionId}`,
      metadata: {
        courseId,
        discussionId: reply.discussionId,
        commentId: reply._id,
        parentCommentId: reply.parentId,
        createdBy: replier._id,
      },
    };

    // Send notification to parent comment owner (if not the replier)
    if (parentCommentOwnerId.toString() !== replier._id.toString()) {
      sendNotificationToUser(io, parentCommentOwnerId.toString(), notification);
    }

    console.log(`📢 Comment reply notification sent to parent comment owner`);
  } catch (error) {
    console.error("Error sending comment reply notification:", error.message);
  }
};

/**
 * Send notification when a discussion is liked
 * @param {string} discussionOwnerId - User ID of discussion owner
 * @param {string} courseId - Course ID
 * @param {Object} discussion - Discussion object
 * @param {Object} liker - User who liked the discussion
 */
export const notifyDiscussionLiked = async (
  discussionOwnerId,
  courseId,
  discussion,
  liker
) => {
  try {
    const io = getSocketIOInstance();

    // Notification data
    const notification = {
      type: "discussion",
      title: "Discussion Liked",
      content: `${liker.fullName} liked your discussion: "${discussion.title}"`,
      link: `/discussions/${discussion._id}`,
      metadata: {
        courseId,
        discussionId: discussion._id,
        likedBy: liker._id,
      },
    };

    // Send notification to discussion owner (if not the liker)
    if (discussionOwnerId.toString() !== liker._id.toString()) {
      sendNotificationToUser(io, discussionOwnerId.toString(), notification);
    }

    console.log(`👍 Discussion liked notification sent to discussion owner`);
  } catch (error) {
    console.error(
      "Error sending discussion liked notification:",
      error.message
    );
  }
};

/**
 * Send notification when a discussion is pinned by teacher
 * @param {string} courseId - Course ID
 * @param {Object} discussion - Discussion object
 * @param {Object} teacher - Teacher who pinned the discussion
 */
export const notifyDiscussionPinned = async (courseId, discussion, teacher) => {
  try {
    const io = getSocketIOInstance();

    // Notification data
    const notification = {
      type: "discussion",
      title: "Discussion Pinned",
      content: `A discussion has been pinned: "${discussion.title}"`,
      link: `/discussions/${discussion._id}`,
      metadata: {
        courseId,
        discussionId: discussion._id,
        pinnedBy: teacher._id,
      },
    };

    // Send notification to all course members
    sendNotificationToCourse(io, courseId, notification);

    console.log(`📌 Discussion pinned notification sent to course ${courseId}`);
  } catch (error) {
    console.error(
      "Error sending discussion pinned notification:",
      error.message
    );
  }
};

export default {
  notifyEnrollment,
  notifyQuizAssigned,
  notifyDiscussionReply,
  notifyGrade,
  notifySessionScheduled,
  notifySessionStarted,
  notifySessionReminder,
  notifyMention,
  notifyCourseUpdate,
  notifyDiscussionCreated,
  notifyCommentCreated,
  notifyCommentReply,
  notifyDiscussionLiked,
  notifyDiscussionPinned,
};
