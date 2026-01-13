import {
  getOrCreateConversation,
  saveMessage,
  markConversationAsRead,
} from "../services/chat.service.js";
import { socketAuth } from "../middleware/socketAuth.js";

/**
 * Initialize Discussion Namespace
 * @param {Object} io - Socket.IO server instance
 */
export const initializeChatNamespace = (io) => {
  const chatNamespace = io.of("/chat");
  const onlineUsers = new Map(); // userId -> Set(socketId)

  // Middleware: Auth is handled by socketAuth middleware
  chatNamespace.use(socketAuth);

  chatNamespace.on("connection", (socket) => {
    // User is guaranteed to be attached by socketAuth middleware
    const userId = socket.user?.id || socket.user?._id;

    if (!userId) {
      console.error("❌ Chat connection missing userId despite auth middleware");
      socket.disconnect();
      return;
    }

    console.log(`💬 User connected to Chat: ${userId}`);

    // Join a room for their own UserID (for receiving direct notifications/invites)
    if (userId) {
      const userStrId = userId.toString();
      socket.join(userStrId);

      // Online Status Logic
      if (!onlineUsers.has(userStrId)) {
        onlineUsers.set(userStrId, new Set());
      }
      onlineUsers.get(userStrId).add(socket.id);

      // Broadcast to everyone
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit("get_online_users", onlineUserIds);

      // Only broadcast user_online if this is their first connection (or they weren't in map)
      // But since we just added them, we check if they have multiple tabs.
      // Actually, logic is: if we track sockets, we can just broadcast every time? 
      // No, broadcast once per user presence.
      // But simplified: just broadcast. The frontend Set will handle uniqueness.
      socket.broadcast.emit("user_online", userStrId);
    }

    // Event: Join a specific conversation
    socket.on("join_conversation", async ({ conversationId }) => {
      try {
        // Here we should verify if user belongs to this conversation
        // For now, we trust the ID but real app should check DB.
        socket.join(conversationId);

        // Mark as read immediately when joining/opening?
        if (userId) {
          await markConversationAsRead(conversationId, userId);
          // Notify checking: update unread count on UI
        }

        console.log(`User ${userId} joined conversation ${conversationId}`);
      } catch (error) {
        console.error("Join error:", error);
      }
    });

    // Event: Send Message
    socket.on("send_message", async (data, callback) => {
      const { conversationId, content, receiverId, attachments } = data;
      // data can have conversationId OR receiverId (to start new)

      try {
        let conversation;
        if (conversationId) {
          // Check auth/existence?
          // saveMessage handles basic logic
          const msg = await saveMessage(conversationId, userId, content, attachments);

          // Broadcast to the room (conversation) EXCEPT sender
          // Sender already has optimistic UI, and callback will confirm success/failure/ID update.
          socket.to(conversationId).emit("receive_message", msg);

          if (callback) callback({ success: true, message: msg });
        } else if (receiverId) {
          // First time chat
          conversation = await getOrCreateConversation(userId, receiverId);
          const msg = await saveMessage(conversation._id, userId, content, attachments);

          // Allow this socket to join the new conversation room
          socket.join(conversation._id.toString());

          // We need to notify the receiver to join this room too/refresh list
          // Emit to receiver's personal room
          socket.to(receiverId).emit("new_conversation", conversation);

          // Emit message to receiver (so they see it immediately if they have chat list open)
          // But usually 'new_conversation' is enough to trigger fetch
          // Let's also emit receive_message if they are theoretically listening?
          // If they are not in the room yet, socket.to(conversationId) won't work.
          // But we can emit to their user room.
          socket.to(receiverId).emit("receive_message", msg);

          // Sender handles via callback

          if (callback) callback({ success: true, message: msg, conversation });
        }
      } catch (error) {
        console.error("Send message error:", error);
        // Important: Return strict false success so UI knows to show error
        if (callback) callback({ success: false, error: error.message });
      }
    });

    // Event: Typing
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit("user_typing", {
        userId,
        isTyping,
        conversationId
      });
    });

    socket.on("disconnect", () => {
      console.log(`Chat user disconnected: ${userId}`);
      if (userId) {
        const userStrId = userId.toString();
        if (onlineUsers.has(userStrId)) {
          const userSockets = onlineUsers.get(userStrId);
          userSockets.delete(socket.id);

          if (userSockets.size === 0) {
            onlineUsers.delete(userStrId);
            // Broadcast offline
            chatNamespace.emit("user_offline", userStrId);
          }
        }
      }
    });
  });

  return chatNamespace;
};
