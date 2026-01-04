import api from './api';

const chatService = {
  // Get all conversations
  getConversations: async () => {
    return await api.get('/chat/conversations');
  },

  // Get messages for a conversation
  getMessages: async (conversationId, page = 1, limit = 20) => {
    return await api.get(`/chat/messages/${conversationId}?page=${page}&limit=${limit}`);
  },

  // Start a new conversation or get existing one
  startConversation: async (receiverId) => {
    return await api.post('/chat/conversations', { receiverId });
  },

  // Search for users
  searchUsers: async (query) => {
    return await api.get(`/chat/users/search?query=${query}`);
  }
};

export default chatService;
