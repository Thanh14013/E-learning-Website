/**
 * SocketManager Component
 * Manages Socket.IO connection lifecycle based on authentication state
 */

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import socketService from '../../services/socketService.js';

const SocketManager = () => {
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Connect socket when user is authenticated
      console.log('[SocketManager] Connecting socket...');
      socketService.connect(token);
    } else {
      // Disconnect socket when user logs out
      console.log('[SocketManager] Disconnecting socket...');
      socketService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  // This component doesn't render anything
  return null;
};

export default SocketManager;

