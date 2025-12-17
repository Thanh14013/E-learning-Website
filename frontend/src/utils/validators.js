/**
 * Validation Utilities
 * Common validation functions with error messages
 */

import { ERROR_CODES } from "./errorMessages";

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === "") {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: ERROR_CODES.INVALID_EMAIL_FORMAT };
  }

  return { isValid: true, error: null };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecialChar = false,
  } = options;

  if (!password || password.trim() === "") {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }

  if (password.length > maxLength) {
    return {
      isValid: false,
      error: `Password must not exceed ${maxLength} characters`,
    };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one uppercase letter",
    };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one lowercase letter",
    };
  }

  if (requireNumber && !/\d/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one digit",
    };
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character",
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.trim() === "") {
    return { isValid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: ERROR_CODES.PASSWORDS_DO_NOT_MATCH };
  }

  return { isValid: true, error: null };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateRequired = (value, fieldName = "This field") => {
  if (value === null || value === undefined) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (typeof value === "string" && value.trim() === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  return { isValid: true, error: null };
};

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Name of the field
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateLength = (
  value,
  minLength,
  maxLength,
  fieldName = "This field"
) => {
  if (!value) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const length = value.toString().length;

  if (minLength && length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (maxLength && length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate phone number (Vietnamese format)
 * @param {string} phone - Phone number to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validatePhone = (phone) => {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Phone number is required" };
  }

  // Vietnamese phone number format: 10 digits starting with 0
  const phoneRegex = /^(0|\+84)[0-9]{9}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
    return { isValid: false, error: ERROR_CODES.INVALID_PHONE_NUMBER };
  }

  return { isValid: true, error: null };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateUrl = (url) => {
  if (!url || url.trim() === "") {
    return { isValid: false, error: "URL is required" };
  }

  try {
    new URL(url);
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: "Invalid URL" };
  }
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateRange = (value, min, max, fieldName = "Value") => {
  if (value === null || value === undefined || value === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a number` };
  }

  if (min !== null && numValue < min) {
    return {
      isValid: false,
      error: `${fieldName} must be greater than or equal to ${min}`,
    };
  }

  if (max !== null && numValue > max) {
    return {
      isValid: false,
      error: `${fieldName} must be less than or equal to ${max}`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {string} fieldName - Name of the field
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateDate = (date, fieldName = "Date") => {
  if (!date) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: ERROR_CODES.INVALID_DATE_FORMAT };
  }

  return { isValid: true, error: null };
};

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateFileSize = (file, maxSizeMB = 10) => {
  if (!file) {
    return { isValid: false, error: "Please select a file" };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must not exceed ${maxSizeMB}MB`,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {object} { isValid: boolean, error: string|null }
 */
export const validateFileType = (file, allowedTypes = []) => {
  if (!file) {
    return { isValid: false, error: "Please select a file" };
  }

  if (allowedTypes.length === 0) {
    return { isValid: true, error: null };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: ERROR_CODES.INVALID_FILE_TYPE,
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate multiple fields at once
 * @param {object} fields - Object with field names as keys and validation functions as values
 * @returns {object} { isValid: boolean, errors: object }
 */
export const validateFields = (fields) => {
  const errors = {};
  let isValid = true;

  Object.entries(fields).forEach(([fieldName, validationFn]) => {
    const result = validationFn();
    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

/**
 * Create a validation error object
 * @param {string} field - Field name
 * @param {string} message - Error message
 * @returns {object} Validation error object
 */
export const createValidationError = (field, message) => {
  return {
    field,
    message,
  };
};

export default {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
  validateLength,
  validatePhone,
  validateUrl,
  validateRange,
  validateDate,
  validateFileSize,
  validateFileType,
  validateFields,
  createValidationError,
};
