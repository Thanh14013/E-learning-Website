import { getSocketIOInstance } from '../config/socket.config.js';
import { sendNotificationToUser, sendNotificationToCourse } from '../socket/index.js';

/**
 * Notification Service
 * Handles creation and delivery of notifications via Socket.IO and database
 * Supports real-time notifications and email notifications
 */

/**
 * Send notification when a new discussion is created
 * @param {string} courseId - Course ID
 * @param {Object} discussion - Discussion object
 * @param {Object} creator - User who created the discussion
 */
export const notifyDiscussionCreated = async (courseId, discussion, creator) => {
  try {
    const io = getSocketIOInstance();

    // Notification data
    const notification = {
      type: 'discussion_created',
      title: 'New Discussion Created',
      content: `${creator.fullName} started a new discussion: "${discussion.title}"`,
      link: `/courses/${courseId}/discussions/${discussion._id}`,
      courseId,
      discussionId: discussion._id,
      createdBy: creator.fullName,
    };

    // Send real-time notification to all users in the course
    sendNotificationToCourse(io, courseId, notification);

    console.log(`📢 Discussion creation notification sent for course ${courseId}`);
  } catch (error) {
    console.error('Error sending discussion creation notification:', error.message);
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
      type: 'comment_created',
      title: 'New Comment on Your Discussion',
      content: `${commenter.fullName} commented on your discussion: "${discussionTitle}"`,
      link: `/courses/${courseId}/discussions/${comment.discussionId}`,
      courseId,
      discussionId: comment.discussionId,
      commentId: comment._id,
      createdBy: commenter.fullName,
    };

    // Send notification to discussion owner (if not the commenter)
    if (discussionOwnerId.toString() !== commenter.id.toString()) {
      sendNotificationToUser(io, discussionOwnerId.toString(), notification);
    }

    console.log(`📢 Comment creation notification sent to discussion owner`);
  } catch (error) {
    console.error('Error sending comment creation notification:', error.message);
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
      type: 'comment_reply',
      title: 'New Reply to Your Comment',
      content: `${replier.fullName} replied to your comment on "${discussionTitle}"`,
      link: `/courses/${courseId}/discussions/${reply.discussionId}`,
      courseId,
      discussionId: reply.discussionId,
      commentId: reply._id,
      parentCommentId: reply.parentId,
      createdBy: replier.fullName,
    };

    // Send notification to parent comment owner (if not the replier)
    if (parentCommentOwnerId.toString() !== replier.id.toString()) {
      sendNotificationToUser(io, parentCommentOwnerId.toString(), notification);
    }

    console.log(`📢 Comment reply notification sent to parent comment owner`);
  } catch (error) {
    console.error('Error sending comment reply notification:', error.message);
  }
};

/**
 * Send notification when a discussion is liked
 * @param {string} discussionOwnerId - User ID of discussion owner
 * @param {string} courseId - Course ID
 * @param {Object} discussion - Discussion object
 * @param {Object} liker - User who liked the discussion
 */
export const notifyDiscussionLiked = async (discussionOwnerId, courseId, discussion, liker) => {
  try {
    const io = getSocketIOInstance();

    // Notification data
    const notification = {
      type: 'discussion_liked',
      title: 'Discussion Liked',
      content: `${liker.fullName} liked your discussion: "${discussion.title}"`,
      link: `/courses/${courseId}/discussions/${discussion._id}`,
      courseId,
      discussionId: discussion._id,
      likedBy: liker.fullName,
    };

    // Send notification to discussion owner (if not the liker)
    if (discussionOwnerId.toString() !== liker.id.toString()) {
      sendNotificationToUser(io, discussionOwnerId.toString(), notification);
    }

    console.log(`👍 Discussion liked notification sent to discussion owner`);
  } catch (error) {
    console.error('Error sending discussion liked notification:', error.message);
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
      type: 'discussion_pinned',
      title: 'Discussion Pinned',
      content: `A discussion has been pinned: "${discussion.title}"`,
      link: `/courses/${courseId}/discussions/${discussion._id}`,
      courseId,
      discussionId: discussion._id,
      pinnedBy: teacher.fullName,
    };

    // Send notification to all course members
    sendNotificationToCourse(io, courseId, notification);

    console.log(`📌 Discussion pinned notification sent to course ${courseId}`);
  } catch (error) {
    console.error('Error sending discussion pinned notification:', error.message);
  }
};

export default {
  notifyDiscussionCreated,
  notifyCommentCreated,
  notifyCommentReply,
  notifyDiscussionLiked,
  notifyDiscussionPinned,
};
