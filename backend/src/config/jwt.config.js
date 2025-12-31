import jwt from "jsonwebtoken";
import "dotenv/config";

/**
 * JWT Configuration Module
 * Handles JSON Web Token generation, verification, and management
 * Supports both access tokens and refresh tokens with different expiration times
 */

// JWT Secret Keys Configuration
export const JWT_CONFIG = {
  // Access Token Configuration
  ACCESS_TOKEN_SECRET:
    process.env.JWT_ACCESS_SECRET ||
    "your-access-token-secret-key-change-this-in-production",
  ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "3h", // 3 hours

  // Refresh Token Configuration
  REFRESH_TOKEN_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    "your-refresh-token-secret-key-change-this-in-production",
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d", // 7 days

  // Token Issuer
  ISSUER: process.env.JWT_ISSUER || "e-learning-platform",

  // Token Audience
  AUDIENCE: process.env.JWT_AUDIENCE || "e-learning-users",
};

/**
 * Generate Access Token
 * Creates a short-lived JWT token for API authentication
 * @param {Object} payload - Token payload containing user information
 * @param {string} payload.id - User ID
 * @param {string} payload.role - User role (student, teacher, admin)
 * @param {string} payload.email - User email
 * @returns {string} Signed JWT access token
 */
export const generateAccessToken = (payload) => {
  try {
    // Validate payload
    if (!payload || !payload.id) {
      throw new Error("Invalid payload: User ID is required");
    }

    // Token options
    const options = {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    };

    // Generate and sign token
    const token = jwt.sign(
      {
        id: payload.id,
        role: payload.role || "student",
        email: payload.email,
        type: "access",
      },
      JWT_CONFIG.ACCESS_TOKEN_SECRET,
      options
    );

    return token;
  } catch (error) {
    console.error("Error generating access token:", error.message);
    throw new Error("Failed to generate access token");
  }
};

/**
 * Generate Refresh Token
 * Creates a long-lived JWT token for token refresh operations
 * @param {Object} payload - Token payload containing user information
 * @param {string} payload.id - User ID
 * @returns {string} Signed JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  try {
    // Validate payload
    if (!payload || !payload.id) {
      throw new Error("Invalid payload: User ID is required");
    }

    // Token options
    const options = {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    };

    // Generate and sign token
    const token = jwt.sign(
      {
        id: payload.id,
        type: "refresh",
      },
      JWT_CONFIG.REFRESH_TOKEN_SECRET,
      options
    );

    return token;
  } catch (error) {
    console.error("Error generating refresh token:", error.message);
    throw new Error("Failed to generate refresh token");
  }
};

/**
 * Generate Token Pair
 * Creates both access and refresh tokens at once
 * @param {Object} payload - Token payload containing user information
 * @param {string} payload.id - User ID
 * @param {string} payload.role - User role
 * @param {string} payload.email - User email
 * @returns {Object} Object containing both tokens
 * @returns {string} return.accessToken - JWT access token
 * @returns {string} return.refreshToken - JWT refresh token
 */
export const generateTokenPair = (payload) => {
  try {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Error generating token pair:", error.message);
    throw new Error("Failed to generate token pair");
  }
};

/**
 * Verify Access Token
 * Validates and decodes a JWT access token
 * @param {string} token - JWT access token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    if (!token) {
      throw new Error("Token is required");
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });

    // Validate token type
    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      throw new Error("Access token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid access token");
    } else if (error.name === "NotBeforeError") {
      throw new Error("Access token not yet valid");
    }

    throw error;
  }
};

/**
 * Verify Refresh Token
 * Validates and decodes a JWT refresh token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    if (!token) {
      throw new Error("Token is required");
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });

    // Validate token type
    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      throw new Error("Refresh token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token");
    } else if (error.name === "NotBeforeError") {
      throw new Error("Refresh token not yet valid");
    }

    throw error;
  }
};

/**
 * Decode Token Without Verification
 * Decodes a JWT token without verifying its signature
 * Useful for extracting expired token data
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.decode(token, { complete: true });
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error.message);
    return null;
  }
};

/**
 * Check if Token is Expired
 * Checks whether a token has expired without full verification
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.payload) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.payload.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error.message);
    return true;
  }
};

/**
 * Get Token Expiration Time
 * Extracts the expiration timestamp from a token
 * @param {string} token - JWT token
 * @returns {number|null} Expiration timestamp or null if invalid
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.payload || !decoded.payload.exp) {
      return null;
    }

    return decoded.payload.exp;
  } catch (error) {
    console.error("Error getting token expiration:", error.message);
    return null;
  }
};

/**
 * Extract User ID from Token
 * Extracts user ID from a token without full verification
 * @param {string} token - JWT token
 * @returns {string|null} User ID or null if not found
 */
export const extractUserIdFromToken = (token) => {
  try {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.payload || !decoded.payload.id) {
      return null;
    }

    return decoded.payload.id;
  } catch (error) {
    console.error("Error extracting user ID from token:", error.message);
    return null;
  }
};

// Export default configuration object
export default {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  extractUserIdFromToken,
};
