/**
 * Global Error Handler Middleware
 * Catches all errors thrown in the application
 * Returns consistent error responses to clients
 * Logs errors for debugging
 */

/**
 * Custom Error Class for Application Errors
 * Extends native Error with statusCode and isOperational properties
 */
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle Mongoose Cast Errors (Invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Duplicate Key Errors
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Validation Errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT Expired Token Error
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please login again.', 401);
};

/**
 * Handle JWT Invalid Token Error
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please login again.', 401);
};

/**
 * Send Error Response in Development Mode
 * Includes full error details for debugging
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * Send Error Response in Production Mode
 * Hides internal error details from clients
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }
  // Programming or unknown error: don't leak error details
  else {
    // Log error for debugging
    console.error('ERROR 💥:', err);

    // Send generic message
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

/**
 * Global Error Handler Middleware
 * Processes all errors and sends appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Check environment
  const environment = process.env.NODE_ENV || 'development';

  if (environment === 'development') {
    // Development: send full error details
    sendErrorDev(err, res);
  } else {
    // Production: handle specific error types
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') error = handleCastErrorDB(error);

    // Mongoose duplicate key
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);

    // Mongoose validation error
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

    // JWT expired token
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // JWT invalid token
    if (err.name === 'JsonWebTokenError') error = handleJWTError();

    // Send error response
    sendErrorProd(error, res);
  }
};

/**
 * Not Found Handler Middleware
 * Catches requests to undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404
  );
  next(error);
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 * Usage: asyncHandler(async (req, res, next) => { ... })
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default { errorHandler, notFoundHandler, asyncHandler, AppError };
