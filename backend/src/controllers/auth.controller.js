import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/email.services.js";
import {
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
} from "../config/jwt.config.js";
import sendEmail from "../config/sendGrid.config.js";

// Check if running in production environment
const isProduction = process.env.NODE_ENV === "production";

/**
 * POST /api/auth/register
 * @desc Register a new user and send verification email
 * @access Public
 *
 * @body {string} fullName - Full name of the user
 * @body {string} email - Email address of the user
 * @body {string} password - Plain text password
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate input data
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
    }

    // Prevent admin role registration
    if (role === "admin") {
      return res
        .status(403)
        .json({ message: "Admin accounts cannot be registered." });
    }

    // Handle duplicate email error
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This email already exists in our system." });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // create user record with role (only student or teacher)
    const user = await User.create({
      fullName,
      email,
      password,
      role: role === "teacher" ? "teacher" : "student",
      verificationToken,
    });

    // create user profile
    await UserProfile.create({ userId: user._id });

    // send verification email
    await sendVerificationEmail(user.email, user.fullName, verificationToken);

    // Generate JWT tokens using centralized JWT config
    const { accessToken, refreshToken } = generateTokenPair({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    // Save refresh token to user record
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
        profileApprovalStatus: user.profileApprovalStatus,
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/auth/verify-email
 * @desc Verify user's email address using token
 * @access Public
 *
 * @body {string} token - Email verification token
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Invalid verification token." });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Token not found or has expired." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res
      .status(500)
      .json({ message: "Server error during email verification." });
  }
};

/**
 * POST /api/auth/resend-verification
 * @desc Resend email verification link
 * @access Private
 */
export const resendVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    try {
      // TODO: Implement email sending via sendGrid
      // await sendVerificationEmail(user.email, verificationUrl);

      res.status(200).json({
        success: true,
        message: "Verification email sent successfully.",
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      res.status(500).json({ message: "Failed to send verification email." });
    }
  } catch (error) {
    console.error("Resend verification error:", error);
    res
      .status(500)
      .json({ message: "Server error while resending verification." });
  }
};

/**
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

    // Return verification status without proceeding to login
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Your account has not been verified. Please check your email.",
        isVerified: false,
        requiresVerification: true,
      });
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

    // Validate password strength
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    // Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user by reset token and ensure token is still valid
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired password reset token." });
    }

    // Update password
    user.password = password;

    // Clear reset token + expiry
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error while resetting password." });
  }
};

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

/**
 * POST /api/auth/forgot-password
 * @desc Send a password reset link to user's email
 * @access Public
 *
 * @body {string} email - Registered email address of the user
 */
export const forgotPassword = async (req, res) => {
  let user;

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if user exists
    user = await User.findOne({ email });
    if (!user) {
      // (Optional) To prevent email enumeration, return generic message
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to DB (for security)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set reset token + expiry (10 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Build reset URL (frontend)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const html = `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.fullName || "User"},</p>
            <p>You requested to reset your password. Click the link below to reset it:</p>
            <a href="${resetUrl}" target="_blank">${resetUrl}</a>
            <p>This link will expire in 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

    // Send via SendGrid
    await sendEmail(user.email, "Password Reset Request", "", { html });

    res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    // Reset token cleanup if error occurred after saving
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res
      .status(500)
      .json({ message: "Server error while sending password reset email." });
  }
};
