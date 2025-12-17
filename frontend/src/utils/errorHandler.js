/**
 * Centralized Error Handler
 * Parses and formats errors from API responses
 */

import {
  ERROR_TYPES,
  ERROR_CODES,
  getErrorMessage,
  getHttpStatusMessage,
  getNetworkErrorMessage,
  getErrorType,
} from "./errorMessages";

/**
 * Check if error is a network error
 * @param {object} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return (
    !error.response &&
    (error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED" ||
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.message?.toLowerCase().includes("network") ||
      error.message?.toLowerCase().includes("timeout"))
  );
};

/**
 * Check if error is a validation error
 * @param {object} error - Error object
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  const status = error.response?.status;
  return status === 400 || status === 422;
};

/**
 * Check if error is an authentication error
 * @param {object} error - Error object
 * @returns {boolean}
 */
export const isAuthenticationError = (error) => {
  return error.response?.status === 401;
};

/**
 * Check if error is an authorization error
 * @param {object} error - Error object
 * @returns {boolean}
 */
export const isAuthorizationError = (error) => {
  return error.response?.status === 403;
};

/**
 * Check if error is a server error
 * @param {object} error - Error object
 * @returns {boolean}
 */
export const isServerError = (error) => {
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

/**
 * Extract validation errors from API response
 * @param {object} error - Error object
 * @returns {object} Validation errors object
 */
export const extractValidationErrors = (error) => {
  const response = error.response?.data;

  // Common validation error formats
  if (response?.errors && typeof response.errors === "object") {
    return response.errors;
  }

  if (response?.validationErrors) {
    return response.validationErrors;
  }

  if (response?.fields) {
    return response.fields;
  }

  return null;
};

/**
 * Format validation errors for display
 * @param {object} validationErrors - Validation errors object
 * @returns {string} Formatted error message
 */
export const formatValidationErrors = (validationErrors) => {
  if (!validationErrors) {
    return ERROR_CODES.VALIDATION_ERROR;
  }

  // If backend sent an array of error objects [{ field, message }, ...]
  if (Array.isArray(validationErrors)) {
    const errors = validationErrors
      .map((err) => {
        const field = err.field || err.param || "Field";
        const message = err.message || JSON.stringify(err);
        const fieldName =
          String(field).charAt(0).toUpperCase() + String(field).slice(1);
        return `${fieldName}: ${message}`;
      })
      .join("\n");
    return errors || ERROR_CODES.VALIDATION_ERROR;
  }

  // If validationErrors is an object { field: [messages] }
  if (typeof validationErrors === "object") {
    const errors = Object.entries(validationErrors)
      .map(([field, messages]) => {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
        const errorMessages = Array.isArray(messages) ? messages : [messages];
        return `${fieldName}: ${errorMessages.join(", ")}`;
      })
      .join("\n");

    return errors || ERROR_CODES.VALIDATION_ERROR;
  }

  return ERROR_CODES.VALIDATION_ERROR;
};

/**
 * Parse API error and return standardized error object
 * @param {object} error - Error object from axios
 * @returns {object} Standardized error object
 */
export const parseApiError = (error) => {
  // Default error object
  const parsedError = {
    type: ERROR_TYPES.UNKNOWN,
    message: ERROR_CODES.UNKNOWN_ERROR,
    code: null,
    statusCode: null,
    validationErrors: null,
    originalError: error,
  };

  // Network errors
  if (isNetworkError(error)) {
    parsedError.type = ERROR_TYPES.NETWORK;
    parsedError.message = error.code
      ? getNetworkErrorMessage(error.code)
      : ERROR_CODES.NETWORK_ERROR;
    parsedError.code = error.code;
    return parsedError;
  }

  // No response from server
  if (!error.response) {
    parsedError.type = ERROR_TYPES.NETWORK;
    parsedError.message = ERROR_CODES.NETWORK_ERROR;
    return parsedError;
  }

  const { status, data } = error.response;
  parsedError.statusCode = status;
  parsedError.type = getErrorType(error);

  // Extract error message from response
  const errorMessage =
    data?.message ||
    data?.error ||
    data?.msg ||
    data?.errorMessage ||
    getHttpStatusMessage(status);

  // Extract error code from response
  const errorCode = data?.code || data?.errorCode || data?.error_code;

  if (errorCode) {
    parsedError.code = errorCode;
    parsedError.message = getErrorMessage(errorCode, errorMessage);
  } else {
    parsedError.message = errorMessage;
  }

  // Handle validation errors
  if (isValidationError(error)) {
    const validationErrors = extractValidationErrors(error);
    if (validationErrors) {
      parsedError.validationErrors = validationErrors;
      parsedError.message = formatValidationErrors(validationErrors);
    }
  }

  return parsedError;
};

/**
 * Format error message for display
 * @param {object|string} error - Error object or string
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
  // If already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // If it's a parsed error object
  if (error.message) {
    return error.message;
  }

  // If it's an axios error, parse it
  if (error.response || error.request) {
    const parsedError = parseApiError(error);
    return parsedError.message;
  }

  // If it's a standard Error object
  if (error instanceof Error) {
    return error.message || ERROR_CODES.UNKNOWN_ERROR;
  }

  return ERROR_CODES.UNKNOWN_ERROR;
};

/**
 * Handle API error with logging in development
 * @param {object} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {object} Parsed error
 */
export const handleApiError = (error, context = "") => {
  const parsedError = parseApiError(error);

  // Log in development mode
  if (import.meta.env.DEV) {
    console.group(`🚨 API Error${context ? ` - ${context}` : ""}`);
    console.error("Error Type:", parsedError.type);
    console.error("Status Code:", parsedError.statusCode);
    console.error("Error Code:", parsedError.code);
    console.error("Message:", parsedError.message);
    if (parsedError.validationErrors) {
      console.error("Validation Errors:", parsedError.validationErrors);
    }
    console.error("Original Error:", parsedError.originalError);
    console.groupEnd();
  }

  return parsedError;
};

/**
 * Create custom error object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {string} type - Error type
 * @returns {object} Error object
 */
export const createError = (
  message,
  code = null,
  type = ERROR_TYPES.UNKNOWN
) => {
  return {
    type,
    message,
    code,
    statusCode: null,
    validationErrors: null,
    originalError: null,
  };
};

export default {
  parseApiError,
  handleApiError,
  formatErrorMessage,
  isNetworkError,
  isValidationError,
  isAuthenticationError,
  isAuthorizationError,
  isServerError,
  extractValidationErrors,
  formatValidationErrors,
  createError,
};
