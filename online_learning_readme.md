# 🎓 HỆ THỐNG HỌC TRỰC TUYẾN

> Website học trực tuyến với bài giảng, quiz, thảo luận, và video call - Tương tự Google Classroom, Coursera

## 📋 MỤC LỤC

- [Tổng quan](#-tổng-quan)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Các Module chính](#-các-module-chính)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Socket.IO Events](#-socketio-events)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt và Chạy](#-cài-đặt-và-chạy)

---

## 🎯 TỔNG QUAN

Hệ thống học trực tuyến toàn diện với các tính năng:

- ✅ **Bài giảng đa phương tiện** - Video, tài liệu, hình ảnh
- ✅ **Quiz & Kiểm tra** - Tự động chấm điểm
- ✅ **Thảo luận** - Forum theo khóa học
- ✅ **Video Call** - Học trực tiếp với WebRTC
- ✅ **Real-time** - Thông báo, chat với Socket.IO
- ✅ **Analytics** - Thống kê tiến độ học tập
- ✅ **Hoàn toàn MIỄN PHÍ** - Không có tính năng thanh toán

---

## 🛠 CÔNG NGHỆ SỬ DỤNG

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Socket.IO** - Real-time communication
- **WebRTC** - Video call P2P

### Frontend

- **React** - UI library
- **React Router** - Navigation
- **Context API / Redux** - State management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time client

### Third-party Services

- **Cloudinary** - Media storage (images, videos)
- **SendGrid** - Email service
- **JWT** - Authentication

### DevOps

- **MongoDB Atlas** - Database hosting
- **Vercel/Netlify** - Frontend deployment
- **Heroku/Railway** - Backend deployment

---

## 🏗 KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER (React)          │
│  - Single Page Application (SPA)            │
│  - Responsive UI Components                 │
│  - WebRTC Client                            │
│  - Socket.IO Client                         │
└───────────────────┬─────────────────────────┘
                    │ HTTPS/WSS
┌───────────────────┴─────────────────────────┐
│      APPLICATION LAYER (Node.js/Express)    │
│  ┌─────────────────────────────────────┐   │
│  │ REST API Server                     │   │
│  │ - Authentication & Authorization     │   │
│  │ - Business Logic                     │   │
│  │ - Validation & Middleware            │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ WebSocket Server (Socket.IO)        │   │
│  │ - Real-time notifications            │   │
│  │ - Chat & Discussion updates          │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ WebRTC Signaling Server             │   │
│  │ - Peer connection signaling          │   │
│  │ - ICE candidate exchange             │   │
│  └─────────────────────────────────────┘   │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────┴─────────────────────────┐
│           DATA LAYER (MongoDB Atlas)        │
│  - Users, Courses, Lessons                  │
│  - Quizzes, Discussions                     │
│  - Progress Tracking                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          EXTERNAL SERVICES                  │
│  - Cloudinary (Media Storage)               │
│  - SendGrid (Email Service)                 │
└─────────────────────────────────────────────┘
```

---

## 📦 CÁC MODULE CHÍNH

### 1️⃣ **Authentication & Authorization Module** 🔐

**Chức năng:**

- Đăng ký, đăng nhập, đăng xuất
- JWT-based authentication
- Phân quyền: Admin, Teacher, Student
- Reset mật khẩu qua email
- Email verification

**Tech Stack:**

- `bcryptjs` - Hash mật khẩu
- `jsonwebtoken` - JWT tokens
- `SendGrid` - Gửi email xác thực

**Key Features:**

- Access token (15 phút) + Refresh token (7 ngày)
- Secure httpOnly cookies
- Password strength validation
- Account activation via email

---

### 2️⃣ **User Management Module** 👥

**Chức năng:**

- Quản lý profile người dùng
- Upload avatar
- Xem lịch sử học tập
- Danh sách khóa học đã đăng ký
- Admin: Quản lý tất cả users

**Tech Stack:**

- `Multer` - Upload files
- `Cloudinary` - Lưu trữ avatar

**Key Features:**

- CRUD operations cho user profile
- Image optimization và resize
- Role-based access control

---

### 3️⃣ **Course Management Module** 📚

**Chức năng:**

- Tạo, sửa, xóa khóa học (Teacher)
- Quản lý Chapters và Lessons
- Upload thumbnail, tài liệu
- Publish/Unpublish course
- Đăng ký khóa học (Student)
- Đánh giá và review

**Tech Stack:**

- `Multer` - Upload media
- `Cloudinary` - Storage

**Database Structure:**

```
Course → Chapters → Lessons → Media/Resources
```

**Key Features:**

- Hierarchical course structure
- Drag-and-drop reordering
- Rich text editor cho description
- Category và level filtering

---

### 4️⃣ **Lesson Content & Media Module** 🎥

**Chức năng:**

- Upload video bài giảng
- Video streaming
- Upload tài liệu (PDF, PPT, DOCX)
- Progress tracking
- Resume từ vị trí đã xem

**Tech Stack:**

- `Cloudinary Video` - Video hosting & streaming
- `Multer` - File upload
- Adaptive bitrate streaming

**Key Features:**

- Video player controls
- Playback speed adjustment
- Thumbnail generation
- Download resources
- Watch time tracking

---

### 5️⃣ **Quiz & Assessment Module** ✅

**Chức năng:**

- Tạo quiz với nhiều loại câu hỏi
- Multiple choice, True/False, Essay
- Thời gian làm bài
- Tự động chấm điểm
- Xem đáp án sau khi submit
- Thống kê kết quả

**Question Types:**

- Multiple Choice (4 options)
- True/False
- Fill in the Blank
- Essay (manual grading)

**Key Features:**

- Question bank system
- Random question order
- Passing score threshold
- Multiple attempts allowed
- Detailed result analytics

---

### 6️⃣ **Discussion Forum Module** 💬

**Chức năng:**

- Tạo chủ đề thảo luận
- Comment và reply
- Like posts
- Pin important discussions (Teacher)
- Real-time updates với Socket.IO
- Search và filter

**Tech Stack:**

- `Socket.IO` - Real-time updates

**Key Features:**

- Nested comments (threaded)
- Rich text formatting
- Mention users (@username)
- Sort by latest/popular
- Edit/delete own posts

---

### 7️⃣ **Video Call Module (WebRTC)** 📹

**Chức năng:**

- Video call 1-on-1 hoặc group
- Share screen
- In-call chat
- Mute/Unmute audio/video
- Record session (optional)

**Tech Stack:**

- `WebRTC` - Peer-to-peer connection
- `Socket.IO` - Signaling server
- STUN/TURN servers

**Key Features:**

- HD video quality
- Screen sharing
- Grid/Speaker view
- Hand raise feature
- Session recordings

**WebRTC Flow:**

```
Client A                Signaling Server              Client B
   |                           |                          |
   |-------- Offer -------->   |                          |
   |                           |-------- Offer --------> |
   |                           |<------- Answer --------- |
   |<------- Answer --------|  |                          |
   |                           |                          |
   |<=========== P2P Connection (Video/Audio) ===========>|
```

---

### 8️⃣ **Notification Module** 🔔

**Chức năng:**

- Real-time notifications
- Email notifications (SendGrid)
- Đánh dấu đã đọc
- Filter theo loại
- Notification center

**Notification Types:**

- New course enrollment
- New quiz assigned
- Discussion replies
- Live session scheduled
- Grade received

**Tech Stack:**

- `Socket.IO` - Push notifications
- `SendGrid` - Email notifications

**Key Features:**

- Unread counter badge
- Mark all as read
- Notification preferences
- Email digest (daily/weekly)

---

### 9️⃣ **Analytics & Reporting Module** 📊

**Chức năng:**

- Dashboard cho Teacher/Admin
- Thống kê số liệu khóa học
- Tiến độ học sinh
- Quiz performance
- Engagement metrics
- Export reports (CSV)

**Teacher Analytics:**

- Total students enrolled
- Course completion rate
- Average quiz scores
- Popular lessons
- Discussion activity

**Student Analytics:**

- Courses in progress
- Completed lessons
- Quiz scores history
- Time spent learning
- Certificates earned

**Key Features:**

- Interactive charts (Recharts/Chart.js)
- Date range filters
- Export to CSV
- Compare multiple courses

---

## 🗄 DATABASE SCHEMA

### **User Schema**

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  fullName: String (required),
  role: String (enum: ['admin', 'teacher', 'student'], default: 'student'),
  avatar: String (Cloudinary URL),
  isVerified: Boolean (default: false),
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **UserProfile Schema**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique),
  phone: String,
  address: String,
  dateOfBirth: Date,
  bio: String,
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String
  },
  enrolledCourses: [ObjectId] (ref: 'Course'),
  teachingCourses: [ObjectId] (ref: 'Course'),
  createdAt: Date,
  updatedAt: Date
}
```

### **Course Schema**

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  thumbnail: String (Cloudinary URL),
  teacherId: ObjectId (ref: 'User', required),
  category: String (enum: ['Programming', 'Design', 'Business', 'Language', 'Other']),
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  isPublished: Boolean (default: false),
  enrolledStudents: [ObjectId] (ref: 'User'),
  rating: Number (default: 0),
  totalReviews: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### **Chapter Schema**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Course', required),
  title: String (required),
  order: Number (required),
  createdAt: Date,
  updatedAt: Date
}
```

### **Lesson Schema**

```javascript
{
  _id: ObjectId,
  chapterId: ObjectId (ref: 'Chapter', required),
  title: String (required),
  content: String (rich text),
  videoUrl: String (Cloudinary video URL),
  videoDuration: Number (seconds),
  resources: [{
    name: String,
    url: String (Cloudinary URL),
    type: String (enum: ['pdf', 'ppt', 'doc', 'image'])
  }],
  order: Number (required),
  isPreview: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### **Progress Schema**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  lessonId: ObjectId (ref: 'Lesson', required),
  courseId: ObjectId (ref: 'Course', required),
  watchedDuration: Number (seconds, default: 0),
  isCompleted: Boolean (default: false),
  lastWatchedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
// Compound unique index: userId + lessonId
```

### **Quiz Schema**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Course', required),
  lessonId: ObjectId (ref: 'Lesson'),
  title: String (required),
  description: String,
  duration: Number (minutes, required),
  passingScore: Number (percentage, default: 70),
  attemptsAllowed: Number (default: 3),
  isPublished: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### **Question Schema**

```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: 'Quiz', required),
  type: String (enum: ['multiple_choice', 'true_false', 'essay', 'fill_blank']),
  question: String (required),
  options: [{
    text: String,
    isCorrect: Boolean
  }], // For multiple_choice
  correctAnswer: String, // For true_false, fill_blank
  points: Number (default: 1),
  explanation: String,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### **QuizAttempt Schema**

```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: 'Quiz', required),
  userId: ObjectId (ref: 'User', required),
  answers: [{
    questionId: ObjectId (ref: 'Question'),
    answer: String,
    isCorrect: Boolean,
    pointsEarned: Number
  }],
  score: Number,
  totalPoints: Number,
  percentage: Number,
  isPassed: Boolean,
  attemptNumber: Number,
  startedAt: Date,
  submittedAt: Date
}
```

### **Discussion Schema**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Course', required),
  userId: ObjectId (ref: 'User', required),
  title: String (required),
  content: String (required),
  isPinned: Boolean (default: false),
  likes: [ObjectId] (ref: 'User'),
  views: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### **Comment Schema**

```javascript
{
  _id: ObjectId,
  discussionId: ObjectId (ref: 'Discussion', required),
  userId: ObjectId (ref: 'User', required),
  content: String (required),
  parentId: ObjectId (ref: 'Comment'), // null for top-level
  likes: [ObjectId] (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

### **LiveSession Schema**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Course', required),
  hostId: ObjectId (ref: 'User', required),
  title: String (required),
  description: String,
  scheduledAt: Date (required),
  startedAt: Date,
  endedAt: Date,
  duration: Number (minutes),
  participants: [{
    userId: ObjectId (ref: 'User'),
    joinedAt: Date,
    leftAt: Date,
    duration: Number (minutes)
  }],
  recordingUrl: String (Cloudinary URL),
  status: String (enum: ['scheduled', 'live', 'ended'], default: 'scheduled'),
  createdAt: Date,
  updatedAt: Date
}
```

### **Notification Schema**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required),
  type: String (enum: ['course', 'quiz', 'discussion', 'session', 'grade', 'system']),
  title: String (required),
  content: String (required),
  link: String,
  isRead: Boolean (default: false),
  createdAt: Date
}
```

### **Analytics Schema**

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'Course', required),
  date: Date (required),
  totalStudents: Number,
  activeStudents: Number (logged in last 7 days),
  completionRate: Number (percentage),
  averageScore: Number,
  totalLessonsCompleted: Number,
  totalQuizzesTaken: Number,
  averageTimeSpent: Number (minutes),
  discussionPosts: Number,
  createdAt: Date
}
```

---

## 🔌 API ENDPOINTS

### **Authentication Routes** (`/api/auth`)

```
POST   /register              - Đăng ký tài khoản mới
POST   /login                 - Đăng nhập
POST   /logout                - Đăng xuất
POST   /refresh-token         - Refresh access token
POST   /verify-email/:token   - Xác thực email
POST   /forgot-password       - Gửi link reset password
PUT    /reset-password/:token - Reset password
```

### **User Routes** (`/api/users`)

```
GET    /profile               - Lấy profile của user hiện tại
GET    /profile/:id           - Lấy profile user khác (public)
PUT    /profile               - Cập nhật profile
POST   /avatar                - Upload avatar
GET    /enrolled-courses      - Danh sách khóa học đã đăng ký
GET    /list                  - Danh sách tất cả users (Admin)
DELETE /:id                   - Xóa user (Admin)
```

### **Course Routes** (`/api/courses`)

```
POST   /                      - Tạo khóa học mới (Teacher)
GET    /                      - Lấy danh sách khóa học (public)
GET    /my-courses            - Khóa học của tôi (Teacher)
GET    /:id                   - Chi tiết khóa học
PUT    /:id                   - Cập nhật khóa học (Teacher)
DELETE /:id                   - Xóa khóa học (Teacher)
POST   /:id/enroll            - Đăng ký khóa học (Student)
DELETE /:id/unenroll          - Hủy đăng ký (Student)
GET    /:id/students          - Danh sách học sinh (Teacher)
POST   /:id/review            - Đánh giá khóa học (Student)
```

### **Chapter Routes** (`/api/chapters`)

```
POST   /                      - Tạo chapter (Teacher)
GET    /course/:courseId      - Lấy tất cả chapters của course
PUT    /:id                   - Cập nhật chapter (Teacher)
DELETE /:id                   - Xóa chapter (Teacher)
PUT    /reorder               - Sắp xếp lại thứ tự (Teacher)
```

### **Lesson Routes** (`/api/lessons`)

```
POST   /                      - Tạo lesson (Teacher)
GET    /chapter/:chapterId    - Lấy tất cả lessons của chapter
GET    /:id                   - Chi tiết lesson
PUT    /:id                   - Cập nhật lesson (Teacher)
DELETE /:id                   - Xóa lesson (Teacher)
POST   /:id/video             - Upload video (Teacher)
POST   /:id/resource          - Upload tài liệu (Teacher)
DELETE /:id/resource/:resId   - Xóa tài liệu (Teacher)
```

### **Progress Routes** (`/api/progress`)

```
GET    /course/:courseId      - Tiến độ của user trong course
GET    /lesson/:lessonId      - Tiến độ của user trong lesson
PUT    /lesson/:lessonId      - Cập nhật tiến độ
POST   /complete/:lessonId    - Đánh dấu hoàn thành lesson
```

### **Quiz Routes** (`/api/quizzes`)

```
POST   /                      - Tạo quiz (Teacher)
GET    /course/:courseId      - Lấy tất cả quizzes của course
GET    /:id                   - Chi tiết quiz
PUT    /:id                   - Cập nhật quiz (Teacher)
DELETE /:id                   - Xóa quiz (Teacher)
POST   /:id/start             - Bắt đầu làm quiz (Student)
POST   /:id/submit            - Nộp bài (Student)
GET    /:id/attempts          - Lịch sử làm bài (Student)
GET    /:id/results/:attemptId - Xem kết quả chi tiết
```

### **Question Routes** (`/api/questions`)

```
POST   /quiz/:quizId          - Thêm câu hỏi vào quiz (Teacher)
GET    /quiz/:quizId          - Lấy tất cả câu hỏi
PUT    /:id                   - Cập nhật câu hỏi (Teacher)
DELETE /:id                   - Xóa câu hỏi (Teacher)
```

### **Discussion Routes** (`/api/discussions`)

```
POST   /                      - Tạo discussion (Student/Teacher)
GET    /course/:courseId      - Lấy discussions của course
GET    /:id                   - Chi tiết discussion
PUT    /:id                   - Sửa discussion (Owner)
DELETE /:id                   - Xóa discussion (Owner/Teacher)
PUT    /:id/like              - Like/Unlike discussion
PUT    /:id/pin               - Pin discussion (Teacher)
POST   /:id/comment           - Comment vào discussion
```

### **Comment Routes** (`/api/comments`)

```
GET    /discussion/:discussionId - Lấy tất cả comments
PUT    /:id                   - Sửa comment (Owner)
DELETE /:id                   - Xóa comment (Owner/Teacher)
PUT    /:id/like              - Like/Unlike comment
```

### **Live Session Routes** (`/api/sessions`)

```
POST   /                      - Tạo session (Teacher)
GET    /course/:courseId      - Lấy sessions của course
GET    /:id                   - Chi tiết session
PUT    /:id                   - Cập nhật session (Teacher)
DELETE /:id                   - Xóa session (Teacher)
PUT    /:id/start             - Bắt đầu session (Teacher)
PUT    /:id/end               - Kết thúc session (Teacher)
POST   /:id/join              - Tham gia session (Student)
```

### **Notification Routes** (`/api/notifications`)

```
GET    /                      - Lấy notifications của user
GET    /unread-count          - Số notification chưa đọc
PUT    /:id/read              - Đánh dấu đã đọc
PUT    /read-all              - Đánh dấu tất cả đã đọc
DELETE /:id                   - Xóa notification
```

### **Analytics Routes** (`/api/analytics`)

```
GET    /course/:courseId      - Analytics của course (Teacher)
GET    /student/:userId       - Analytics của student
GET    /dashboard             - Dashboard overview (Teacher/Admin)
GET    /export                - Export dữ liệu (CSV)
```

---

## 🔌 SOCKET.IO EVENTS

### **Namespace: `/discussion`**

```javascript
// Client → Server
"discussion:join"; // Join room theo courseId
"discussion:leave"; // Leave room
"discussion:new"; // Tạo discussion mới
"comment:new"; // Comment mới
"discussion:like"; // Like discussion
"comment:like"; // Like comment

// Server → Client
"discussion:created"; // Discussion được tạo
"comment:created"; // Comment được tạo
"discussion:liked"; // Discussion được like
"discussion:updated"; // Discussion được cập nhật
```

### **Namespace: `/session`** (Video Call)

```javascript
// Client → Server
"session:join"; // Tham gia session
"session:leave"; // Rời session
"webrtc:offer"; // Gửi WebRTC offer
"webrtc:answer"; // Gửi WebRTC answer
"webrtc:ice-candidate"; // Gửi ICE candidate
"session:chat"; // Gửi chat message
"session:screen-share"; // Bật/tắt share screen
"session:toggle-video"; // Bật/tắt video
"session:toggle-audio"; // Bật/tắt audio
"session:raise-hand"; // Giơ tay

// Server → Client
"session:user-joined"; // User mới join
"session:user-left"; // User rời phòng
"webrtc:offer"; // Forward offer
"webrtc:answer"; // Forward answer
"webrtc:ice-candidate"; // Forward ICE candidate
"session:chat-message"; // Chat message mới
"session:user-screen-share"; // User share screen
"session:user-hand-raised"; // User giơ tay
```

### **Namespace: `/notification`**

```javascript
// Server → Client
"notification:new"; // Notification mới
"notification:count"; // Update unread count
```

### **Namespace: `/progress`**

```javascript
// Client → Server
"progress:update"; // Cập nhật tiến độ xem video

// Server → Client
"progress:updated"; // Tiến độ đã được cập nhật
```

---

## 📁 CẤU TRÚC THƯ MỤC

### **Backend Structure**

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js           # MongoDB connection
│   │   ├── cloudinary.js         # Cloudinary config
│   │   ├── sendgrid.js           # SendGrid config
│   │   └── jwt.js                # JWT config
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── userProfile.model.js
│   │   ├── course.model.js
│   │   ├── chapter.model.js
│   │   ├── lesson.model.js
│   │   ├── progress.model.js
│   │   ├── quiz.model.js
│   │   ├── question.model.js
│   │   ├── quizAttempt.model.js
│   │   ├── discussion.model.js
│   │   ├── comment.model.js
│   │   ├── liveSession.model.js
│   │   ├── notification.model.js
│   │   └── analytics.model.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── course.controller.js
│   │   ├── chapter.controller.js
│   │   ├── lesson.controller.js
│   │   ├── progress.controller.js
│   │   ├── quiz.controller.js
│   │   ├── discussion.controller.js
│   │   ├── session.controller.js
│   │   ├── notification.controller.js
│   │   └── analytics.controller.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── course.routes.js
│   │   ├── chapter.routes.js
│   │   ├── lesson.routes.js
│   │   ├── progress.routes.js
│   │   ├── quiz.routes.js
│   │   ├── discussion.routes.js
│   │   ├── session.routes.js
│   │   ├── notification.routes.js
│   │   └── analytics.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   ├── authorize.js          # Role-based access
│   │   ├── upload.js             # Multer config
│   │   ├── validation.js         # Input validation
│   │   ├── error.handler.js       # Error handling
│   │   └── rateLimiter.js        # Rate limiting
│   │
│   ├── services/
│   │   ├── email.service.js       # SendGrid email
│   │   ├── upload.service.js      # Cloudinary upload
│   │   └── notification.service.js # Notification logic
│   │
│   ├── socket/
│   │   ├── discussion.handler.js  # Discussion events
│   │   ├── session.handler.js     # Video call events
│   │   ├── notification.handler.js # Notification events
│   │   └── progress.handler.js    # Progress events
│   │
│   ├── utils/
│   │   ├── validators.js         # Validation helpers
│   │   ├── helpers.js            # Helper functions
│   │   └── constants.js          # Constants
│   │
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
│
├── .env.example                 # Environment template
├── .env                         # Environment variables
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

### **Frontend Structure**

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Loading.jsx
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── PasswordReset.jsx
│   │   │
│   │   ├── course/
│   │   │   ├── CourseCard.jsx
│   │   │   ├── CourseList.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── CourseForm.jsx
│   │   │   └── CourseProgress.jsx
│   │   │
│   │   ├── lesson/
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── LessonContent.jsx
│   │   │   ├── ResourceList.jsx
│   │   │   └── LessonForm.jsx
│   │   │
│   │   ├── quiz/
│   │   │   ├── QuizList.jsx
│   │   │   ├── QuizDetail.jsx
│   │   │   ├── QuizQuestion.jsx
│   │   │   ├── QuizResult.jsx
│   │   │   └── QuestionForm.jsx
│   │   │
│   │   ├── discussion/
│   │   │   ├── DiscussionList.jsx
│   │   │   ├── DiscussionThread.jsx
│   │   │   ├── DiscussionForm.jsx
│   │   │   └── CommentSection.jsx
│   │   │
│   │   ├── video-call/
│   │   │   ├── VideoRoom.jsx
│   │   │   ├── VideoGrid.jsx
│   │   │   ├── VideoControls.jsx
│   │   │   ├── ChatBox.jsx
│   │   │   └── ParticipantsList.jsx
│   │   │
│   │   └── dashboard/
│   │       ├── DashboardOverview.jsx
│   │       ├── StatisticsChart.jsx
│   │       ├── CourseAnalytics.jsx
│   │       └── StudentPerformance.jsx
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Courses.jsx
│   │   ├── CourseDetail.jsx
│   │   ├── LessonPlayer.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── MyCourses.jsx
│   │   └── TeacherCourses.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js           # Auth context hook
│   │   ├── useSocket.js         # Socket.IO hook
│   │   ├── useWebRTC.js         # WebRTC hook
│   │   └── useApi.js            # API call hook
│   │
│   ├── services/
│   │   ├── api.js               # Axios instance
│   │   ├── authService.js       # Auth API calls
│   │   ├── courseService.js     # Course API calls
│   │   ├── quizService.js       # Quiz API calls
│   │   ├── socketService.js     # Socket.IO setup
│   │   └── webrtcService.js     # WebRTC setup
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Auth state
│   │   ├── CourseContext.jsx    # Course state
│   │   └── NotificationContext.jsx # Notification state
│   │
│   ├── utils/
│   │   ├── validators.js        # Form validators
│   │   ├── formatters.js        # Format data
│   │   ├── constants.js         # Constants
│   │   └── helpers.js           # Helper functions
│   │
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   └── components.css
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.jsx
│   └── index.css
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── .env.example
├── .env
├── .gitignore
├── package.json
├── vite.config.js             # Or webpack.config.js
└── README.md
```
