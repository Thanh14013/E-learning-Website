import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateTokenPair,
} from "../config/jwt.config.js";
import { AppError } from "../middleware/errorHandler.js";

// Check if running in production environment
const isProduction = process.env.NODE_ENV === "production";

// Reuse a single Google OAuth client instance
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

/**
 * POST /api/auth/register
 * @desc Register a new user
 * @access Public
 *
 * @body {string} fullName - Full name of the user
 * @body {string} email - Email address of the user
 * @body {string} password - Plain text password
 */

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

 * POST /api/auth/refresh-token
 * @desc Generate a new access token using a valid refresh token
 * @access Public
 *
 * @body {string} refreshToken - User's refresh token
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required." });
    }

    // Verify refresh token using JWT config
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token." });
    }

    // Find user and verify refresh token matches stored token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Refresh token does not match." });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    res.status(200).json({
      message: "Access token refreshed successfully.",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error during token refresh." });
  }
};

/**
 * POST /api/auth/login
 * @desc Log in user and return access & refresh tokens
 * @access Public
 *
 * @body {string} email - User's email address
 * @body {string} password - User's password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide your email and password." });
    }

    // Check for hardcoded admin credentials from environment variables
    const adminUsername = process.env.ADMIN_ACC;
    const adminPassword = process.env.ADMIN_PASS;

    if (email === adminUsername && password === adminPassword) {
      // Admin login - generate tokens without database user
      const { accessToken, refreshToken } = generateTokenPair({
        id: "admin_hardcoded",
        role: "admin",
        email: adminUsername,
      });

      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "None" : "Lax",
        maxAge: (() => {
          const expires = process.env.JWT_REFRESH_EXPIRE || "7d";
          if (expires.endsWith("d")) {
            const days = parseInt(expires.replace("d", ""), 10);
            return days * 24 * 60 * 60 * 1000;
          }
          return 7 * 24 * 60 * 60 * 1000;
        })(),
      };

      res.cookie("refreshToken", refreshToken, cookieOptions);

      return res.status(200).json({
        message: "Admin login successful.",
        user: {
          _id: "admin_hardcoded",
          fullName: "System Administrator",
          email: adminUsername,
          role: "admin",
          avatar: "",
          isVerified: true,
          profileCompleted: true,
        },
        tokens: { accessToken, refreshToken },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Prevent regular users from having admin role
    if (user.role === "admin") {
      return res.status(403).json({
        message: "Invalid login method for admin accounts.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const { accessToken, refreshToken } = generateTokenPair({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // true khi deploy https
      sameSite: isProduction ? "None" : "Lax",
      maxAge: (() => {
        const expires = process.env.JWT_REFRESH_EXPIRE || "7d";

        if (expires.endsWith("d")) {
          const days = parseInt(expires.replace("d", ""), 10);
          return days * 24 * 60 * 60 * 1000;
        }

        return 7 * 24 * 60 * 60 * 1000; // 7 days
      })(),
    };

    res.cookie("refreshToken", refreshToken, cookieOptions);

    const userProfile = await UserProfile.findOne({ userId: user._id });

    res.status(200).json({
      message: "Login successful.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
        profileApprovalStatus: user.profileApprovalStatus,
        profile: userProfile
          ? {
              phone: userProfile.phone,
              address: userProfile.address,
              bio: userProfile.bio,
              expertise: userProfile.expertise,
              qualifications: userProfile.qualifications,
              cvUrl: userProfile.cvUrl,
            }
          : null,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

/**
 * POST /api/auth/google
 * @desc Authenticate with Google One Tap / OAuth2 ID token
 * @access Public
 *
 * @body {string} credential - Google ID token
 */
export const loginWithGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res
        .status(400)
        .json({ message: "Google credential is required." });
    }

    if (!googleClient) {
      return res.status(500).json({ message: "Google SSO is not configured." });
    }

    // Verify the ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res
        .status(401)
        .json({ message: "Unable to verify Google token." });
    }

    const { email, name, picture, email_verified: emailVerified } = payload;

    if (!email || !emailVerified) {
      return res
        .status(401)
        .json({ message: "Google account email is not verified." });
    }

    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail }).select(
      "+password +refreshToken"
    );

    // Disallow SSO for admin accounts to avoid bypassing admin auth
    if (user && user.role === "admin") {
      return res.status(403).json({
        message: "Google login is not available for admin accounts.",
      });
    }

    // Disallow banned users
    if (user && user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned. Contact support for help.",
      });
    }

    // Create user if not exists (default role: student)
    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString("hex");

      user = await User.create({
        fullName: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: randomPassword,
        role: "student",
        avatar: picture || "",
        isVerified: true,
      });

      await UserProfile.create({ userId: user._id });
    } else {
      // Update missing profile info opportunistically
      let shouldSave = false;

      if (!user.fullName && name) {
        user.fullName = name;
        shouldSave = true;
      }

      if (!user.avatar && picture) {
        user.avatar = picture;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save({ validateBeforeSave: false });
      }
    }

    const { accessToken, refreshToken } = generateTokenPair({
      id: user._id,
      role: user.role || "student",
      email: user.email,
    });

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: (() => {
        const expires = process.env.JWT_REFRESH_EXPIRE || "7d";

        if (expires.endsWith("d")) {
          const days = parseInt(expires.replace("d", ""), 10);
          return days * 24 * 60 * 60 * 1000;
        }

        return 7 * 24 * 60 * 60 * 1000;
      })(),
    };

    res.cookie("refreshToken", refreshToken, cookieOptions);

    const userProfile = await UserProfile.findOne({ userId: user._id });

    return res.status(200).json({
      message: "Login successful with Google.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
        profileApprovalStatus: user.profileApprovalStatus,
        profile: userProfile
          ? {
              phone: userProfile.phone,
              address: userProfile.address,
              bio: userProfile.bio,
              expertise: userProfile.expertise,
              qualifications: userProfile.qualifications,
              cvUrl: userProfile.cvUrl,
            }
          : null,
      },
      tokens: {
        accessToken,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res
      .status(500)
      .json({ message: "Server error during Google login." });
  }
};

/**
 * PUT /api/auth/reset-password/:token
 * @desc Reset user password using a valid reset token
 * @access Public
 *
 * @params {string} token - Password reset token
 * @body {string} password - New password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "New password is required." });
    }

/**
́́ * POST /api/auth/logout
 * @desc Log out user and invalidate refresh token
 * @access Private
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token found." });
    }

    // Verify refresh token using JWT config
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token." });
    }

    const user = await User.findById(decoded.id);

    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Log out error:", error);
    res.status(500).json({ message: "Server error during log out." });
  }
};
