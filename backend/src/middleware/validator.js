import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation Result Handler
 * Checks for validation errors and returns formatted response
 * Should be used after validation rules
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors into a readable structure
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * User Registration Validation Rules
 * Validates fullName, email, and password fields
 */
export const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  validate,
];

/**
 * User Login Validation Rules
 * Validates email and password fields
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  validate,
];

/**
 * Email Validation Rules
 * Validates single email field
 */
export const validateEmail = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  validate,
];

/**
 * Password Reset Validation Rules
 * Validates new password and confirm password
 */
export const validatePasswordReset = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),

  validate,
];

/**
 * Token Validation Rules
 * Validates token parameter in URL
 */
export const validateToken = [
  param('token')
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 32 })
    .withMessage('Invalid token format'),

  validate,
];

/**
 * MongoDB ObjectId Validation Rules
 * Validates ID parameter in URL
 */
export const validateObjectId = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .isMongoId()
    .withMessage('Invalid ID format'),

  validate,
];

/**
 * Pagination Validation Rules
 * Validates page and limit query parameters
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  validate,
];

/**
 * User Profile Update Validation Rules
 * Validates profile fields (fullName, phone, address, bio)
 */
export const validateProfileUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),

  validate,
];

/**
 * Course Creation Validation Rules
 * Validates course fields (title, description, category, level)
 */
export const validateCourseCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Course category is required')
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'])
    .withMessage('Invalid category'),

  body('level')
    .trim()
    .notEmpty()
    .withMessage('Course level is required')
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid level'),

  validate,
];

/**
 * Refresh Token Validation Rules
 * Validates refresh token in request body
 */
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
    .isString()
    .withMessage('Refresh token must be a string'),

  validate,
];

/**
 * Search Query Validation Rules
 * Validates search query parameter
 */
export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('category')
    .optional()
    .isIn(['Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'])
    .withMessage('Invalid category'),

  query('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid level'),

  validate,
];

export default {
  validate,
  validateRegister,
  validateLogin,
  validateEmail,
  validatePasswordReset,
  validateToken,
  validateObjectId,
  validatePagination,
  validateProfileUpdate,
  validateCourseCreation,
  validateRefreshToken,
  validateSearch,
};
