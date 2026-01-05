import { verifyAccessToken } from '../config/jwt.config.js';
import User from '../models/user.model.js';

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token from handshake auth or headers
 * Attaches user to socket instance
 */
export const socketAuth = async (socket, next) => {
  try {
    // Check for token in auth object (standard) or headers
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }

    // Get user
    const user = await User.findById(decoded.id).select('fullName email role isVerified');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user data to socket
    socket.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };
    
    // Also attach userName for convenience as used in handler
    socket.userName = user.fullName;

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Internal server error'));
  }
};
