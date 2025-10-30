import User from '../models/user.model.js';
import UserProfile from '../models/userProfile.model.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../services/email.services.js';
import { generateAccessToken, generateRefreshToken } from "../services/token.services.js";

const isProduction = process.env.NODE_ENV === 'production';

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'This email already exists in our system.' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

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

        // JWT token
        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRE }
        );

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
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
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/auth/verify-email/:token
 */
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ message: 'Invalid verification token.' });
        }

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Token not found or has expired.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            message: 'Email verified successfully. You can now log in.',
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Server error during email verification.' });
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
