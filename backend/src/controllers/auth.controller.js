import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/email.services.js";
import {
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
} from "../config/jwt.config.js";
import { sendEmail } from "../config/sendGrid.config.js";

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate input data
    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill in all required fields." });
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

    // create user record
    const user = await User.create({
      fullName,
      email,
      password,
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
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/auth/verify-email/:token
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

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
 * POST /api/auth/refresh-token
 * Generate a new access token using a valid refresh token
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
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide your email and password.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Your account has not been verified. Please check your email.' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction, // true khi deploy https
            sameSite: isProduction ? 'None' : 'Lax',
            maxAge: (() => {
                const expires = process.env.JWT_REFRESH_EXPIRE || '7d';

                if (expires.endsWith('d')) {
                    const days = parseInt(expires.replace('d', ''), 10);
                    return days * 24 * 60 * 60 * 1000;
                }

                return 7 * 24 * 60 * 60 * 1000; // 7 days
            })(),
        };

        res.cookie('refreshToken', refreshToken, cookieOptions);

        const userProfile = await UserProfile.findOne({ userId: user._id });

        res.status(200).json({
            message: 'Login successful.',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                isVerified: user.isVerified,
                profile: userProfile ? {
                    phone: userProfile.phone,
                    address: userProfile.address,
                } : null
            },
            tokens: {
                accessToken,
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

/**
 * POST /api/auth/forgot-password
 * Generate password reset token and send reset link to user's email
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
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

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
