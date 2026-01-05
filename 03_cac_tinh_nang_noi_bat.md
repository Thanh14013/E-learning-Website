# 3. Các tính năng nổi bật

## 3.1 Hệ thống xác thực và phân quyền

### 3.1.1 JWT Authentication

Hệ thống sử dụng **JSON Web Token (JWT)** cho authentication với cơ chế **dual-token** (Access Token + Refresh Token) để cân bằng giữa bảo mật và user experience.

#### A. Token Structure

**Access Token** (Short-lived: 3 hours):

```javascript
{
  "id": "user_id",
  "role": "student|teacher|admin",
  "email": "user@example.com",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234578890,
  "iss": "e-learning-platform",
  "aud": "e-learning-users"
}
```

**Refresh Token** (Long-lived: 7 days):

```javascript
{
  "id": "user_id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234972890,
  "iss": "e-learning-platform",
  "aud": "e-learning-users"
}
```

#### B. Authentication Flow

**[ẢNH: Sequence diagram cho Login flow: User → Client → Server → Database → JWT generation → Response với tokens]**

**Implementation Code:**

```javascript
// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET,
  ACCESS_TOKEN_EXPIRY: "3h",
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET,
  REFRESH_TOKEN_EXPIRY: "7d",
  ISSUER: "e-learning-platform",
  AUDIENCE: "e-learning-users",
};

// Generate Access Token
export const generateAccessToken = (payload) => {
  const options = {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  };

  return jwt.sign(
    {
      id: payload.id,
      role: payload.role || "student",
      email: payload.email,
      type: "access",
    },
    JWT_CONFIG.ACCESS_TOKEN_SECRET,
    options
  );
};

// Verify Access Token
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    });
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
```

#### C. Token Storage và Security

**Client-side:**

- Access Token: `localStorage` cho dễ access
- Refresh Token: HTTP-only cookie (bảo mật hơn)

**Security measures:**

- Tokens được sign với secret keys mạnh
- HTTPS-only trong production
- Automatic token refresh trước khi expire
- Refresh token rotation khi refresh

**[ẢNH: Diagram minh họa Token refresh flow khi Access Token expired]**

### 3.1.2 Role-Based Access Control (RBAC)

#### A. Authorization Middleware

```javascript
// Authentication Middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Fetch user from database
    const user = await User.findById(decoded.id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned.",
      });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};
```

#### B. Role Authorization

```javascript
// Authorization Middleware Factory
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of the following roles: ${allowedRoles.join(
          ", "
        )}`,
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

// Convenience middleware
export const isAdmin = authorize("admin");
export const isTeacher = authorize("teacher");
export const isStudent = authorize("student");
export const isTeacherOrAdmin = authorize("teacher", "admin");
```

#### C. Route Protection Examples

```javascript
// Teacher-only routes
router.post("/courses", authenticate, isTeacherOrAdmin, createCourse);
router.put("/courses/:id", authenticate, isTeacherOrAdmin, updateCourse);

// Student routes
router.post("/courses/:id/enroll", authenticate, isStudent, enrollCourse);

// Admin routes
router.put("/users/:id/role", authenticate, isAdmin, updateUserRole);
router.put("/courses/:id/approve", authenticate, isAdmin, approveCourse);
```

**[ẢNH: Flowchart cho Authorization process: Request → Authenticate → Check Role → Allow/Deny]**

### 3.1.3 OAuth 2.0 với Google

#### A. Google OAuth Integration

Hệ thống tích hợp **Google OAuth 2.0** cho phép users đăng nhập bằng tài khoản Google.

**Implementation:**

```javascript
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify Google token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, email_verified } = payload;

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned.",
      });
    }

    if (!user) {
      // Create new user (default role: student)
      user = await User.create({
        fullName: name || email.split("@")[0],
        email: email.toLowerCase(),
        password: crypto.randomBytes(32).toString("hex"), // Random password
        role: "student",
        avatar: picture || "",
        isVerified: email_verified,
      });

      // Create user profile
      await UserProfile.create({ userId: user._id });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      id: user._id,
      role: user.role,
      email: user.email,
    });

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: "Google authentication successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      message: "Google authentication failed",
    });
  }
};
```

**[ẢNH: Sequence diagram cho Google OAuth flow: User clicks Google button → Google OAuth → Server verifies → Create/Find user → Generate JWT → Response]**

## 3.2 Quản lý khóa học đa tầng

### 3.2.1 Quản lý Course, Chapter, Lesson

Hệ thống tổ chức nội dung khóa học theo cấu trúc **hierarchical** với 3 levels:

```
Course (Khóa học)
  ├── Chapter 1 (Chương 1)
  │     ├── Lesson 1.1 (Bài học 1.1)
  │     ├── Lesson 1.2 (Bài học 1.2)
  │     └── Quiz 1 (Bài kiểm tra)
  ├── Chapter 2 (Chương 2)
  │     ├── Lesson 2.1
  │     └── Lesson 2.2
  └── ...
```

**[ẢNH: Tree diagram minh họa Course structure với expandable nodes]**

#### A. Course Management Features

**Course Model:**

```javascript
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
    },
    description: {
      type: String,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    thumbnail: String, // Cloudinary URL
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "Programming",
        "Frontend",
        "Backend",
        "Full Stack",
        "DevOps",
        "Data Science",
        "Machine Learning",
        "Cloud Computing",
        "Cybersecurity",
        "Mobile Development",
      ],
      default: "Other",
      index: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);
```

**Course Operations:**

1. **Create Course**: Teacher tạo khóa học mới
2. **Upload Thumbnail**: Upload ảnh đại diện lên Cloudinary
3. **Update Course**: Cập nhật thông tin khóa học
4. **Publish/Unpublish**: Chuyển trạng thái công khai
5. **Delete Course**: Xóa khóa học (với cascade delete chapters, lessons)

**[ẢNH: Screenshot của Course Creation Form với tất cả các fields]**

#### B. Chapter Management

**Chapter Model:**

```javascript
const chapterSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Chapter title is required"],
      trim: true,
    },
    description: String,
    order: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);
```

**Features:**

- Drag-and-drop reordering
- Collapsible chapter sections
- Lesson count display
- Add/Edit/Delete operations

**[ẢNH: Screenshot của Chapter Management interface với drag handles]**

#### C. Lesson Management

**Lesson Model:**

```javascript
const lessonSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
    },
    content: String, // HTML rich text
    videoUrl: String, // Cloudinary video URL
    videoDuration: {
      type: Number, // seconds
      min: 0,
    },
    resources: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: {
          type: String,
          enum: ["pdf", "ppt", "doc", "image", "link", "video"],
          required: true,
        },
      },
    ],
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
```

**Lesson Content Types:**

1. **Video Lessons**: Upload video lên Cloudinary, tự động extract duration
2. **Text Content**: Rich text editor với HTML formatting
3. **Resources**: Đính kèm files (PDF, PPT, DOC) và external links

**[ẢNH: Screenshot của Lesson Editor với rich text editor và video upload section]**

#### D. Video Upload với Cloudinary

```javascript
// Multer + Cloudinary configuration
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Video storage
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "e-learning/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi"],
    transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// Upload endpoint
router.post(
  "/lessons/:id/upload-video",
  authenticate,
  isTeacherOrAdmin,
  uploadVideo.single("video"),
  async (req, res) => {
    const lesson = await Lesson.findById(req.params.id);
    lesson.videoUrl = req.file.path;
    lesson.videoDuration = req.file.duration;
    await lesson.save();

    res.json({
      success: true,
      videoUrl: req.file.path,
    });
  }
);
```

**[ẢNH: Screenshot của video upload progress bar và video player preview]**

### 3.2.2 Hệ thống Quiz và đánh giá

#### A. Quiz Structure

**Quiz Model:**

```javascript
const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
    },
    duration: {
      type: Number, // minutes
      default: 0,
    },
    passingScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    attemptsAllowed: {
      type: Number,
      default: 1,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
```

**Question Model:**

```javascript
const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ["multiple-choice", "true-false"],
      required: true,
    },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    explanation: String,
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
```

**[ẢNH: Screenshot của Quiz Builder interface với question list và add/edit forms]**

#### B. Quiz Taking Flow

**Student Quiz Interface:**

1. **Quiz Start Screen**: Hiển thị instructions, duration, attempts remaining
2. **Question Navigation**: Progress bar, question numbers, flag for review
3. **Answer Selection**: Radio buttons (single choice), checkboxes (multiple choice)
4. **Timer**: Countdown timer, auto-submit khi hết giờ
5. **Submit Confirmation**: Double confirm trước khi submit

**[ẢNH: Screenshot của Quiz Taking interface với timer, question, và navigation]**

**Quiz Attempt Model:**

```javascript
const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOptions: [Number], // Index của options được chọn
        isCorrect: Boolean,
        pointsEarned: Number,
      },
    ],
    totalScore: Number,
    percentage: Number,
    passed: Boolean,
    timeSpent: Number, // seconds
    startedAt: Date,
    submittedAt: Date,
  },
  { timestamps: true }
);
```

#### C. Quiz Grading

**Auto-grading Logic:**

```javascript
export const gradeQuizAttempt = async (quizId, userId, answers) => {
  const quiz = await Quiz.findById(quizId);
  const questions = await Question.find({ quizId }).sort("order");

  let totalPoints = 0;
  let earnedPoints = 0;

  const gradedAnswers = answers.map((answer) => {
    const question = questions.find(
      (q) => q._id.toString() === answer.questionId
    );
    totalPoints += question.points;

    // Check if answer is correct
    const correctOptions = question.options
      .map((opt, idx) => (opt.isCorrect ? idx : -1))
      .filter((idx) => idx !== -1);

    const isCorrect = arraysEqual(
      answer.selectedOptions.sort(),
      correctOptions.sort()
    );

    if (isCorrect) {
      earnedPoints += question.points;
    }

    return {
      questionId: answer.questionId,
      selectedOptions: answer.selectedOptions,
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
    };
  });

  const percentage = (earnedPoints / totalPoints) * 100;
  const passed = percentage >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    quizId,
    userId,
    answers: gradedAnswers,
    totalScore: earnedPoints,
    percentage,
    passed,
    submittedAt: new Date(),
  });

  return attempt;
};
```

**[ẢNH: Screenshot của Quiz Results page với score, passed/failed status, và detailed answers review]**

## 3.3 Tính năng tương tác real-time

### 3.3.1 Discussion Forums

#### A. Discussion Features

**Nested Comment System:**

- Discussions (top-level threads)
- Comments (replies to discussions)
- Nested replies (replies to comments)
- Unlimited nesting depth

**[ẢNH: Screenshot của Discussion Forum với nested comments hiển thị dạng tree]**

**Social Features:**

- Like/Unlike discussions và comments
- View count tracking
- Pin important discussions (teacher only)
- Sort by: Latest, Most liked, Most viewed

**[ẢNH: Screenshot của Discussion Forum với filter và sort options]**

### 3.3.4 Video Conferencing với WebRTC

#### A. Live Session Features

Hệ thống hỗ trợ **live video conferencing** giữa teacher và multiple students sử dụng WebRTC technology.

**Key Features:**

- Real-time video/audio streaming
- Screen sharing (teacher)
- Hand raise functionality (students)
- In-session chat
- Participant management
- Session recording
- Attendance tracking

**[ẢNH: Screenshot của Video Conference interface với teacher video lớn, student thumbnails, và control buttons]**

#### B. Technical Implementation Summary

**Stack:**

- **WebRTC**: Peer-to-peer media streaming
- **Simple-peer**: WebRTC wrapper library
- **Socket.IO `/session`**: Signaling server
- **STUN servers**: NAT traversal

**Architecture: Mesh Network**

- Current implementation supports max 8 participants
- P2P connections between all peers
- Low latency (<200ms)
- Future upgrade to SFU for 50+ participants

**Controls Implemented:**

- Toggle video/audio
- Screen sharing (teacher only)
- Hand raise (students)
- Leave/End session
- Network quality indicator

**[ẢNH: Screenshot của Video Conference room - grid layout]**

**[ẢNH: Screenshot của Screen sharing mode]**

**[ẢNH: Screenshot của Participant list với hand raised indicators]**

**Performance Metrics:**

- Connection time: 2-3s
- Video latency: <200ms
- Audio latency: <150ms
- Success rate: 95%

_(Chi tiết code implementation xem trong file 04_cong_nghe_va_trien_khai.md section 4.1.4)_

#### B. Real-time Updates với Socket.IO

```javascript
// Server-side: Discussion namespace
const discussionNamespace = io.of("/discussion");

discussionNamespace.on("connection", (socket) => {
  console.log("User connected to discussion:", socket.id);

  // Join discussion room
  socket.on("join:discussion", async ({ discussionId, userId }) => {
    socket.join(`discussion:${discussionId}`);

    // Increment view count
    await Discussion.findByIdAndUpdate(discussionId, {
      $inc: { views: 1 },
    });
  });

  // Leave discussion room
  socket.on("leave:discussion", ({ discussionId }) => {
    socket.leave(`discussion:${discussionId}`);
  });

  // New comment added
  socket.on("new:comment", async ({ discussionId, comment }) => {
    // Save comment to database
    const savedComment = await Comment.create(comment);

    // Broadcast to all users in room
    discussionNamespace.to(`discussion:${discussionId}`).emit("comment:added", {
      comment: savedComment,
    });
  });

  // Like updated
  socket.on("like:toggle", async ({ discussionId, userId }) => {
    const discussion = await Discussion.findById(discussionId);

    if (discussion.likes.includes(userId)) {
      discussion.likes.pull(userId);
    } else {
      discussion.likes.push(userId);
    }

    await discussion.save();

    // Broadcast like count update
    discussionNamespace.to(`discussion:${discussionId}`).emit("like:updated", {
      likeCount: discussion.likes.length,
    });
  });
});
```

**Client-side: React hooks cho Socket.IO**

```javascript
// useDiscussion hook
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const useDiscussion = (discussionId, userId) => {
  const [socket, setSocket] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // Connect to discussion namespace
    const discussionSocket = io(`${API_URL}/discussion`, {
      auth: { token: localStorage.getItem("accessToken") },
    });

    setSocket(discussionSocket);

    // Join discussion room
    discussionSocket.emit("join:discussion", { discussionId, userId });

    // Listen for new comments
    discussionSocket.on("comment:added", ({ comment }) => {
      setComments((prev) => [...prev, comment]);
    });

    // Listen for like updates
    discussionSocket.on("like:updated", ({ likeCount }) => {
      // Update UI
    });

    return () => {
      discussionSocket.emit("leave:discussion", { discussionId });
      discussionSocket.disconnect();
    };
  }, [discussionId, userId]);

  const addComment = (commentData) => {
    socket.emit("new:comment", {
      discussionId,
      comment: commentData,
    });
  };

  return { comments, addComment };
};
```

**[ẢNH: Animated GIF hoặc sequence screenshots showing real-time comment appearing without page refresh]**

### 3.3.2 Chat/Messaging giữa Teacher-Student

#### A. Chat Features

**Authorization Rules:**

- Students chỉ chat với teachers của courses đã enroll
- Teachers chat với students đã enroll vào courses của họ
- Admin có thể chat với tất cả

**Conversation Model:**

```javascript
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: Date,
    unreadCount: {
      type: Map,
      of: Number, // userId -> unread count
    },
  },
  { timestamps: true }
);

// Compound index for efficient lookups
conversationSchema.index({ participants: 1 });
```

**Message Model:**

```javascript
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
  },
  { timestamps: true }
);
```

**[ẢNH: Screenshot của Chat interface với conversation list sidebar và message area]**

#### B. Real-time Chat với Socket.IO

```javascript
// Chat namespace
const chatNamespace = io.of("/chat");

chatNamespace.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Join conversation room
  socket.on("join:conversation", async ({ conversationId }) => {
    socket.join(`conversation:${conversationId}`);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readBy: { $nin: [userId] },
      },
      { $push: { readBy: userId } }
    );
  });

  // Send message
  socket.on("send:message", async ({ conversationId, content }) => {
    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      readBy: [userId],
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    // Broadcast to conversation room
    chatNamespace
      .to(`conversation:${conversationId}`)
      .emit("message:received", {
        message: await message.populate("senderId", "fullName avatar"),
      });
  });

  // Typing indicator
  socket.on("typing:start", ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit("user:typing", { userId });
  });

  socket.on("typing:stop", ({ conversationId }) => {
    socket
      .to(`conversation:${conversationId}`)
      .emit("user:stopped-typing", { userId });
  });
});
```

**[ẢNH: Screenshot showing typing indicator trong chat interface]**

### 3.3.3 Notifications theo thời gian thực

#### A. Notification System

**Notification Types:**

- `COURSE_ENROLLED`: Khi enroll vào khóa học mới
- `LESSON_COMPLETED`: Khi hoàn thành lesson
- `QUIZ_GRADED`: Khi quiz được chấm điểm
- `NEW_DISCUSSION`: Khi có discussion mới trong khóa học đã enroll
- `DISCUSSION_REPLY`: Khi có reply vào discussion của user
- `COURSE_APPROVED`: Teacher nhận thông báo khi khóa học được approve
- `NEW_MESSAGE`: Khi nhận message mới

**Notification Model:**

```javascript
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "COURSE_ENROLLED",
        "LESSON_COMPLETED",
        "QUIZ_GRADED",
        "NEW_DISCUSSION",
        "DISCUSSION_REPLY",
        "COURSE_APPROVED",
        "NEW_MESSAGE",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: String,
    link: String, // Deep link to relevant page
    metadata: mongoose.Schema.Types.Mixed,
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  { timestamps: true }
);
```

#### B. Real-time Notification Delivery

```javascript
// Notification namespace
const notificationNamespace = io.of("/notification");

notificationNamespace.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  // Join user's notification room
  socket.join(`user:${userId}`);

  console.log(`User ${userId} subscribed to notifications`);

  // Mark notification as read
  socket.on("mark:read", async ({ notificationId }) => {
    await Notification.findByIdAndUpdate(notificationId, {
      isRead: true,
      readAt: new Date(),
    });
  });

  // Mark all as read
  socket.on("mark-all:read", async () => {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  });
});

// Helper function to send notification
export const sendNotification = async (userId, notificationData) => {
  // Save to database
  const notification = await Notification.create({
    userId,
    ...notificationData,
  });

  // Emit to user's socket
  const io = getSocketIOInstance();
  io.of("/notification")
    .to(`user:${userId}`)
    .emit("new:notification", notification);

  return notification;
};
```

**[ẢNH: Screenshot của Notification dropdown với unread badge và list of notifications]**

## 3.4 Theo dõi tiến độ học tập

### A. Progress Tracking Logic

**Automatic Progress Calculation:**

```javascript
// Update progress when lesson completed
export const markLessonCompleted = async (userId, courseId, lessonId) => {
  let progress = await Progress.findOne({ userId, courseId });

  if (!progress) {
    progress = await Progress.create({
      userId,
      courseId,
      completedLessons: [],
      completedQuizzes: [],
      progressPercentage: 0,
      enrolledAt: new Date(),
    });
  }

  // Add lesson if not already completed
  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);

    // Recalculate progress percentage
    const course = await Course.findById(courseId);
    const totalLessons = await Lesson.countDocuments({
      chapterId: { $in: await Chapter.find({ courseId }).distinct("_id") },
    });

    progress.progressPercentage =
      (progress.completedLessons.length / totalLessons) * 100;
    progress.lastAccessedAt = new Date();

    // Mark as completed if 100%
    if (progress.progressPercentage >= 100) {
      progress.completedAt = new Date();

      // Send congratulations notification
      await sendNotification(userId, {
        type: "COURSE_COMPLETED",
        title: "Congratulations!",
        message: `You have completed the course "${course.title}"`,
        link: `/courses/${courseId}/certificate`,
      });
    }

    await progress.save();

    // Emit progress update via Socket.IO
    const io = getSocketIOInstance();
    io.of("/progress").to(`user:${userId}`).emit("progress:updated", {
      courseId,
      progressPercentage: progress.progressPercentage,
    });
  }

  return progress;
};
```

**[ẢNH: Screenshot của Course Progress page với progress bars cho từng course]**

### B. Progress Visualization

**Dashboard Progress Cards:**

- Overall progress percentage
- Number of completed lessons
- Quiz scores
- Time spent learning
- Streak days

**Course-specific Progress:**

- Chapter completion checkmarks
- Lesson progress indicators
- Next lesson recommendation
- Estimated time to complete

**[ẢNH: Screenshot của Student Dashboard với progress cards và charts]**

## 3.5 Analytics và báo cáo

### A. Teacher Analytics

**Course Analytics Dashboard:**

```javascript
export const getCourseAnalytics = async (courseId, teacherId) => {
  // Verify teacher owns the course
  const course = await Course.findOne({ _id: courseId, teacherId });

  if (!course) {
    throw new Error("Course not found or unauthorized");
  }

  // Get enrollment stats
  const enrollmentStats = {
    total: course.enrolledStudents.length,
    thisMonth: await Progress.countDocuments({
      courseId,
      enrolledAt: { $gte: startOfMonth(new Date()) },
    }),
    thisWeek: await Progress.countDocuments({
      courseId,
      enrolledAt: { $gte: startOfWeek(new Date()) },
    }),
  };

  // Completion rate
  const completedCount = await Progress.countDocuments({
    courseId,
    progressPercentage: { $gte: 100 },
  });

  const completionRate = (completedCount / enrollmentStats.total) * 100;

  // Average progress
  const progressData = await Progress.find({ courseId });
  const avgProgress =
    progressData.reduce((sum, p) => sum + p.progressPercentage, 0) /
    progressData.length;

  // Quiz performance
  const quizzes = await Quiz.find({ courseId });
  const quizAttempts = await QuizAttempt.find({
    quizId: { $in: quizzes.map((q) => q._id) },
  });

  const avgQuizScore =
    quizAttempts.reduce((sum, a) => sum + a.percentage, 0) /
    quizAttempts.length;

  return {
    enrollmentStats,
    completionRate,
    avgProgress,
    avgQuizScore,
    totalQuizAttempts: quizAttempts.length,
  };
};
```

**[ẢNH: Screenshot của Teacher Analytics Dashboard với charts và statistics]**

### B. Admin System Analytics

**System-wide Metrics:**

- Total users (students, teachers, admins)
- Total courses (published, pending, rejected)
- Total enrollments
- Active users today/this week/this month
- Revenue analytics (if payment enabled)
- Most popular courses
- Most active teachers

**[ẢNH: Screenshot của Admin Dashboard với system metrics và charts]**

## 3.6 Quản lý media và tài nguyên

### A. Cloudinary Integration

**Media Types Supported:**

- **Images**: Course thumbnails, user avatars, lesson images
- **Videos**: Lesson videos với adaptive streaming
- **Documents**: PDF, PPT, DOC files

**Upload Configuration:**

```javascript
// Image upload
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "e-learning/images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ],
  },
});

// Document upload
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "e-learning/documents",
    resource_type: "raw",
    allowed_formats: ["pdf", "ppt", "pptx", "doc", "docx"],
  },
});
```

**Optimization Features:**

- Automatic format conversion (WebP for images)
- Responsive image delivery
- Lazy loading
- CDN distribution

**[ẢNH: Screenshot của media library với uploaded files và thumbnail previews]**

---

**Kết luận phần 3:**

Các tính năng nổi bật của hệ thống bao gồm authentication với JWT và OAuth, RBAC cho phân quyền chi tiết, quản lý khóa học đa tầng với upload media lên Cloudinary, hệ thống quiz tự động chấm điểm, real-time features với Socket.IO (discussions, chat, notifications), progress tracking tự động, và analytics dashboard cho từng role. Tất cả các tính năng đều được implement với code quality cao và user experience tốt.
