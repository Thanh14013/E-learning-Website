/**
 * Session Context
 * Manages live session state and real-time updates via Socket.IO
 */

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import socketService from '../services/socketService.js';
import toastService from '../services/toastService.js';

const SessionContext = createContext(null);

export const useSessions = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessions must be used within SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Join a session room
  const joinSession = (sessionId) => {
    if (sessionId && sessionId !== currentSessionId) {
      // Leave previous session if any
      if (currentSessionId) {
        socketService.leaveRoom('session', currentSessionId);
      }

      // Join new session
      socketService.emit('session:join', { sessionId });
      socketService.joinRoom('session', sessionId);
      setCurrentSessionId(sessionId);
      console.log('[SessionContext] Joined session', sessionId);
    }
  };

  // Leave current session
  const leaveSession = () => {
    if (currentSessionId) {
      socketService.emit('session:leave', { sessionId: currentSessionId });
      socketService.leaveRoom('session', currentSessionId);
      setCurrentSessionId(null);
      setParticipants([]);
      setChatMessages([]);
      console.log('[SessionContext] Left session');
    }
  };

  // Send chat message
  const sendChatMessage = (message) => {
    if (currentSessionId && message) {
      socketService.emit('session:chat', {
        sessionId: currentSessionId,
        message,
        userId: user?.id,
        userName: user?.name || user?.fullName,
      });
    }
  };

  // Socket event handlers
  useEffect(() => {
    if (!isAuthenticated) {
      leaveSession();
      return;
    }

    // Handle user joined
    const handleUserJoined = (data) => {
      console.log('[SessionContext] session:user-joined', data);
      setParticipants((prev) => {
        const exists = prev.some((p) => p.userId === data.userId);
        if (exists) return prev;
        return [...prev, data];
      });
    };

    // Handle user left
    const handleUserLeft = (data) => {
      console.log('[SessionContext] session:user-left', data);
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    };

    // Handle chat message
    const handleChatMessage = (data) => {
      console.log('[SessionContext] session:chat-message', data);
      setChatMessages((prev) => [...prev, data]);
    };

    // Handle screen share
    const handleScreenShare = (data) => {
      console.log('[SessionContext] session:user-screen-share', data);
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === data.userId ? { ...p, isScreenSharing: data.isSharing } : p
        )
      );
    };

    // Handle hand raised
    const handleHandRaised = (data) => {
      console.log('[SessionContext] session:user-hand-raised', data);
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === data.userId ? { ...p, handRaised: data.handRaised } : p
        )
      );
    };

    // Handle session started
    const handleSessionStarted = (data) => {
      console.log('[SessionContext] session:started', data);
      setSessions((prev) =>
        prev.map((s) =>
          s._id === data.sessionId ? { ...s, status: 'live', startedAt: data.startedAt } : s
        )
      );
    };

    // Handle session ended
    const handleSessionEnded = (data) => {
      console.log('[SessionContext] session:ended', data);
      setSessions((prev) =>
        prev.map((s) =>
          s._id === data.sessionId ? { ...s, status: 'ended', endedAt: data.endedAt } : s
        )
      );
      if (currentSessionId === data.sessionId) {
        leaveSession();
      }
    };

    // Register callbacks
    socketService.registerContextCallback('session:user-joined', handleUserJoined);
    socketService.registerContextCallback('session:user-left', handleUserLeft);
    socketService.registerContextCallback('session:chat-message', handleChatMessage);
    socketService.registerContextCallback('session:user-screen-share', handleScreenShare);
    socketService.registerContextCallback('session:user-hand-raised', handleHandRaised);
    socketService.registerContextCallback('session:started', handleSessionStarted);
    socketService.registerContextCallback('session:ended', handleSessionEnded);

    return () => {
      socketService.unregisterContextCallback('session:user-joined', handleUserJoined);
      socketService.unregisterContextCallback('session:user-left', handleUserLeft);
      socketService.unregisterContextCallback('session:chat-message', handleChatMessage);
      socketService.unregisterContextCallback('session:user-screen-share', handleScreenShare);
      socketService.unregisterContextCallback('session:user-hand-raised', handleHandRaised);
      socketService.unregisterContextCallback('session:started', handleSessionStarted);
      socketService.unregisterContextCallback('session:ended', handleSessionEnded);
      leaveSession();
    };
  }, [isAuthenticated, currentSessionId, user]);

  const value = useMemo(
    () => ({
      sessions,
      currentSessionId,
      participants,
      chatMessages,
      joinSession,
      leaveSession,
      sendChatMessage,
      setSessions,
    }),
    [sessions, currentSessionId, participants, chatMessages]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

