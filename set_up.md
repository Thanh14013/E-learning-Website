## 🚀 CÀI ĐẶT VÀ CHẠY

### **Yêu cầu hệ thống**

- Node.js >= 16.x
- npm >= 8.x hoặc yarn >= 3.x
- Git

### **Step 1: Clone Repository**

```bash
git clone <your-repo-url>
cd online-learning-platform
```

### **Step 2: Backend Setup**

#### 2.1 Cài đặt dependencies

```bash
cd backend
npm install
```

#### 2.2 Cấu hình environment

```bash
cp .env.example .env
```

**File `.env`:**

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
MONGODB_NAME=online_learning

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# WebRTC (Optional)
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_SERVER=your_turn_server_url
TURN_USERNAME=username
TURN_PASSWORD=password
```

#### 2.3 Cài đặt MongoDB Atlas

1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo tài khoản và cluster mới
3. Lấy connection string
4. Thêm vào `.env` file

#### 2.4 Cài đặt Cloudinary

1. Truy cập [Cloudinary](https://cloudinary.com/)
2. Đăng ký tài khoản miễn phí
3. Lấy API credentials
4. Thêm vào `.env` file

> ✅ Google SSO: thêm `GOOGLE_CLIENT_ID` (backend) và `VITE_GOOGLE_CLIENT_ID` (frontend) bằng Client ID từ Google Cloud Console (OAuth 2.0 Web client).

#### 2.5 Cài đặt SendGrid

1. Truy cập [SendGrid](https://sendgrid.com/)
2. Đăng ký tài khoản
3. Tạo API key
4. Xác thực domain
5. Thêm vào `.env` file

#### 2.6 Chạy backend

```bash
npm run dev
```

Backend sẽ chạy tại `http://localhost:5000`

### **Step 3: Frontend Setup**

#### 3.1 Cài đặt dependencies

```bash
cd frontend
npm install
```

#### 3.2 Cấu hình environment

```bash
cp .env.example .env
```

**File `.env`:**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

#### 3.3 Chạy frontend

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

### **Step 4: Xử lý CORS**

Thêm vào `backend/src/app.js`:

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

---

## 📚 MODULE HỖ TRỢ

### **1️⃣ File Upload Service (Multer + Cloudinary)**

**File: `backend/src/services/uploadService.js`**

```javascript
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Lưu trữ cho avatar
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "learning-platform/avatars",
    allowed_formats: ["jpg", "jpeg", "png"],
    max_file_size: 5242880, // 5MB
  },
});

// Lưu trữ cho video
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "learning-platform/videos",
    allowed_formats: ["mp4", "avi", "mov"],
    resource_type: "video",
    max_file_size: 104857600, // 100MB
  },
});

// Lưu trữ cho tài liệu
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "learning-platform/documents",
    allowed_formats: ["pdf", "doc", "docx", "ppt", "pptx"],
    resource_type: "raw",
  },
});

// Lưu trữ cho hình ảnh (thumbnail, etc)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "learning-platform/images",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5242880 },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 104857600 },
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 52428800 },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10485760 },
});

module.exports = {
  uploadAvatar: uploadAvatar.single("avatar"),
  uploadVideo: uploadVideo.single("video"),
  uploadDocument: uploadDocument.single("document"),
  uploadImage: uploadImage.single("image"),
  cloudinary,
};
```

**File: `backend/src/middleware/upload.js`**

```javascript
const {
  uploadAvatar,
  uploadVideo,
  uploadDocument,
  uploadImage,
} = require("../services/uploadService");
const { AppError, catchAsync } = require("../utils/errorHandler");

const handleUpload = (uploadMiddleware, fileType) => {
  return catchAsync(async (req, res, next) => {
    try {
      uploadMiddleware(req, res, (err) => {
        if (err) {
          throw new AppError(err.message, 400);
        }

        if (!req.file) {
          throw new AppError(`No ${fileType} provided`, 400);
        }

        req.uploadedFile = {
          url: req.file.path,
          filename: req.file.filename,
          size: req.file.size,
          type: fileType,
        };

        next();
      });
    } catch (error) {
      next(error);
    }
  });
};

module.exports = {
  uploadAvatarMiddleware: handleUpload(uploadAvatar, "avatar"),
  uploadVideoMiddleware: handleUpload(uploadVideo, "video"),
  uploadDocumentMiddleware: handleUpload(uploadDocument, "document"),
  uploadImageMiddleware: handleUpload(uploadImage, "image"),
};
```

---

### **2️⃣ Email Service (SendGrid)**

**File: `backend/src/services/emailService.js`**

```javascript
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  static async sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Xác thực tài khoản của bạn",
      html: `
        <h2>Xác thực tài khoản</h2>
        <p>Vui lòng nhấp vào liên kết bên dưới để xác thực tài khoản của bạn:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Xác thực tài khoản
        </a>
        <p>Hoặc sao chép liên kết này: ${verificationUrl}</p>
        <p>Liên kết sẽ hết hạn sau 24 giờ.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  static async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Đặt lại mật khẩu của bạn",
      html: `
        <h2>Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào liên kết bên dưới:</p>
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Đặt lại mật khẩu
        </a>
        <p>Liên kết sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send reset email");
    }
  }

  static async sendNewCourseNotification(email, courseName, teacherName) {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Khóa học mới: ${courseName}`,
      html: `
        <h2>Khóa học mới từ ${teacherName}</h2>
        <p>Bạn có thể đã quan tâm đến khóa học mới: <strong>${courseName}</strong></p>
        <p>Truy cập nền tảng để tìm hiểu thêm.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  static async sendQuizReminderEmail(email, courseName, quizName, deadline) {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Nhắc nhở: ${quizName} sắp hết hạn`,
      html: `
        <h2>Nhắc nhở bài quiz</h2>
        <p>Bạn có một bài quiz chưa làm trong khóa học <strong>${courseName}</strong></p>
        <p><strong>Tên bài quiz:</strong> ${quizName}</p>
        <p><strong>Deadline:</strong> ${deadline}</p>
        <p>Vui lòng hoàn thành bài quiz trước deadline.</p>
      `,
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  static async sendCourseCompletionEmail(email, courseName) {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Chúc mừng! Bạn đã hoàn thành ${courseName}`,
      html: `
        <h2>Chúc mừng bạn!</h2>
        <p>Bạn đã hoàn thành khóa học: <strong>${courseName}</strong></p>
        <p>Bây giờ bạn có thể xem chứng chỉ hoàn thành của mình.</p>
        <p>Cảm ơn bạn đã sử dụng nền tảng học tập của chúng tôi!</p>
      `,
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
}

module.exports = EmailService;
```

---

## 🔐 DATABASE INDEXES

```javascript
// User indexes
User.index({ email: 1 }, { unique: true });
User.index({ verificationToken: 1 });
User.index({ resetPasswordToken: 1 });

// Course indexes
Course.index({ teacherId: 1 });
Course.index({ category: 1, level: 1 });
Course.index({ title: "text", description: "text" });
Course.index({ enrolledStudents: 1 });

// Progress indexes
Progress.index({ userId: 1, courseId: 1 });
Progress.index({ userId: 1, lessonId: 1 }, { unique: true });
Progress.index({ isCompleted: 1, userId: 1 });

// Discussion indexes
Discussion.index({ courseId: 1, createdAt: -1 });
Discussion.index({ userId: 1 });
Discussion.index({ isPinned: 1, createdAt: -1 });

// Comment indexes
Comment.index({ discussionId: 1, createdAt: -1 });
Comment.index({ userId: 1 });

// Notification indexes
Notification.index({ userId: 1, isRead: 1, createdAt: -1 });
Notification.index({ userId: 1, createdAt: -1 });

// QuizAttempt indexes
QuizAttempt.index({ quizId: 1, userId: 1 });
QuizAttempt.index({ userId: 1, submittedAt: -1 });

// LiveSession indexes
LiveSession.index({ courseId: 1, scheduledAt: -1 });
LiveSession.index({ hostId: 1 });
LiveSession.index({ status: 1, startedAt: -1 });
```

---

## 🚀 DEPLOYMENT

### **Backend Deployment (Railway/Heroku)**

#### Railway

1. Push code to GitHub
2. Connect repo to Railway
3. Add environment variables
4. Deploy

#### Heroku

```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set KEY=VALUE
heroku logs --tail
```

### **Frontend Deployment (Vercel/Netlify)**

#### Vercel

```bash
npm install -g vercel
vercel
```

#### Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`

---

## 📝 HƯỚNG DẪN GÓP PHẦN

1. Fork repository
2. Tạo branch mới: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Tạo Pull Request

---

## 📄 LICENSE

MIT License - xem file LICENSE để chi tiết

---

## 👥 LIÊN HỆ & HỖ TRỢ

- Email: support@learningplatform.com
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

## 🎉 TÓSUM

Đây là một hệ thống học trực tuyến **hoàn chỉnh, scalable, và production-ready** với:

✅ **9 module chính** đầy đủ  
✅ **2 module hỗ trợ** (Upload & Email)  
✅ **Real-time features** (WebRTC, Socket.IO)  
✅ **Secure authentication** (JWT)  
✅ **Media management** (Cloudinary)  
✅ **Email service** (SendGrid)  
✅ **Database** (MongoDB Atlas)  
✅ **Hoàn toàn MIỄN PHÍ** 💯
