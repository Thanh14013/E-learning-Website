/**
 * Socket.IO Handlers Index
 * Exports all namespace handlers and helper functions
 */

import { initializeDiscussionNamespace } from './discussion.handler.js';
import { initializeSessionNamespace } from './session.handler.js';
import {
  initializeNotificationNamespace,
  sendNotificationToUser,
  sendNotificationToCourse,
  broadcastNotification,
} from './notification.handler.js';
import {
  initializeProgressNamespace,
  emitProgressUpdate,
  emitCourseCompletion,
} from './progress.handler.js';

/**
 * Initialize All Socket.IO Namespaces
 * @param {Object} io - Socket.IO server instance
 */
export const initializeAllNamespaces = (io) => {
  console.log('🚀 Initializing all Socket.IO namespaces...');

  // Initialize all namespaces
  const discussionNamespace = initializeDiscussionNamespace(io);
  const sessionNamespace = initializeSessionNamespace(io);
  const notificationNamespace = initializeNotificationNamespace(io);
  const progressNamespace = initializeProgressNamespace(io);

  console.log('✅ All Socket.IO namespaces initialized successfully');

  return {
    discussionNamespace,
    sessionNamespace,
    notificationNamespace,
    progressNamespace,
  };
};

// Export namespace initializers
export {
  initializeDiscussionNamespace,
  initializeSessionNamespace,
  initializeNotificationNamespace,
  initializeProgressNamespace,
};

// Export helper functions for controllers/services
export {
  sendNotificationToUser,
  sendNotificationToCourse,
  broadcastNotification,
  emitProgressUpdate,
  emitCourseCompletion,
};

export default {
  initializeAllNamespaces,
  initializeDiscussionNamespace,
  initializeSessionNamespace,
  initializeNotificationNamespace,
  initializeProgressNamespace,
  sendNotificationToUser,
  sendNotificationToCourse,
  broadcastNotification,
  emitProgressUpdate,
  emitCourseCompletion,
};
