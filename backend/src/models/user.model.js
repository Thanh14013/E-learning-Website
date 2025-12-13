import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @typedef {Object} User
 * @property {String} email - Địa chỉ email, duy nhất và bắt buộc.
 * @property {String} password - Mật khẩu đã được mã hóa, bắt buộc.
 * @property {String} fullName - Họ và tên người dùng, bắt buộc.
 * @property {String} role - Vai trò của người dùng ('admin', 'teacher', 'student').
 * @property {String} avatar - URL ảnh đại diện từ Cloudinary.
 * @property {Boolean} isVerified - Trạng thái xác thực email.
 * @property {String} verificationToken - Token để xác thực email.
 * @property {String} resetPasswordToken - Token để reset mật khẩu.
 * @property {Date} resetPasswordExpire - Thời gian hết hạn của token reset mật khẩu.
 * @property {String} refreshToken - Refresh token để duy trì đăng nhập.
 */
const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Vui lòng nhập họ và tên.'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Vui lòng nhập email.'],
            unique: true, // Setup unique index
            lowercase: true,
            trim: true,
            // Validator for email format
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Vui lòng nhập một địa chỉ email hợp lệ.',
            ],
        },
        password: {
            type: String,
            required: [true, 'Vui lòng nhập mật khẩu.'],
            // Validator for password strength
            minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự.'],
            select: false, // Không trả về mật khẩu khi query
        },
        role: {
            type: String,
            enum: ['admin', 'teacher', 'student'],
            default: 'student',
        },
        avatar: {
            type: String,
            default: ''
        },
        dateOfBirth: {
            type: Date,
            required: false
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: String,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        refreshToken: {
            type: String,
            select: false,
        },
    },
    {
        // Add timestamps (createdAt, updatedAt)
        timestamps: true,
    }
);

/**
 * Middleware: Mã hóa mật khẩu trước khi lưu
 * Sử dụng bcryptjs để hash mật khẩu nếu nó được thay đổi.
 */
userSchema.pre('save', async function (next) {
    // Chỉ hash mật khẩu nếu nó đã được sửa đổi (hoặc là mới)
    if (!this.isModified('password')) {
        return next();
    }

    // Generate salt - sinh chuỗi ngẫu nhiên
    const salt = await bcrypt.genSalt(10);
    // Hash the password using the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Method: So sánh mật khẩu đã nhập với mật khẩu đã hash trong DB
 * @param {string} enteredPassword - Mật khẩu người dùng nhập vào.
 * @returns {Promise<boolean>} - Trả về true nếu mật khẩu khớp.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Test model với Mongoose
const User = mongoose.model('User', userSchema);

export default User;