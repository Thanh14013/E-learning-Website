import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getOrCreateConversation } from "../services/chat.service.js";
import User from "../models/user.model.js";

/**
 * Get all conversations for the current user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName avatar email") // Populate user details
      .sort({ updatedAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get messages for a specific conversation
 */
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is in conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        return res.status(404).json({ success: false, message: "Conversation not found" });
    }
    
    if (!conversation.participants.includes(userId)) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const messages = await Message.find({ conversationId })
      .populate("sender", "fullName avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Reverse to show oldest first in chat UI (if we want that)
    // But usually frontend handles it. Let's return as is (newest first for pagination).
    
    res.status(200).json({
      success: true,
      data: messages.reverse(), // Return chronological order for UI
      meta: {
          page: Number(page),
          total: await Message.countDocuments({ conversationId })
      }
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Start a conversation with a user (Student or Teacher)
 */
export const startConversation = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;
        
        if (!receiverId) {
            return res.status(400).json({ success: false, message: "Receiver ID is required" });
        }
        
        try {
            const conversation = await getOrCreateConversation(senderId, receiverId);
            // Populate for frontend consistency
            await conversation.populate("participants", "fullName avatar email");
            
            res.status(200).json({
                success: true,
                data: conversation
            });
        } catch (authError) {
             return res.status(403).json({ success: false, message: authError.message });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Search for users to chat with (Only enrolled students/teachers)
 */
export const searchChatUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const role = req.user.role;
        const { query } = req.query; // Name search
        
        let validUserIds = [];
        
        if (role === 'teacher') {
            // Find all students in courses taught by this teacher
            // This is a heavy query, optimization needed for large scale
            // Option 1: Find Courses by Teacher -> Collect enrolledStudents
            const courses = await import("../models/course.model.js").then(m => m.default.find({ teacherId: currentUserId }).select("enrolledStudents"));
            const studentIds = new Set();
            courses.forEach(c => c.enrolledStudents.forEach(s => studentIds.add(s.toString())));
            validUserIds = Array.from(studentIds);
            
        } else if (role === 'student') {
             // Find all teachers of courses this student is enrolled in
             const courses = await import("../models/course.model.js").then(m => m.default.find({ enrolledStudents: currentUserId }).select("teacherId"));
             const teacherIds = new Set();
             courses.forEach(c => teacherIds.add(c.teacherId.toString()));
             validUserIds = Array.from(teacherIds);
        }
        
        if (validUserIds.length === 0) {
             return res.status(200).json({ success: true, data: [] });
        }
        
        // Search in User collection with these IDs AND name match
        const users = await User.find({
            _id: { $in: validUserIds },
            fullName: { $regex: query, $options: "i" }
        }).select("fullName avatar email role").limit(20);
        
        res.status(200).json({
            success: true,
            data: users
        });
        
    } catch (error) {
         res.status(500).json({ success: false, message: error.message });
    }
}
