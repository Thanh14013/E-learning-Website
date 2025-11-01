import { Server } from 'socket.io';
import { verifyAccessToken } from './jwt.config.js';

/**
 * Socket.IO Configuration
 * Initializes Socket.IO server with CORS and authentication
 */

/**
 * Initialize Socket.IO Server
 * @param {Object} httpServer - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
export const initializeSocketIO = (httpServer) => {
  // Create Socket.IO server with configuration
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    // Connection options
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    transports: ['websocket', 'polling'], // Support both transports
  });

  // Global middleware for authentication
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth or query
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = verifyAccessToken(token);

      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Attach user data to socket
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Global connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.id} (${socket.user.email})`);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.user.id} - Reason: ${reason}`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`⚠️ Socket error for user ${socket.user.id}:`, error.message);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 * Call this after initializeSocketIO to get the io instance
 */
let ioInstance = null;

export const setSocketIOInstance = (io) => {
  ioInstance = io;
};

export const getSocketIOInstance = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized. Call initializeSocketIO first.');
  }
  return ioInstance;
};

export default { initializeSocketIO, setSocketIOInstance, getSocketIOInstance };
