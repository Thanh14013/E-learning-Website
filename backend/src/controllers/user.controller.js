import { uploadFile } from "../config/cloudinary.config.js";
import User from "../models/user.model.js";
import UserProfile from "../models/userProfile.model.js";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Course from "../models/course.model.js";
import Progress from "../models/progress.model.js";
import bcrypt from "bcryptjs";

/**
 * GET /api/users/profile
 * @desc Get the full profile of the currently authenticated user
 * @access Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const profile = await UserProfile.findOne({ userId })
      .populate("enrolledCourses", "title description thumbnail")
      .populate("teachingCourses", "title description thumbnail");

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully.",
      data: {
        user,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching user profile." });
  }
};

/**
 * PUT /api/users/profile
 * @desc Update the authenticated user's basic info and profile details
 * @access Private
 *
 * @body {string} [fullName] - User's full name
 * @body {string} [email] - User's email address
 * @body {string} [phone] - User's phone number
 * @body {string} [address] - User's address
 * @body {string} [bio] - Short bio
 * @body {Date} [dateOfBirth] - User's date of birth
 * @body {object} [socialLinks] - Object containing social links { facebook, twitter, linkedin }
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, phone, address, bio, dateOfBirth, socialLinks } =
      req.body;

    // Validate input fields
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // update name, email
    if (fullName) {
      user.fullName = fullName.trim();
    }

    if (email) {
      user.email = email.toLowerCase().trim();
    }

    await user.save({ validateBeforeSave: false });

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    // Update user profile
    if (phone) {
      profile.phone = phone.trim();
    }

    if (address) {
      profile.address = address.trim();
    }

    if (bio) {
      profile.bio = bio.trim();
    }

    if (dateOfBirth) {
      profile.dateOfBirth = new Date(dateOfBirth);
    }

    if (socialLinks && typeof socialLinks === "object") {
      profile.socialLinks = {
        facebook: socialLinks.facebook || profile.socialLinks.facebook,
        twitter: socialLinks.twitter || profile.socialLinks.twitter,
        linkedin: socialLinks.linkedin || profile.socialLinks.linkedin,
      };
    }

    // Teacher specific fields
    if (req.user.role === 'teacher') {
        if (req.body.expertise) {
            profile.expertise = req.body.expertise.trim();
        }
        if (req.body.qualifications) {
            profile.qualifications = req.body.qualifications.trim();
        }
    }

    await profile.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      profile,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

/**
 * POST /api/users/avatar
 * @desc Upload or update the authenticated user's avatar image
 * @access Private
 *
 * @file {File} file - Image file (multipart/form-data)
 */
export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // ✅ Upload to Cloudinary
    const filePath = path.resolve(req.file.path);
    const imageUpload = await uploadFile(filePath, {
      folder: "avatars",
      resource_type: "image",
      transformation: [{ width: 400, height: 400, crop: "fill" }],
    });

    // Xóa file tạm sau khi upload
    fs.unlinkSync(filePath);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.includes("cloudinary.com")) {
      try {
        // Extract publicId (.../avatars/xxxx.jpg)
        const parts = user.avatar.split("/");
        const filename = parts[parts.length - 1];
        const publicId = `avatars/${filename.split(".")[0]}`;
        const { v2: cloudinary } = await import("cloudinary");
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("Warning: Failed to delete old avatar ->", err.message);
      }
    }

    user.avatar = imageUpload.secure_url;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully.",
      data: {
        avatar: imageUpload.secure_url,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          avatar: imageUpload.secure_url,
        },
      },
    });
  } catch (error) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ message: "Server error while uploading avatar." });
  }
};

/**
 * GET /api/users/list
 * @desc Get paginated, filtered, and sorted user list (admin only)
 * @access Admin
 *
 * @query {string} [role] - Filter users by role (student | teacher | admin)
 * @query {boolean} [isVerified] - Filter users by verification status
 * @query {number} [page=1] - Page number
 * @query {number} [limit=10] - Number of users per page
 * @query {string} [sort=createdAt] - Field to sort by (e.g., "email", "-createdAt")
 */
export const getUserList = async (req, res) => {
  try {
    const {
      role,
      isVerified,
      page = 1,
      limit = 10,
      sort = "createdAt",
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isVerified !== undefined) query.isVerified = isVerified === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password -refreshToken");

    return res.status(200).json({
      total: totalUsers,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalUsers / limit),
      users,
    });
  } catch (error) {
    console.error("Get user list error:", error);
    res.status(500).json({ message: "Server error while fetching users." });
  }
};

/**
 * PUT /api/users/:id/role
 * @desc Update user role (admin only)
 * @access Admin
 *
 * @params {string} id - ID of the user
 * @body {string} role - New role (student | teacher | admin)
 */
export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    if (!["student", "teacher", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Must be student, teacher, or admin." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "User role updated successfully.",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Server error while updating user role." });
  }
};

/**
 * PUT /api/users/:id/ban
 * @desc Ban or unban a user (admin only)
 * @access Admin
 *
 * @params {string} id - ID of the user
 * @body {boolean} isBanned - Ban status
 */
export const banUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBanned } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    if (typeof isBanned !== "boolean") {
      return res
        .status(400)
        .json({ message: "isBanned must be a boolean value." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isBanned = isBanned;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: `User ${isBanned ? "banned" : "unbanned"} successfully.`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    console.error("Ban user error:", error);
    res
      .status(500)
      .json({ message: "Server error while banning/unbanning user." });
  }
};

/**
 * DELETE /api/users/:id
 * @desc Delete a user and related data (admin only)
 * @access Admin
 *
 * @params {string} id - ID of the user to delete
 */
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Delete user profile if exists
    await UserProfile.findOneAndDelete({ userId });

    // Delete courses if user is a teacher
    if (user.role === "teacher") {
      await Course.deleteMany({ teacher: userId });
    }

    // Delete progress if user is a student
    if (user.role === "student") {
      await Progress.deleteMany({ user: userId });
    }

    // Delete user itself
    await user.deleteOne();

    return res
      .status(200)
      .json({ message: "User and related data deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error while deleting user." });
  }
};

/**
 * PUT /api/users/teachers/:id/approval
 * @desc Admin updates teacher profile approval status
 * @access Admin
 */
export const updateTeacherApprovalStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["approved", "rejected", "pending"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== "teacher") {
      return res
        .status(400)
        .json({ message: "Only teacher profiles can be reviewed." });
    }

    user.profileApprovalStatus = status;
    if (status === "approved") {
      user.profileCompleted = true;
      user.isVerified = true;
    }
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: `Teacher profile marked as ${status}.`,
      data: {
        id: user._id,
        profileApprovalStatus: user.profileApprovalStatus,
      },
    });
  } catch (error) {
    console.error("Update teacher approval status error:", error);
    return res
      .status(500)
      .json({ message: "Server error while updating approval status." });
  }
};
/**
 * POST /api/users/complete-teacher-profile
 * @desc Submit teacher profile completion with CV
 * @access Private (Teacher only)
 *
 * @body {string} phone - Teacher's phone number
 * @body {string} address - Teacher's address
 * @body {string} bio - Short bio
 * @body {string} expertise - Areas of expertise
 * @body {string} qualifications - Educational qualifications
 * @file cv - CV file (PDF)
 */
export const completeTeacherProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, address, bio, expertise, qualifications } = req.body;

    // Check if user is a teacher
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can complete this profile." });
    }

    if (user.profileCompleted) {
      return res
        .status(400)
        .json({ message: "Profile has already been completed." });
    }

    // Validate required fields
    if (!phone || !address || !bio || !expertise || !qualifications) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if CV file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "CV file is required." });
    }

    // Upload CV to Cloudinary
    let cvUrl, cvPublicId;
    try {
      const result = await uploadFile(req.file.path, {
        folder: "cvs",
        resource_type: "raw",
      });
      cvUrl = result.secure_url;
      cvPublicId = result.public_id;

      // Delete local file after upload
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (uploadError) {
      console.error("CV upload error:", uploadError);
      return res.status(500).json({ message: "Failed to upload CV." });
    }

    // Update user profile
    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    profile.phone = phone.trim();
    profile.address = address.trim();
    profile.bio = bio.trim();
    profile.expertise = expertise.trim();
    profile.qualifications = qualifications.trim();
    profile.cvUrl = cvUrl;
    profile.cvPublicId = cvPublicId;

    await profile.save();

    // Update user status
    user.profileCompleted = true;
    user.profileApprovalStatus = "pending";
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message:
        "Profile submitted successfully. Please wait for admin approval (at least 48 hours).",
      data: {
        profileCompleted: user.profileCompleted,
        profileApprovalStatus: user.profileApprovalStatus,
      },
    });
  } catch (error) {
    console.error("Complete teacher profile error:", error);
    res
      .status(500)
      .json({ message: "Server error while completing teacher profile." });
  }
};

/**
 * PUT /api/users/change-password
 * @desc Change user password
 * @access Private
 *
 * @body {string} currentPassword - Current password
 * @body {string} newPassword - New password
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: "Server error while changing password.",
    });
  }
};
