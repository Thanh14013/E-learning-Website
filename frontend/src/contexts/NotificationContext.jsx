import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import socketService from '../services/socketService.js';
import notificationService from '../services/notificationService.js';
import toastService from '../services/toastService.js';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Pagination state (simple infinite scroll ready)
  const pageRef = useRef(1);
  const limitRef = useRef(10);
  const loadingMoreRef = useRef(false);

  /**
   * Reset all notification state to initial values
   * Used when user logs out or context needs to be cleared
   */
  const resetState = () => {
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
    setHasMore(true);
    pageRef.current = 1;
  };

  /**
   * Fetch unread notification count from server
   * Updates unreadCount state with normalized count value
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      // Backend returns { success, data: { unreadCount: number } }
      const count = response?.data?.unreadCount ?? 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('[NotificationContext] Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async (opts = { reset: false }) => {
    if (opts.reset) {
      pageRef.current = 1;
    }

    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoading(true);

    try {
      const response = await notificationService.getNotifications({
        page: pageRef.current,
        limit: limitRef.current,
      });

      // Backend returns { success, data: [...], metadata }
      const items = response?.data ?? [];
      const total = response?.metadata?.total;

      // Sort notifications: unread first, then by createdAt descending
      const sortedItems = items.sort((a, b) => {
        if (!a.isRead && b.isRead) return -1;
        if (a.isRead && !b.isRead) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setNotifications((prev) => (opts.reset ? sortedItems : [...prev, ...sortedItems]));
      setHasMore(items.length >= limitRef.current && (total ? prevLengthLessThanTotal((opts.reset ? 0 : notifications.length), total) : true));

      pageRef.current += 1;
    } catch (error) {
      console.error('[NotificationContext] Failed to fetch notifications:', error);
      // Keep UI usable even on failure
      if (opts.reset) {
        setNotifications([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  const prevLengthLessThanTotal = (len, total) => {
    try {
      return typeof total === 'number' ? len < total : true;
    } catch {
      return true;
    }
  };

  // Socket wiring
  useEffect(() => {
    if (!isAuthenticated) {
      resetState();
      return;
    }

    // Initial fetch
    fetchUnreadCount();
    fetchNotifications({ reset: true });

    /**
     * Handle real-time new notification from Socket.IO
     * Adds notification to top of list and increments unread count
     */
    /**
     * Handle real-time new notification from Socket.IO
     * Adds notification to top of list and increments unread count
     */
    const handleNew = (notification) => {
      // Handle different notification types that might be coming through this channel
      // due to how backend emits sendNotificationToUser/Course
      if (notification.type === 'notification_deleted') {
        if (notification.id) {
          handleDelete({ id: notification.id });
        } else if (notification.notification?.id) {
          handleDelete({ id: notification.notification.id });
        }
        return;
      }

      if (notification.type === 'notification_updated') {
        if (notification.notification) {
          handleUpdate({ notification: notification.notification });
        }
        return;
      }

      // Standard new notification
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some(n => n._id === notification._id)) return prev;

        // Only increment unread count if we are actually adding a new notification
        // Use setTimeout to avoid side-effect warnings in render selection, though strictly this is a state update from an effect (socket listener) so it's fine to call setUnreadCount here but we need to do it conditionally.
        // However, we can't see the result of the duplicate check outside. 
        // So we update unread count via a separate check or inside this callback if possible (not recommended).
        // Safest approach: check duplicates against current state ref or just queue the update.
        // Since we are inside a functional update, we know 'prev' is fresh.

        // Correct approach: We use a side-effect here for simplicity as we are already handling an event.
        // But to be React-pure, we should probably do:
        setTimeout(() => setUnreadCount(c => c + 1), 0);

        return [notification, ...prev];
      });
      // Removing the outer setUnreadCount that was causing the duplicate count bug
    };

    /**
     * Handle real-time unread count update from Socket.IO
     * Syncs count across multiple tabs/devices
     */
    const handleCount = (payload) => {
      const count = typeof payload === 'number' ? payload : payload?.count ?? 0;
      setUnreadCount(count);
    };

    /**
     * Handle real-time notification updates (read status or other updates)
     */
    const handleUpdate = (payload) => {
      // payload might be the updated notification object directly or { notification: ... }
      const updated = payload.notification || payload;
      console.log('[NotificationContext] Socket update event for:', updated._id);

      setNotifications(prev => prev.map(n => n._id === updated._id ? { ...n, ...updated } : n));
    };

    /**
     * Handle real-time notification deletion
     */
    const handleDelete = (payload) => {
      // payload might be { id: ... } or just "id" string if called internally 
      // but usually from socket it's { id: ... }
      const id = payload.id || payload;
      console.log('[NotificationContext] Socket delete event for:', id);

      setNotifications((prev) => {
        const exists = prev.find(n => n._id === id);
        // If it was unread, decrement the count
        if (exists && !exists.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter(n => n._id !== id);
      });
    };

    /**
     * Handle all read event
     */
    const handleAllRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    // Register callbacks with socketService
    socketService.registerContextCallback('notification:new', handleNew);
    socketService.registerContextCallback('notification:count', handleCount);
    socketService.registerContextCallback('notification:updated', handleUpdate);
    socketService.registerContextCallback('notification:deleted', handleDelete);
    socketService.registerContextCallback('notifications_all_read', handleAllRead);

    return () => {
      socketService.unregisterContextCallback('notification:new', handleNew);
      socketService.unregisterContextCallback('notification:count', handleCount);
      socketService.unregisterContextCallback('notification:updated', handleUpdate);
      socketService.unregisterContextCallback('notification:deleted', handleDelete);
      socketService.unregisterContextCallback('notifications_all_read', handleAllRead);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Actions
  const refresh = async () => {
    await fetchUnreadCount();
    await fetchNotifications({ reset: true });
  };

  const loadMore = async () => {
    if (!hasMore || loadingMoreRef.current) return;
    await fetchNotifications();
  };

  /**
   * Mark a single notification as read
   * @param {string} id - Notification ID to mark as read
   */
  const markRead = async (id) => {
    try {
      // Check if already read/marked locally to prevent double submission
      const target = notifications.find(n => n._id === id);
      if (target && target.isRead) return;

      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error('[NotificationContext] Failed to mark notification as read:', error);
      // Only toast if it's a real error, not just "already read" (which we filtered, but maybe race condition)
      toastService.error('Unable to mark as read');
    }
  };

  /**
   * Mark all notifications as read
   * Updates all unread notifications and resets unread count to 0
   */
  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[NotificationContext] Failed to mark all notifications as read:', error);
      toastService.error('Unable to mark all as read');
    }
  };

  /**
   * Delete a notification
   * @param {string} id - Notification ID to delete
   */
  const remove = async (id) => {
    try {
      // Optimistic update
      setNotifications((prev) => {
        const target = prev.find(n => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });

      await notificationService.deleteNotification(id);
    } catch (error) {
      console.error('[NotificationContext] Failed to delete notification:', error);
      toastService.error('Unable to delete notification');
      // Revert if needed (omitted for simplicity, but could refetch)
    }
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      hasMore,
      refresh,
      loadMore,
      markRead,
      markAllRead,
      deleteNotification: remove,
    }),
    [notifications, unreadCount, loading, hasMore]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};


