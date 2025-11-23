/**
 * Discussion Context
 * Manages discussion state and real-time updates via Socket.IO
 */

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import socketService from '../services/socketService.js';
import toastService from '../services/toastService.js';

const DiscussionContext = createContext(null);

export const useDiscussions = () => {
  const context = useContext(DiscussionContext);
  if (!context) {
    throw new Error('useDiscussions must be used within DiscussionProvider');
  }
  return context;
};

export const DiscussionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [currentCourseId, setCurrentCourseId] = useState(null);

  // Join discussion room for a course
  const joinCourseRoom = (courseId) => {
    if (courseId && courseId !== currentCourseId) {
      // Leave previous room if any
      if (currentCourseId) {
        socketService.leaveRoom('discussion', currentCourseId);
      }
      
      // Join new room
      socketService.joinRoom('discussion', courseId);
      setCurrentCourseId(courseId);
      console.log('[DiscussionContext] Joined room for course', courseId);
    }
  };

  // Leave discussion room
  const leaveCourseRoom = () => {
    if (currentCourseId) {
      socketService.leaveRoom('discussion', currentCourseId);
      setCurrentCourseId(null);
      console.log('[DiscussionContext] Left room');
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!isAuthenticated) {
      leaveCourseRoom();
      return;
    }

    // Handle new discussion created
    const handleDiscussionCreated = (data) => {
      console.log('[DiscussionContext] discussion:created', data);
      setDiscussions((prev) => {
        // Check if already exists to avoid duplicates
        const exists = prev.some((d) => d._id === data._id);
        if (exists) return prev;
        return [data, ...prev];
      });
    };

    // Handle discussion updated
    const handleDiscussionUpdated = (data) => {
      console.log('[DiscussionContext] discussion:updated', data);
      setDiscussions((prev) =>
        prev.map((d) => (d._id === data._id ? { ...d, ...data } : d))
      );
    };

    // Handle discussion liked
    const handleDiscussionLiked = (data) => {
      console.log('[DiscussionContext] discussion:liked', data);
      setDiscussions((prev) =>
        prev.map((d) =>
          d._id === data.discussionId
            ? { ...d, likes: data.likes || d.likes }
            : d
        )
      );
    };

    // Handle new comment
    const handleCommentCreated = (data) => {
      console.log('[DiscussionContext] comment:created', data);
      // Update discussion comment count or add comment to discussion
      setDiscussions((prev) =>
        prev.map((d) =>
          d._id === data.discussionId
            ? {
                ...d,
                commentCount: (d.commentCount || 0) + 1,
                lastCommentAt: new Date().toISOString(),
              }
            : d
        )
      );
    };

    // Register callbacks
    socketService.registerContextCallback('discussion:created', handleDiscussionCreated);
    socketService.registerContextCallback('discussion:updated', handleDiscussionUpdated);
    socketService.registerContextCallback('discussion:liked', handleDiscussionLiked);
    socketService.registerContextCallback('comment:created', handleCommentCreated);

    return () => {
      socketService.unregisterContextCallback('discussion:created', handleDiscussionCreated);
      socketService.unregisterContextCallback('discussion:updated', handleDiscussionUpdated);
      socketService.unregisterContextCallback('discussion:liked', handleDiscussionLiked);
      socketService.unregisterContextCallback('comment:created', handleCommentCreated);
      leaveCourseRoom();
    };
  }, [isAuthenticated, currentCourseId]);

  const value = useMemo(
    () => ({
      discussions,
      currentCourseId,
      joinCourseRoom,
      leaveCourseRoom,
      setDiscussions,
    }),
    [discussions, currentCourseId]
  );

  return (
    <DiscussionContext.Provider value={value}>
      {children}
    </DiscussionContext.Provider>
  );
};

