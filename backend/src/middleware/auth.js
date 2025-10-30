import { verifyAccessToken } from '../config/jwt.config.js';
import User from '../models/user.model.js';

/**
 * Authentication Middleware
 * Verifies JWT access token from Authorization header
 * Attaches authenticated user data to request object
 * Protects routes that require authentication
 */
export const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        // Get token (remove 'Bearer ' prefix)
        const token = authHeader.substring(7);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token format.',
            });
        }

        // Verify access token using JWT config
        const decoded = verifyAccessToken(token);

        // Fetch user from database
        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token invalid.',
            });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before accessing this resource.',
            });
        }

        // Attach user data to request object
        req.user = {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
        };

        // Continue to next middleware/route handler
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);

        // Handle token expiration
        if (error.message.includes('expired')) {
            return res.status(401).json({
                success: false,
                message: 'Access token has expired. Please refresh your token.',
                code: 'TOKEN_EXPIRED',
            });
        }

        // Handle invalid token
        if (error.message.includes('Invalid')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid access token.',
                code: 'INVALID_TOKEN',
            });
        }

        // Generic error
        return res.status(401).json({
            success: false,
            message: 'Authentication failed.',
        });
    }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticate but doesn't fail if no token provided
 * Useful for routes that have different behavior for authenticated vs guest users
 */
export const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        // If no token, continue without attaching user
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);

        if (!token) {
            req.user = null;
            return next();
        }

        // Try to verify token
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (user) {
            req.user = {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // If token is invalid/expired, continue as guest
        req.user = null;
        next();
    }
};

export default { authenticate, optionalAuthenticate };
