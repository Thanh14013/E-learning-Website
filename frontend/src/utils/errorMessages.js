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
  400: "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền truy cập tài nguyên này.",
  404: "Không tìm thấy tài nguyên yêu cầu.",
  408: "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.",
  409: "Xung đột dữ liệu. Vui lòng làm mới trang và thử lại.",
  422: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
  429: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  500: "Lỗi máy chủ. Vui lòng thử lại sau.",
  502: "Máy chủ không phản hồi. Vui lòng thử lại sau.",
  503: "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.",
  504: "Máy chủ không phản hồi kịp thời. Vui lòng thử lại sau.",
};

// Application Specific Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
  EMAIL_ALREADY_EXISTS: "Email này đã được đăng ký.",
  EMAIL_NOT_FOUND: "Email không tồn tại trong hệ thống.",
  INVALID_TOKEN: "Token không hợp lệ hoặc đã hết hạn.",
  TOKEN_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  ACCOUNT_LOCKED: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.",
  ACCOUNT_NOT_VERIFIED:
    "Tài khoản chưa được xác thực. Vui lòng kiểm tra email.",

  // Validation Errors
  VALIDATION_ERROR: "Dữ liệu không hợp lệ.",
  REQUIRED_FIELD_MISSING: "Vui lòng điền đầy đủ thông tin bắt buộc.",
  INVALID_EMAIL_FORMAT: "Định dạng email không hợp lệ.",
  INVALID_PASSWORD_FORMAT:
    "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.",
  PASSWORD_TOO_SHORT: "Mật khẩu phải có ít nhất 8 ký tự.",
  PASSWORD_TOO_LONG: "Mật khẩu không được vượt quá 128 ký tự.",
  PASSWORDS_DO_NOT_MATCH: "Mật khẩu xác nhận không khớp.",
  INVALID_PHONE_NUMBER: "Số điện thoại không hợp lệ.",
  INVALID_DATE_FORMAT: "Định dạng ngày không hợp lệ.",

  // Course Errors
  COURSE_NOT_FOUND: "Không tìm thấy khóa học.",
  COURSE_ALREADY_ENROLLED: "Bạn đã đăng ký khóa học này.",
  COURSE_FULL: "Khóa học đã đầy.",
  COURSE_NOT_AVAILABLE: "Khóa học hiện không khả dụng.",
  INSUFFICIENT_PERMISSIONS: "Bạn không có quyền thực hiện thao tác này.",

  // Lesson Errors
  LESSON_NOT_FOUND: "Không tìm thấy bài học.",
  LESSON_LOCKED: "Bài học này chưa được mở khóa.",
  PREREQUISITE_NOT_COMPLETED: "Bạn cần hoàn thành bài học trước đó.",

  // Quiz Errors
  QUIZ_NOT_FOUND: "Không tìm thấy bài kiểm tra.",
  QUIZ_ALREADY_SUBMITTED: "Bạn đã nộp bài kiểm tra này.",
  QUIZ_TIME_EXPIRED: "Thời gian làm bài đã hết.",
  INVALID_QUIZ_ANSWER: "Câu trả lời không hợp lệ.",

  // Upload Errors
  FILE_TOO_LARGE: "Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn.",
  INVALID_FILE_TYPE: "Loại file không được hỗ trợ.",
  UPLOAD_FAILED: "Tải file lên thất bại. Vui lòng thử lại.",

  // Network Errors
  NETWORK_ERROR: "Không có kết nối mạng. Vui lòng kiểm tra kết nối internet.",
  TIMEOUT_ERROR: "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.",
  CONNECTION_REFUSED: "Không thể kết nối đến máy chủ.",

  // Generic Errors
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định. Vui lòng thử lại.",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
  MAINTENANCE_MODE: "Hệ thống đang bảo trì. Vui lòng thử lại sau.",
};

// Network Error Messages
export const NETWORK_ERROR_MESSAGES = {
  ECONNABORTED: "Kết nối bị gián đoạn. Vui lòng thử lại.",
  ECONNREFUSED: "Không thể kết nối đến máy chủ.",
  ECONNRESET: "Kết nối bị reset. Vui lòng thử lại.",
  ETIMEDOUT: "Kết nối đã hết thời gian chờ.",
  ENETUNREACH: "Không thể kết nối mạng.",
  ERR_NETWORK: "Lỗi mạng. Vui lòng kiểm tra kết nối internet.",
  ERR_BAD_REQUEST: "Yêu cầu không hợp lệ.",
  ERR_BAD_RESPONSE: "Phản hồi từ máy chủ không hợp lệ.",
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
