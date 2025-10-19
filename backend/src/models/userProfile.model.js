import mongoose from 'mongoose';

/**
 * @typedef {Object} UserProfile
 * @property {mongoose.Schema.Types.ObjectId} userId - Liên kết tới User, duy nhất và bắt buộc.
 * @property {String} phone - Số điện thoại người dùng.
 * @property {String} address - Địa chỉ người dùng.
 * @property {Date} dateOfBirth - Ngày sinh.
 * @property {String} bio - Giới thiệu ngắn về bản thân.
 * @property {Object} socialLinks - Liên kết mạng xã hội.
 * @property {String} socialLinks.facebook - Link Facebook.
 * @property {String} socialLinks.twitter - Link Twitter.
 * @property {String} socialLinks.linkedin - Link LinkedIn.
 * @property {Array<mongoose.Schema.Types.ObjectId>} enrolledCourses - Các khóa học đã đăng ký.
 * @property {Array<mongoose.Schema.Types.ObjectId>} teachingCourses - Các khóa học đang giảng dạy.
 */
const userProfileSchema = new mongoose.Schema(
    {
        // Relationship with User Model (One-to-One)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
            required: true,
            unique: true, // Setup unique index to enforce one profile per user
        },
        phone: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        dateOfBirth: {
            type: Date,
        },
        bio: {
            type: String,
            trim: true,
            maxlength: [500, 'Tiểu sử không được vượt quá 500 ký tự.'],
        },
        socialLinks: {
            facebook: { type: String, trim: true },
            twitter: { type: String, trim: true },
            linkedin: { type: String, trim: true },
        },
        enrolledCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course', // Reference to the Course model
            },
        ],
        teachingCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course', // Reference to the Course model
            },
        ],
    },
    {
        // Add timestamps (createdAt, updatedAt)
        timestamps: true,
    }
);

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

export default UserProfile;