import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * Limits all API requests to prevent abuse
 * 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests (only count failed requests)
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

/**
 * Authentication Rate Limiter
 * Stricter limits for auth endpoints to prevent brute force attacks
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only count failed login attempts
  skipSuccessfulRequests: true,
});

/**
 * Registration Rate Limiter
 * Prevents mass account creation
 * 3 registrations per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Password Reset Rate Limiter
 * Prevents password reset spam
 * 3 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Email Verification Rate Limiter
 * Prevents verification email spam
 * 5 requests per hour per IP
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many verification attempts, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File Upload Rate Limiter
 * Prevents upload spam
 * 20 uploads per hour per IP
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 uploads per windowMs
  message: {
    success: false,
    message: 'Too many file uploads, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API Documentation Rate Limiter
 * Looser limits for documentation endpoints
 * 200 requests per 15 minutes per IP
 */
export const docLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests to documentation, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  generalLimiter,
  authLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  uploadLimiter,
  docLimiter,
};
