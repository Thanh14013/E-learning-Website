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
  const limitRef = useRef(20);
  const loadingMoreRef = useRef(false);

  // Debug helper
  const debug = (msg, obj) => {
    try {
      // Keep concise but informative logs
      if (obj !== undefined) {
        console.log(`[NotificationContext] ${msg}`, obj);
      } else {
        console.log(`[NotificationContext] ${msg}`);
      }
    } catch {}
  };

  const resetState = () => {
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
    setHasMore(true);
    pageRef.current = 1;
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationService.getUnreadCount();
      // Backend can return { count } or a number; normalize
      const count = typeof data === 'number' ? data : data?.count ?? 0;
      setUnreadCount(count);
      debug('Fetched unread count', { count });
    } catch (error) {
      debug('Failed to fetch unread count', error);
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
      const data = await notificationService.getNotifications({
        page: pageRef.current,
        limit: limitRef.current,
      });

      // Normalize array; some backends return {items, total}
      const items = Array.isArray(data) ? data : data?.items ?? [];
      const total = data?.total;

      setNotifications((prev) => (opts.reset ? items : [...prev, ...items]));
      setHasMore(items.length >= limitRef.current && (total ? prevLengthLessThanTotal((opts.reset ? 0 : notifications.length), total) : true));

      debug('Fetched notifications page', {
        page: pageRef.current,
        received: items.length,
        hasMore: hasMore,
      });

      pageRef.current += 1;
    } catch (error) {
      debug('Failed to fetch notifications', error);
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

    // Real-time: new notification arrived
    const handleNew = (notification) => {
      debug('Socket notification:new', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
      // Toast is already handled by socketService, but we can add additional logic here
    };

    // Real-time unread count update
    const handleCount = (payload) => {
      const count = typeof payload === 'number' ? payload : payload?.count ?? 0;
      debug('Socket notification:count', { count });
      setUnreadCount(count);
    };

    // Register callbacks with socketService
    socketService.registerContextCallback('notification:new', handleNew);
    socketService.registerContextCallback('notification:count', handleCount);

    return () => {
      socketService.unregisterContextCallback('notification:new', handleNew);
      socketService.unregisterContextCallback('notification:count', handleCount);
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

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      debug('Marked read', { id });
    } catch (error) {
      debug('Failed to mark read', error);
      toastService.error('Không thể đánh dấu đã đọc');
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
      debug('Marked all as read');
    } catch (error) {
      debug('Failed to mark all as read', error);
      toastService.error('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const remove = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      debug('Deleted notification', { id });
    } catch (error) {
      debug('Failed to delete notification', error);
      toastService.error('Không thể xóa thông báo');
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


