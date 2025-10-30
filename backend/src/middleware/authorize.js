/**
 * Authorization Middleware
 * Implements role-based access control (RBAC)
 * Checks if authenticated user has required role(s)
 * Must be used after authenticate middleware
 */

/**
 * Role-based Authorization Middleware Factory
 * Returns a middleware that checks if user has one of the allowed roles
 * 
 * @param {...string} allowedRoles - One or more roles that are allowed (e.g., 'admin', 'teacher', 'student')
 * @returns {Function} Express middleware function
 * 
 * Usage:
 * - Single role: authorize('admin')
 * - Multiple roles: authorize('admin', 'teacher')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to access this resource.',
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of the following roles: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    // User has required role, proceed to next middleware
    next();
  };
};

/**
 * Check if User is Admin
 * Shorthand for authorize('admin')
 */
export const isAdmin = authorize('admin');

/**
 * Check if User is Teacher
 * Shorthand for authorize('teacher')
 */
export const isTeacher = authorize('teacher');

/**
 * Check if User is Student
 * Shorthand for authorize('student')
 */
export const isStudent = authorize('student');

/**
 * Check if User is Teacher or Admin
 * Common pattern for teacher-level operations with admin override
 */
export const isTeacherOrAdmin = authorize('teacher', 'admin');

/**
 * Check if User is Student or Teacher
 * Common pattern for enrolled users
 */
export const isStudentOrTeacher = authorize('student', 'teacher');

/**
 * Check if User Owns Resource
 * Verifies that the authenticated user is the owner of a resource
 * 
 * @param {Function} getOwnerId - Function that extracts owner ID from request
 * @returns {Function} Express middleware function
 * 
 * Usage:
 * - checkOwnership((req) => req.params.userId)
 * - checkOwnership((req) => req.body.authorId)
 */
export const checkOwnership = (getOwnerId) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Get resource owner ID
    const ownerId = getOwnerId(req);

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID not found in request.',
      });
    }

    // Convert both to strings for comparison
    const userId = req.user.id.toString();
    const ownerIdString = ownerId.toString();

    // Check if user is owner or admin
    if (userId !== ownerIdString && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to modify this resource.',
      });
    }

    // User is owner or admin, proceed
    next();
  };
};

/**
 * Check if User is Verified
 * Ensures user has verified their email
 */
export const isVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required. Please verify your email to access this resource.',
    });
  }

  next();
};

export default {
  authorize,
  isAdmin,
  isTeacher,
  isStudent,
  isTeacherOrAdmin,
  isStudentOrTeacher,
  checkOwnership,
  isVerified,
};
