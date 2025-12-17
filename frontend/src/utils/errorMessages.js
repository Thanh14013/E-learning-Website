/**
 * Error Messages Configuration
 * Maps error codes to user-friendly messages
 */

// Error Types
export const ERROR_TYPES = {
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  SERVER: "SERVER",
  NOT_FOUND: "NOT_FOUND",
  UNKNOWN: "UNKNOWN",
};

// HTTP Status Code Messages
export const HTTP_STATUS_MESSAGES = {
  400: "Bad request. Please check your input.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to access this resource.",
  404: "Requested resource not found.",
  408: "Request timed out. Please try again.",
  409: "Data conflict. Please refresh the page and try again.",
  422: "Invalid data. Please check your input.",
  429: "Too many requests. Please try again later.",
  500: "Server error. Please try again later.",
  502: "Server not responding. Please try again later.",
  503: "Service temporarily unavailable. Please try again later.",
  504: "Server timed out. Please try again later.",
};

// Application Specific Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  EMAIL_ALREADY_EXISTS: "This email is already registered.",
  EMAIL_NOT_FOUND: "Email not found.",
  INVALID_TOKEN: "Invalid or expired token.",
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  ACCOUNT_LOCKED: "Account is locked. Please contact the administrator.",
  ACCOUNT_NOT_VERIFIED: "Account not verified. Please check your email.",

  // Validation Errors
  VALIDATION_ERROR: "Invalid data.",
  REQUIRED_FIELD_MISSING: "Please fill in all required fields.",
  INVALID_EMAIL_FORMAT: "Invalid email format.",
  INVALID_PASSWORD_FORMAT:
    "Password must be at least 8 characters and include uppercase, lowercase letters, and numbers.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password must not exceed 128 characters.",
  PASSWORDS_DO_NOT_MATCH: "Password confirmation does not match.",
  INVALID_PHONE_NUMBER: "Invalid phone number.",
  INVALID_DATE_FORMAT: "Invalid date format.",

  // Course Errors
  COURSE_NOT_FOUND: "Course not found.",
  COURSE_ALREADY_ENROLLED: "You are already enrolled in this course.",
  COURSE_FULL: "Course is full.",
  COURSE_NOT_AVAILABLE: "Course is currently not available.",
  INSUFFICIENT_PERMISSIONS:
    "You do not have permission to perform this action.",

  // Lesson Errors
  LESSON_NOT_FOUND: "Lesson not found.",
  LESSON_LOCKED: "This lesson is locked.",
  PREREQUISITE_NOT_COMPLETED: "You need to complete the prerequisite lesson.",

  // Quiz Errors
  QUIZ_NOT_FOUND: "Quiz not found.",
  QUIZ_ALREADY_SUBMITTED: "You have already submitted this quiz.",
  QUIZ_TIME_EXPIRED: "Quiz time has expired.",
  INVALID_QUIZ_ANSWER: "Invalid quiz answer.",

  // Upload Errors
  FILE_TOO_LARGE: "File size too large. Please choose a smaller file.",
  INVALID_FILE_TYPE: "Invalid file type.",
  UPLOAD_FAILED: "File upload failed. Please try again.",

  // Network Errors
  NETWORK_ERROR:
    "No network connection. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  CONNECTION_REFUSED: "Cannot connect to the server.",

  // Generic Errors
  UNKNOWN_ERROR: "An unknown error occurred. Please try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  MAINTENANCE_MODE: "System is under maintenance. Please try again later.",
};

// Network Error Messages
export const NETWORK_ERROR_MESSAGES = {
  ECONNABORTED: "Connection aborted. Please try again.",
  ECONNREFUSED: "Cannot connect to the server.",
  ECONNRESET: "Connection was reset. Please try again.",
  ETIMEDOUT: "Connection timed out.",
  ENETUNREACH: "Network unreachable.",
  ERR_NETWORK: "Network error. Please check your internet connection.",
  ERR_BAD_REQUEST: "Bad request.",
  ERR_BAD_RESPONSE: "Bad response from server.",
};

/**
 * Get error message by error code
 * @param {string} code - Error code
 * @param {string} defaultMessage - Default message if code not found
 * @returns {string} Error message
 */
export const getErrorMessage = (
  code,
  defaultMessage = ERROR_CODES.UNKNOWN_ERROR
) => {
  return ERROR_CODES[code] || defaultMessage;
};

/**
 * Get error message by HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error message
 */
export const getHttpStatusMessage = (statusCode) => {
  return HTTP_STATUS_MESSAGES[statusCode] || ERROR_CODES.UNKNOWN_ERROR;
};

/**
 * Get network error message
 * @param {string} code - Network error code
 * @returns {string} Error message
 */
export const getNetworkErrorMessage = (code) => {
  return NETWORK_ERROR_MESSAGES[code] || ERROR_CODES.NETWORK_ERROR;
};

/**
 * Determine error type based on error object
 * @param {object} error - Error object
 * @returns {string} Error type
 */
export const getErrorType = (error) => {
  if (!error.response && (error.code || error.message?.includes("Network"))) {
    return ERROR_TYPES.NETWORK;
  }

  const status = error.response?.status;
  if (status === 401) return ERROR_TYPES.AUTHENTICATION;
  if (status === 403) return ERROR_TYPES.AUTHORIZATION;
  if (status === 404) return ERROR_TYPES.NOT_FOUND;
  if (status === 422 || status === 400) return ERROR_TYPES.VALIDATION;
  if (status >= 500) return ERROR_TYPES.SERVER;

  return ERROR_TYPES.UNKNOWN;
};
