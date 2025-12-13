import { useState, useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socketService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for Socket.IO connection management
 * 
 * Features:
 * - Manage socket connection lifecycle
 * - Provide emit method for sending events
 * - Provide event subscription method (on/off)
 * - Cleanup on unmount
 * - Handle reconnection automatically
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { isConnected, emit, on, off, joinRoom, leaveRoom } = useSocket();
 * 
 *   useEffect(() => {
 *     // Subscribe to events
 *     const unsubscribe = on('notification:new', (notification) => {
 *       console.log('New notification:', notification);
 *     });
 * 
 *     // Join a room
 *     joinRoom('discussion', 'course-123');
 * 
 *     // Cleanup
 *     return () => {
 *       unsubscribe();
 *       leaveRoom('discussion', 'course-123');
 *     };
 *   }, []);
 * 
 *   const handleSendMessage = () => {
 *     emit('chat:message', { text: 'Hello!' });
 *   };
 * 
 *   return (
 *     <div>
 *       <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
 *       <button onClick={handleSendMessage}>Send</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @returns {Object} { 
 *   isConnected, 
 *   emit, 
 *   on, 
 *   off, 
 *   joinRoom, 
 *   leaveRoom,
 *   reconnect 
 * }
 */
const useSocket = () => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(socketService.getConnected());
  
  const eventListenersRef = useRef(new Map());
  const isMountedRef = useRef(true);


  useEffect(() => {
    isMountedRef.current = true;
    
    if (token) {
      socketService.connect(token);
    }

    const handleConnectionChange = (data) => {
      if (isMountedRef.current) {
        setIsConnected(data.connected || false);
      }
    };

  
    socketService.registerContextCallback('connection', handleConnectionChange);

  
    setIsConnected(socketService.getConnected());

    return () => {
      isMountedRef.current = false;
      
  
      eventListenersRef.current.forEach((handler, event) => {
        const socket = socketService.getSocket();
        if (socket) {
          socket.off(event, handler);
        }
      });
      eventListenersRef.current.clear();
      
    
      socketService.unregisterContextCallback('connection', handleConnectionChange);
    };
  }, [token]);

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  const emit = useCallback((event, data) => {
    if (!isConnected) {
      console.warn(`[useSocket] Cannot emit "${event}": not connected`);
      return;
    }
    
    console.log(`[useSocket] Emitting event: ${event}`, data);
    socketService.emit(event, data);
  }, [isConnected]);

  /**
   * Subscribe to a socket event
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  const on = useCallback((event, handler) => {
    const socket = socketService.getSocket();
    
    if (!socket) {
      console.warn(`[useSocket] Cannot subscribe to "${event}": socket not initialized`);
      return () => {}; // Return empty cleanup function
    }

    const wrappedHandler = (...args) => {
      if (isMountedRef.current) {
        try {
          handler(...args);
        } catch (error) {
          console.error(`[useSocket] Error in handler for "${event}":`, error);
        }
      }
    };


    eventListenersRef.current.set(event, wrappedHandler);
    
  
    socket.on(event, wrappedHandler);
    console.log(`[useSocket] Subscribed to event: ${event}`);


    return () => {
      socket.off(event, wrappedHandler);
      eventListenersRef.current.delete(event);
      console.log(`[useSocket] Unsubscribed from event: ${event}`);
    };
  }, []);

  /**
   * Unsubscribe from a socket event
   * @param {string} event - Event name
   * @param {Function} handler - Optional specific handler to remove
   */
  const off = useCallback((event, handler = null) => {
    const socket = socketService.getSocket();
    
    if (!socket) {
      return;
    }

    if (handler) {

      socket.off(event, handler);
      eventListenersRef.current.delete(event);
    } else {
    
      const storedHandler = eventListenersRef.current.get(event);
      if (storedHandler) {
        socket.off(event, storedHandler);
        eventListenersRef.current.delete(event);
      }
    }
    
    console.log(`[useSocket] Unsubscribed from event: ${event}`);
  }, []);

  /**
   * Join a room (for namespaced events)
   * @param {string} namespace - Namespace (e.g., 'discussion', 'session')
   * @param {string} roomId - Room ID (e.g., courseId, sessionId)
   */
  const joinRoom = useCallback((namespace, roomId) => {
    if (!isConnected) {
      console.warn(`[useSocket] Cannot join room: not connected`);
      return;
    }
    
    socketService.joinRoom(namespace, roomId);
  }, [isConnected]);

  /**
   * Leave a room
   * @param {string} namespace - Namespace
   * @param {string} roomId - Room ID
   */
  const leaveRoom = useCallback((namespace, roomId) => {
    if (!isConnected) {
      return;
    }
    
    socketService.leaveRoom(namespace, roomId);
  }, [isConnected]);

  const reconnect = useCallback(() => {
    if (token) {
      socketService.connect(token);
    } else {
      console.warn('[useSocket] Cannot reconnect: no token available');
    }
  }, [token]);

  return {
    isConnected,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    reconnect,
  };
};

export default useSocket;

