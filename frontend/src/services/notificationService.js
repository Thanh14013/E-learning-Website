import api from './api';

/**
 * Notification Service - REST API calls
 * Endpoints aligned with online_learning_readme.md
 */
const notificationService = {
  /**
   * Get notifications for current user
   * @param {Object} params { page, limit, type, isRead }
   */
  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  /**
   * Get unread count
   */
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  /**
   * Mark a notification as read
   * @param {string} id
   */
  markRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  /**
   * Delete a notification
   * @param {string} id
   */
  deleteNotification: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationService;

