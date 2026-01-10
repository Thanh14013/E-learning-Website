import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api';
import socketService from '../services/socketService.js';
import toastService from '../services/toastService.js';
import { handleApiError } from '../utils/errorHandler';

const DiscussionContext = createContext(null);

export const useDiscussions = () => {
  const context = useContext(DiscussionContext);
  if (!context) {
    throw new Error('useDiscussions must be used within DiscussionProvider');
  }
  return context;
};

export const DiscussionProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  // State
  const [discussions, setDiscussions] = useState([]);
  const [currentDiscussion, setCurrentDiscussion] = useState(null);
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDiscussions: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ============================================================================
  // SOCKET.IO ROOM MANAGEMENT
  // ============================================================================

  const joinCourseRoom = useCallback((courseId) => {
    // Only join rooms when authenticated and socket is connected
    if (!isAuthenticated || !socketService.isConnected) return;

    if (courseId && courseId !== currentCourseId) {
      if (currentCourseId) {
        socketService.leaveRoom('discussion', currentCourseId);
      }

      socketService.joinRoom('discussion', courseId);
      setCurrentCourseId(courseId);
      console.log('[DiscussionContext] Joined room for course', courseId);
    }
  }, [currentCourseId, isAuthenticated]);

  const leaveCourseRoom = useCallback(() => {
    if (!isAuthenticated || !socketService.isConnected) return;

    if (currentCourseId) {
      socketService.leaveRoom('discussion', currentCourseId);
      setCurrentCourseId(null);
      console.log('[DiscussionContext] Left room');
    }
  }, [currentCourseId, isAuthenticated]);

  // ============================================================================
  // API METHODS
  // ============================================================================

  // Fetch discussions by course
  const fetchDiscussionsByCourse = useCallback(async (courseId, params = {}) => {
    setLoading(true);
    try {
      const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = params;

      const response = await api.get(`/discussions/course/${courseId}`, {
        params: { page, limit, search, sortBy, order }
      });

      setDiscussions(response.data.data.discussions);
      setPagination(response.data.data.pagination);

      // Join socket room for this course
      joinCourseRoom(courseId);

      return response.data.data.discussions;
    } catch (error) {
      const parsedError = handleApiError(error, 'Fetch Discussions');
      toastService.error(parsedError.message);
      setDiscussions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [joinCourseRoom]);

  // Fetch discussion detail
  const fetchDiscussionDetail = useCallback(async (discussionId) => {
    setLoading(true);
    try {
      const response = await api.get(`/discussions/${discussionId}`);

      setCurrentDiscussion({
        discussion: response.data.data.discussion,
        comments: response.data.data.comments,
        totalComments: response.data.data.totalComments
      });

      // Join socket room for the discussion's course
      if (response.data.data.discussion.courseId) {
        joinCourseRoom(response.data.data.discussion.courseId);
      }

      return response.data.data.discussion;
    } catch (error) {
      const parsedError = handleApiError(error, 'Fetch Discussion Detail');
      toastService.error(parsedError.message);
      setCurrentDiscussion(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [joinCourseRoom]);

  // Create discussion
  const createDiscussion = useCallback(async (courseId, discussionData) => {
    try {
      const response = await api.post('/discussions', {
        courseId,
        ...discussionData
      });

      toastService.success('Discussion created successfully!');

      // Update local state immediately
      setDiscussions(prev => [response.data.data.discussion, ...prev]);

      return response.data.data.discussion;
    } catch (error) {
      const parsedError = handleApiError(error, 'Create Discussion');
      toastService.error(parsedError.message);
      throw error;
    }
  }, []);

  // Update discussion
  const updateDiscussion = useCallback(async (discussionId, updateData) => {
    try {
      const response = await api.put(`/discussions/${discussionId}`, updateData);

      toastService.success('Discussion updated successfully!');

      // Update local state
      setDiscussions(prev => prev.map(d =>
        d._id === discussionId ? response.data.data.discussion : d
      ));

      if (currentDiscussion?.discussion?._id === discussionId) {
        setCurrentDiscussion(prev => ({
          ...prev,
          discussion: response.data.data.discussion
        }));
      }

      return response.data.data.discussion;
    } catch (error) {
      const parsedError = handleApiError(error, 'Update Discussion');
      toastService.error(parsedError.message);
      throw error;
    }
  }, [currentDiscussion]);

  // Delete discussion
  const deleteDiscussion = useCallback(async (discussionId) => {
    try {
      await api.delete(`/discussions/${discussionId}`);

      setDiscussions(prev => prev.filter(d => d._id !== discussionId));
      toastService.success('Discussion deleted successfully!');
    } catch (error) {
      const parsedError = handleApiError(error, 'Delete Discussion');
      toastService.error(parsedError.message);
      throw error;
    }
  }, []);

  // Pin/Unpin discussion
  const pinDiscussion = useCallback(async (discussionId) => {
    try {
      const response = await api.put(`/discussions/${discussionId}/pin`);

      const { isPinned } = response.data.data;

      setDiscussions(prev => prev.map(d =>
        d._id === discussionId ? { ...d, isPinned } : d
      ));

      toastService.success(isPinned ? 'Discussion pinned' : 'Discussion unpinned');
    } catch (error) {
      const parsedError = handleApiError(error, 'Pin Discussion');
      toastService.error(parsedError.message);
      throw error;
    }
  }, []);

  // Like/Unlike discussion
  const toggleLikeDiscussion = useCallback(async (discussionId) => {
    if (!user) return;

    try {
      const response = await api.put(`/discussions/${discussionId}/like`);
      const { isLiked, likesCount } = response.data.data;

      // Update local state
      setDiscussions(prev => prev.map(d =>
        d._id === discussionId
          ? { ...d, likesCount }
          : d
      ));

      if (currentDiscussion?.discussion?._id === discussionId) {
        setCurrentDiscussion(prev => ({
          ...prev,
          discussion: {
            ...prev.discussion,
            likesCount
          }
        }));
      }
    } catch (error) {
      const parsedError = handleApiError(error, 'Like Discussion');
      toastService.error(parsedError.message);
    }
  }, [currentDiscussion, user]);

  // Create comment with immediate UI update
  const createComment = useCallback(async (discussionId, content, parentId = null) => {
    if (!user) {
      toastService.error('Please login to comment');
      throw new Error('Not authenticated');
    }

    // Create new comment object with current user info
    const newComment = {
      _id: `temp-${Date.now()}`,
      discussionId,
      userId: {
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      },
      content: content.trim(),
      parentId: parentId || null,
      likesCount: 0,
      likes: [],
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update UI immediately
    setCurrentDiscussion(prev => {
      if (!prev || prev.discussion._id !== discussionId) return prev;

      const comments = [...(prev.comments || [])];

      if (!parentId) {
        // Top-level comment - add to end
        comments.push(newComment);
      } else {
        // Reply - add to parent's replies
        const addReply = (commentList) => {
          return commentList.map(comment => {
            if (comment._id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment]
              };
            }
            if (comment.replies?.length) {
              return { ...comment, replies: addReply(comment.replies) };
            }
            return comment;
          });
        };
        return {
          ...prev,
          comments: addReply(comments),
          totalComments: (prev.totalComments || 0) + 1
        };
      }

      return {
        ...prev,
        comments,
        totalComments: (prev.totalComments || 0) + 1
      };
    });

    // Send to backend in background
    try {
      const response = await api.post(`/discussions/${discussionId}/comment`, {
        content,
        parentId
      });

      // Replace temp comment with real one from backend
      const realComment = response.data.data.comment;

      setCurrentDiscussion(prev => {
        if (!prev) return prev;

        const replaceTemp = (commentList) => {
          return commentList.map(comment => {
            if (comment._id === newComment._id) {
              return { ...realComment, replies: comment.replies || [] };
            }
            if (comment.replies?.length) {
              return { ...comment, replies: replaceTemp(comment.replies) };
            }
            return comment;
          });
        };

        return { ...prev, comments: replaceTemp(prev.comments || []) };
      });

      return realComment;
    } catch (error) {
      // Remove failed comment from UI
      setCurrentDiscussion(prev => {
        if (!prev) return prev;

        const removeTemp = (commentList) => {
          return commentList.filter(c => c._id !== newComment._id).map(comment => {
            if (comment.replies?.length) {
              return { ...comment, replies: removeTemp(comment.replies) };
            }
            return comment;
          });
        };

        return {
          ...prev,
          comments: removeTemp(prev.comments || []),
          totalComments: Math.max(0, (prev.totalComments || 0) - 1)
        };
      });

      const parsedError = handleApiError(error, 'Create Comment');
      toastService.error(parsedError.message);
      throw error;
    }
  }, [user]);

  // Update comment
  const updateComment = useCallback(async (commentId, content) => {
    try {
      const response = await api.put(`/comments/${commentId}`, { content });

      toastService.success('Comment updated successfully!');
      return response.data.data.comment;
    } catch (error) {
      const parsedError = handleApiError(error, 'Update Comment');
      toastService.error(parsedError.message);
      throw error;
    }
  }, []);

  // Like comment
  const toggleLikeComment = useCallback(async (commentId) => {
    if (!user) return;

    try {
      await api.put(`/comments/${commentId}/like`);

      // Update comment in currentDiscussion state
      if (currentDiscussion?.comments) {
        const updateCommentLikes = (comments) => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              const currentLikes = comment.likesCount || 0;
              return {
                ...comment,
                likesCount: currentLikes + 1
              };
            }
            if (comment.replies?.length > 0) {
              return { ...comment, replies: updateCommentLikes(comment.replies) };
            }
            return comment;
          });
        };

        setCurrentDiscussion(prev => ({
          ...prev,
          comments: updateCommentLikes(prev.comments)
        }));
      }
    } catch (error) {
      const parsedError = handleApiError(error, 'Like Comment');
      toastService.error(parsedError.message);
    }
  }, [currentDiscussion, user]);

  // Delete comment
  const deleteComment = useCallback(async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      toastService.success('Comment deleted successfully!');
    } catch (error) {
      const parsedError = handleApiError(error, 'Delete Comment');
      toastService.error(parsedError.message);
      throw error;
    }
  }, []);

  // ============================================================================
  // SOCKET.IO EVENT HANDLERS
  // ============================================================================

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
        const exists = prev.some((d) => d._id === data.discussion._id);
        if (exists) return prev;
        return [data.discussion, ...prev];
      });

      // Show toast notification if not created by current user
      if (data.discussion.userId?._id !== user?.id) {
        toastService.info(`New discussion: ${data.discussion.title}`);
      }
    };

    // Handle discussion updated
    const handleDiscussionUpdated = (data) => {
      console.log('[DiscussionContext] discussion:updated', data);
      setDiscussions((prev) =>
        prev.map((d) => (d._id === data._id ? { ...d, ...data } : d))
      );

      if (currentDiscussion?.discussion?._id === data._id) {
        setCurrentDiscussion(prev => ({
          ...prev,
          discussion: { ...prev.discussion, ...data }
        }));
      }
    };

    // Handle discussion liked
    const handleDiscussionLiked = (data) => {
      console.log('[DiscussionContext] discussion:liked', data);
      setDiscussions((prev) =>
        prev.map((d) =>
          d._id === data.discussionId
            ? { ...d, likesCount: data.likesCount }
            : d
        )
      );

      if (currentDiscussion?.discussion?._id === data.discussionId) {
        setCurrentDiscussion(prev => ({
          ...prev,
          discussion: { ...prev.discussion, likesCount: data.likesCount }
        }));
      }
    };

    // Handle new comment
    const handleCommentCreated = (data) => {
      console.log('[DiscussionContext] comment:created', data);

      // Update discussion comment count
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

      // DON'T refresh - optimistic UI already handled it
      // Show toast if not by current user
      if (data.comment?.userId?._id !== user?.id) {
        toastService.info('New comment posted');
      }
    };

    // Handle comment liked
    const handleCommentLiked = (data) => {
      console.log('[DiscussionContext] comment:liked', data);

      if (currentDiscussion?.comments) {
        const updateCommentLikes = (comments) => {
          return comments.map(comment => {
            if (comment._id === data.commentId) {
              return { ...comment, likesCount: data.likesCount };
            }
            if (comment.replies?.length > 0) {
              return { ...comment, replies: updateCommentLikes(comment.replies) };
            }
            return comment;
          });
        };

        setCurrentDiscussion(prev => ({
          ...prev,
          comments: updateCommentLikes(prev.comments)
        }));
      }
    };

    // Register callbacks
    socketService.registerContextCallback('discussion:created', handleDiscussionCreated);
    socketService.registerContextCallback('discussion:updated', handleDiscussionUpdated);
    socketService.registerContextCallback('discussion:liked', handleDiscussionLiked);
    socketService.registerContextCallback('comment:created', handleCommentCreated);
    socketService.registerContextCallback('comment:liked', handleCommentLiked);

    return () => {
      socketService.unregisterContextCallback('discussion:created', handleDiscussionCreated);
      socketService.unregisterContextCallback('discussion:updated', handleDiscussionUpdated);
      socketService.unregisterContextCallback('discussion:liked', handleDiscussionLiked);
      socketService.unregisterContextCallback('comment:created', handleCommentCreated);
      socketService.unregisterContextCallback('comment:liked', handleCommentLiked);
      leaveCourseRoom();
    };
  }, [isAuthenticated, currentCourseId, currentDiscussion, leaveCourseRoom, user, fetchDiscussionDetail]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = useMemo(
    () => ({
      // State
      discussions,
      currentDiscussion,
      currentCourseId,
      loading,
      pagination,

      // API Methods
      fetchDiscussionsByCourse,
      fetchDiscussionDetail,
      createDiscussion,
      updateDiscussion,
      deleteDiscussion,
      toggleLikeDiscussion,
      createComment,
      updateComment,
      toggleLikeComment,
      deleteComment,

      // Socket Methods
      joinCourseRoom,
      leaveCourseRoom,

      // State Setters
      setDiscussions,
      setCurrentDiscussion,
    }),
    [
      discussions,
      currentDiscussion,
      currentCourseId,
      loading,
      pagination,
      fetchDiscussionsByCourse,
      fetchDiscussionDetail,
      createDiscussion,
      updateDiscussion,
      deleteDiscussion,
      toggleLikeDiscussion,
      createComment,
      updateComment,
      toggleLikeComment,
      deleteComment,
      joinCourseRoom,
      leaveCourseRoom,
    ]
  );

  return (
    <DiscussionContext.Provider value={value}>
      {children}
    </DiscussionContext.Provider>
  );
};