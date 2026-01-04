import Course from "../models/course.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

/**
 * Check if a student is enrolled in any course of a teacher
 * @param {string} studentId
 * @param {string} teacherId
 * @returns {Promise<boolean>}
 */
export const checkEnrollment = async (studentId, teacherId) => {
  // Check if there is any course where:
  // 1. Created by teacherId
  // 2. Contains studentId in enrolledStudents
  const enrollment = await Course.findOne({
    teacherId: teacherId,
    enrolledStudents: studentId,
  });

  return !!enrollment;
};

/**
 * Create or get existing conversation between participants
 * @param {string} senderId
 * @param {string} receiverId
 * @returns {Promise<Object>} Conversation object
 */
export const getOrCreateConversation = async (senderId, receiverId) => {
  // Check strict authorization first
  // We need to know who is who. But usually we just check if they have a relation.
  // Ideally, one is student, one is teacher.
  // Let's check both directions to be safe, or just check "are they connected?"
  const isEnrolled =
    (await checkEnrollment(senderId, receiverId)) ||
    (await checkEnrollment(receiverId, senderId));

  if (!isEnrolled) {
    throw new Error("Unauthorized: You can only chat with your enrolled teachers/students.");
  }

  // Find existing conversation
  // "participants" must contain both IDs.
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
    isGroup: false,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
      unreadCounts: {
        [senderId]: 0,
        [receiverId]: 0,
      },
      // Initial lastMessage is null or empty
    });
  }

  return conversation;
};

/**
 * Save message and update conversation atomically
 * @param {string} conversationId
 * @param {string} senderId
 * @param {string} content
 * @returns {Promise<Object>} Created message
 */
/**
 * Save message and update conversation atomically
 * @param {string} conversationId
 * @param {string} senderId
 * @param {string} content
 * @param {Array} attachments - Optional array of attachments
 * @returns {Promise<Object>} Created message
 */
export const saveMessage = async (conversationId, senderId, content, attachments = []) => {
  // 1. Validation: Must have content OR attachments
  if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
       throw new Error("Message must have content or attachments");
  }

  // 1. Create message
  const message = await Message.create({
    conversationId,
    sender: senderId,
    content,
    attachments, // Add attachments
    readBy: [senderId], // Sender has read it
  });
  
  console.log(`💾 [ChatService] Saving message [${message._id}] for conv [${conversationId}] from [${senderId}]`);

  // 2. Update Conversation: set lastMessage, increment unreadCounts for OTHERS
  // We need to find the other participant to increment their unread count.
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversation not found");

  // 2. Prepare Atomic Update
  // We need to increment the unread count for everyone EXCEPT the sender.
  // Mongoose Map field `unreadCounts` allows dot notation for updates if keys are strings.
  
  const updateOps = {
      $set: {
          lastMessage: {
              content,
              sender: senderId,
              createdAt: message.createdAt,
              isRead: false
          }
      },
      $inc: {}
  };

  conversation.participants.forEach(pId => {
      // Ensure we compare strings
      if (pId.toString() !== senderId.toString()) {
           // Key for map must be string. 
           // Syntax: "unreadCounts.USER_ID": 1
           updateOps.$inc[`unreadCounts.${pId.toString()}`] = 1;
      }
  });

  // Execute atomic update
  await Conversation.findByIdAndUpdate(conversationId, updateOps);

  return message;
};

/**
 * Mark conversation as read for a user
 */
export const markConversationAsRead = async (conversationId, userId) => {
    await Conversation.findByIdAndUpdate(conversationId, {
        $set: { [`unreadCounts.${userId}`]: 0 }
    });
};
