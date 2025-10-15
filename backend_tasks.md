# 📋 BACKEND TASKS - Hệ Thống Học Trực Tuyến

**Project:** Online Learning Platform  
**Tech Stack:** Node.js + Express + MongoDB Atlas + Socket.IO + WebRTC + Cloudinary + SendGrid  
**Team:** Backend Developers

---

## 📌 TỔNG QUAN TASKS

- **Tổng số tasks:** 45 tasks
- **Chia thành 5 giai đoạn:** Setup, Auth, Core Features, Real-time, Deployment
- **Ưu tiên:** High → Medium → Low
- **Thứ tự:** Tuần tính

---

## 🔧 PHASE 1: PROJECT SETUP & CONFIGURATION (Tuần 1)

### Task 1.1: Khởi tạo project Node.js/Express

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo repository GitHub mới
- Khởi tạo Node.js project với npm
- Cài đặt Express.js và các dependencies cơ bản
- Setup folder structure theo chuẩn (src/, config/, models/, controllers/, routes/, middleware/, services/)
- Tạo file .env.example và hướng dẫn cấu hình
- Setup git ignore

### Task 1.2: Cấu hình MongoDB Atlas

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo MongoDB Atlas account
- Tạo cluster mới
- Setup network access whitelist
- Tạo database user
- Lấy connection string
- Viết code kết nối MongoDB trong `config/database.js`
- Test kết nối database

### Task 1.3: Cấu hình Cloudinary

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo Cloudinary account
- Lấy API credentials (cloud name, API key, API secret)
- Viết config file `config/cloudinary.js`
- Setup folder structure trên Cloudinary (avatars/, videos/, documents/, images/)
- Test upload file đơn giản

### Task 1.4: Cấu hình SendGrid Email Service

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo SendGrid account
- Setup domain verification (SPF, DKIM)
- Tạo API key
- Viết config file `config/sendgrid.js`
- Tạo email templates (verification, reset password, notification, etc.)
- Test gửi email

### Task 1.5: Setup JWT Authentication Config

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo file `config/jwt.js`
- Cấu hình JWT secret keys (access token, refresh token)
- Thiết lập token expiration times
- Tạo utility functions cho encode/decode tokens

### Task 1.6: Cài đặt Middleware cơ bản

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Setup CORS middleware
- Setup helmet.js (bảo mật headers)
- Setup Morgan logger
- Setup body parser middleware
- Setup rate limiter middleware
- Setup error handler middleware
- Viết validation middleware boilerplate

### Task 1.7: Setup Socket.IO Server

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tích hợp Socket.IO vào Express server
- Cấu hình CORS cho WebSocket
- Tạo Socket.IO event handlers structure
- Setup namespaces (/discussion, /session, /notification, /progress)
- Test kết nối Socket.IO client

---

## 🔐 PHASE 2: AUTHENTICATION & USER MANAGEMENT (Tuần 2-3)

### Task 2.1: Tạo User Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết User schema trong MongoDB
- Add validators cho email, password strength
- Setup indexes (email unique, etc.)
- Add timestamps (createdAt, updatedAt)
- Add methods cho password hashing (bcryptjs)
- Test model với Mongoose

### Task 2.2: Tạo UserProfile Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết UserProfile schema
- Add relationship với User (ref)
- Add fields: phone, address, bio, socialLinks, enrolledCourses, teachingCourses
- Setup indexes
- Add default values

### Task 2.3: Implement User Registration API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo POST `/api/auth/register` endpoint
- Validate input data (email format, password strength)
- Hash password với bcryptjs
- Generate verification token
- Tạo user record và profile record
- Gửi verification email qua SendGrid
- Return JWT tokens (access + refresh)
- Handle duplicate email error

### Task 2.4: Implement Email Verification

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/auth/verify-email/:token` endpoint
- Validate verification token
- Update user `isVerified` status
- Clear verification token
- Return success message
- Test với email thực hoặc mock

### Task 2.5: Implement User Login API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/auth/login` endpoint
- Validate email exists
- Compare password với hashed password
- Check isVerified status
- Generate JWT tokens (access + refresh)
- Save refresh token trong DB
- Setup httpOnly cookie
- Return user data + tokens

### Task 2.6: Implement Token Refresh Mechanism

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo POST `/api/auth/refresh-token` endpoint
- Validate refresh token
- Check refresh token in DB
- Generate new access token
- Optional: rotate refresh token
- Return new tokens

### Task 2.7: Implement Logout API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo POST `/api/auth/logout` endpoint
- Remove refresh token từ DB
- Clear httpOnly cookie
- Return success message

### Task 2.8: Implement Forgot Password

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/auth/forgot-password` endpoint
- Validate email exists
- Generate reset token
- Save reset token + expiry trong DB
- Gửi reset link qua SendGrid email
- Return success message

### Task 2.9: Implement Reset Password

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo PUT `/api/auth/reset-password/:token` endpoint
- Validate reset token + expiry
- Validate new password strength
- Hash new password
- Update user password
- Clear reset token + expiry
- Return success message

### Task 2.10: Setup Auth Middleware

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo `middleware/auth.js`
- Verify JWT token từ header Authorization
- Extract user ID từ token
- Attach user data vào request object
- Handle token expiry + invalid token errors
- Support multiple auth strategies (JWT, refresh token)

### Task 2.11: Setup Authorization Middleware

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo `middleware/authorize.js`
- Check user role (admin, teacher, student)
- Implement role-based access control
- Handle multiple role checks
- Return 403 Forbidden khi unauthorized

### Task 2.12: Get User Profile API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/users/profile` endpoint
- Get current user data (auth required)
- Return user + profile information
- Include enrolled courses, teaching courses

### Task 2.13: Update User Profile API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo PUT `/api/users/profile` endpoint
- Validate input fields
- Update user profile (phone, address, bio, socialLinks)
- Can update name, email (if available)
- Return updated profile

### Task 2.14: Upload Avatar API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/users/avatar` endpoint
- Integrate Multer + Cloudinary
- Validate file type (jpg, jpeg, png)
- Validate file size (max 5MB)
- Upload to Cloudinary
- Delete old avatar if exists
- Update user avatar URL
- Return updated avatar URL

### Task 2.15: Get User List API (Admin)

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/users/list` endpoint (admin only)
- Add pagination (limit, skip)
- Add filtering (role, isVerified)
- Add sorting (createdAt, email)
- Return list của users + metadata

### Task 2.16: Delete User API (Admin)

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo DELETE `/api/users/:id` endpoint (admin only)
- Validate user exists
- Delete user + profile
- Delete associated data (courses as teacher, progress, etc.)
- Return success message

---

## 📚 PHASE 3: COURSE MANAGEMENT (Tuần 4-5)

### Task 3.1: Tạo Course Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Viết Course schema
- Add fields: title, description, thumbnail, teacherId, category, level, isPublished, enrolledStudents, rating, totalReviews
- Setup indexes (teacherId, category, level, text search)
- Add timestamps
- Add validation rules

### Task 3.2: Tạo Chapter Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Chapter schema
- Add courseId reference
- Add title, order fields
- Setup indexes
- Add validation

### Task 3.3: Tạo Lesson Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Viết Lesson schema
- Add chapterId reference
- Add fields: title, content (rich text), videoUrl, videoDuration, resources array, order, isPreview
- Setup indexes
- Add validation

### Task 3.4: Create Course API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/courses` endpoint (teacher only)
- Validate required fields
- Set teacherId từ authenticated user
- Create course record
- Return created course

### Task 3.5: Upload Course Thumbnail API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/courses/:id/thumbnail` endpoint (teacher)
- Validate course ownership
- Upload thumbnail to Cloudinary
- Delete old thumbnail
- Update course thumbnail URL

### Task 3.6: Get All Courses API (Public)

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo GET `/api/courses` endpoint (public)
- Add pagination
- Add filtering (category, level, teacher, isPublished)
- Add sorting (createdAt, rating)
- Add search by title/description
- Return course list with metadata

### Task 3.7: Get Course Detail API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo GET `/api/courses/:id` endpoint (public)
- Get course + teacher info
- Get all chapters + lessons (structure)
- Check if current user enrolled
- Show preview lessons only if not enrolled
- Return course detail

### Task 3.8: Update Course API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo PUT `/api/courses/:id` endpoint (teacher, owner only)
- Validate course ownership
- Update course fields (title, description, category, level)
- Return updated course

### Task 3.9: Publish/Unpublish Course API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo PUT `/api/courses/:id/publish` endpoint (teacher, owner)
- Validate course ready (has chapters, lessons)
- Toggle isPublished status
- Return updated course

### Task 3.10: Delete Course API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo DELETE `/api/courses/:id` endpoint (teacher, owner)
- Validate course ownership
- Delete course + all chapters + lessons + progress
- Delete media files from Cloudinary
- Return success message

### Task 3.11: Enroll Course API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/courses/:id/enroll` endpoint (student)
- Check if already enrolled
- Add student to enrolledStudents array
- Create user profile reference
- Send enrollment confirmation email
- Create notification
- Return success

### Task 3.12: Unenroll Course API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo DELETE `/api/courses/:id/unenroll` endpoint (student)
- Remove student từ enrolledStudents
- Delete associated progress records
- Return success message

### Task 3.13: Get Enrolled Courses API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/users/enrolled-courses` endpoint (student)
- Get courses user enrolled in
- Include progress for each course
- Add pagination
- Return list

### Task 3.14: Get My Courses API (Teacher)

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/courses/my-courses` endpoint (teacher)
- Get courses created by current teacher
- Include student count, rating
- Add pagination
- Return list

### Task 3.15: Get Course Students List API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/courses/:id/students` endpoint (teacher, owner)
- Get all enrolled students
- Include their progress, quiz scores
- Add pagination
- Return student list

### Task 3.16: Review Course API

**Ưu tiên:** LOW  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/courses/:id/review` endpoint (student)
- Add rating (1-5 stars) + comment
- Check if enrolled + completed
- Update course rating + totalReviews
- Return success

### Task 3.17: Create Chapter API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo POST `/api/chapters` endpoint (teacher)
- Validate course ownership
- Create chapter with order
- Return created chapter

### Task 3.18: Update Chapter API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo PUT `/api/chapters/:id` endpoint (teacher)
- Validate course ownership
- Update title
- Return updated chapter

### Task 3.19: Reorder Chapters API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo PUT `/api/chapters/reorder` endpoint (teacher)
- Accept array of chapter IDs in new order
- Update order field cho all chapters
- Return success

### Task 3.20: Delete Chapter API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo DELETE `/api/chapters/:id` endpoint (teacher)
- Delete chapter + all lessons + media
- Return success

---

## 📖 PHASE 4: LESSON & MEDIA MANAGEMENT (Tuần 6)

### Task 4.1: Tạo Media Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Media schema
- Add fields: lessonId, type, url, filename, size, uploadedBy
- Setup indexes
- Add timestamps

### Task 4.2: Create Lesson API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo POST `/api/lessons` endpoint (teacher)
- Validate chapter ownership
- Create lesson with order
- Return created lesson

### Task 4.3: Update Lesson API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo PUT `/api/lessons/:id` endpoint (teacher)
- Validate course ownership
- Update title, content, isPreview
- Return updated lesson

### Task 4.4: Delete Lesson API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo DELETE `/api/lessons/:id` endpoint (teacher)
- Delete lesson + all media
- Delete from Cloudinary
- Return success

### Task 4.5: Upload Video Lesson API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 3 tiếng  
**Nội dung:**

- Tạo POST `/api/lessons/:id/video` endpoint (teacher)
- Validate lesson ownership
- Accept video file (mp4, avi, mov)
- Upload to Cloudinary (video resource type)
- Extract video duration
- Create Media record
- Update lesson videoUrl + duration
- Return success

### Task 4.6: Upload Lesson Resources API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo POST `/api/lessons/:id/resource` endpoint (teacher)
- Validate lesson ownership
- Accept multiple file types (pdf, doc, ppt, etc.)
- Upload to Cloudinary
- Create Media records
- Add to lesson resources array
- Return success

### Task 4.7: Delete Lesson Resource API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo DELETE `/api/lessons/:id/resource/:resId` endpoint (teacher)
- Delete from Cloudinary
- Remove from lesson resources array
- Return success

### Task 4.8: Get Lesson Detail API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/lessons/:id` endpoint (public)
- Get lesson + resources
- Check if user can view (enrolled or preview)
- Return lesson detail

### Task 4.9: Tạo Progress Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Progress schema
- Add fields: userId, lessonId, courseId, watchedDuration, isCompleted, lastWatchedAt
- Setup compound unique index (userId + lessonId)
- Add timestamps

### Task 4.10: Update Progress API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo PUT `/api/progress/lesson/:lessonId` endpoint (student)
- Update watchedDuration
- Update lastWatchedAt
- Auto-mark completed if watched >= 90% hoặc manual mark
- Save progress
- Emit Socket.IO event để update

### Task 4.11: Mark Lesson Completed API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo POST `/api/progress/complete/:lessonId` endpoint (student)
- Validate enrolled
- Mark lesson as completed
- Check if course fully completed
- Emit Socket.IO event
- Return success

### Task 4.12: Get Course Progress API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo GET `/api/progress/course/:courseId` endpoint (student)
- Calculate completion percentage
- Count completed lessons
- Include current video position
- Return progress data

---

## ✅ PHASE 5: QUIZ & ASSESSMENT (Tuần 7)

### Task 5.1: Tạo Quiz Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Viết Quiz schema
- Add fields: courseId, lessonId, title, duration, passingScore, attemptsAllowed, isPublished
- Setup indexes
- Add timestamps

### Task 5.2: Tạo Question Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Question schema
- Add type: multiple_choice, true_false, essay, fill_blank
- Add fields theo từng type
- Setup indexes
- Add timestamps

### Task 5.3: Tạo QuizAttempt Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết QuizAttempt schema
- Add fields: quizId, userId, answers, score, isPassed, attemptNumber
- Setup indexes
- Add timestamps

### Task 5.4: Create Quiz API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/quizzes` endpoint (teacher)
- Validate course ownership
- Create quiz record
- Return created quiz

### Task 5.5: Create Question API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/questions/quiz/:quizId` endpoint (teacher)
- Validate quiz ownership
- Validate question type + fields
- Create question record
- Return created question

### Task 5.6: Update Question API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo PUT `/api/questions/:id` endpoint (teacher)
- Validate quiz ownership
- Update question content
- Validate against question type
- Return updated question

### Task 5.7: Delete Question API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo DELETE `/api/questions/:id` endpoint (teacher)
- Delete question
- Return success

### Task 5.8: Get Quiz Detail API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/quizzes/:id` endpoint (public)
- Get quiz + questions (without answers if not started)
- Check if user enrolled
- Return quiz detail

### Task 5.9: Start Quiz API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/quizzes/:id/start` endpoint (student)
- Check enrolled + attempts left
- Create QuizAttempt record
- Set startedAt timestamp
- Return quiz questions (without correct answers)
- Return attempt ID

### Task 5.10: Submit Quiz API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 3 tiếng  
**Nội dung:**

- Tạo POST `/api/quizzes/:id/submit` endpoint (student)
- Validate attempt exists + in progress
- Get all questions + correct answers
- Auto-grade multiple_choice, true_false, fill_blank
- Calculate score + percentage
- Check isPassed
- Save answers + results
- Create notification for teacher
- Return results

### Task 5.11: Get Quiz Attempts API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/quizzes/:id/attempts` endpoint (student)
- Get all attempts by current user
- Include score, date, status
- Add pagination
- Return attempts list

### Task 5.12: Get Quiz Result Detail API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo GET `/api/quizzes/:id/results/:attemptId` endpoint (student)
- Validate ownership (student or teacher)
- Get attempt + show correct answers
- Include explanation for each question
- Return detailed result

### Task 5.13: Update Quiz API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo PUT `/api/quizzes/:id` endpoint (teacher)
- Validate course ownership
- Update quiz fields
- Return updated quiz

### Task 5.14: Delete Quiz API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo DELETE `/api/quizzes/:id` endpoint (teacher)
- Delete quiz + all questions + attempts
- Return success

---

## 💬 PHASE 6: DISCUSSION & REAL-TIME FEATURES (Tuần 8)

### Task 6.1: Tạo Discussion Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Discussion schema
- Add fields: courseId, userId, title, content, isPinned, likes, views
- Setup indexes
- Add timestamps

### Task 6.2: Tạo Comment Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Comment schema
- Add fields: discussionId, userId, content, parentId, likes
- Setup indexes (nested comments support)
- Add timestamps

### Task 6.3: Setup Discussion Socket.IO Events

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo `/socket/discussionHandler.js`
- Setup 'discussion:join' event (join course room)
- Setup 'discussion:leave' event
- Emit server events: discussion:created, comment:created, discussion:liked, comment:liked
- Handle user connection/disconnection
- Test events

### Task 6.4: Create Discussion API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo POST `/api/discussions` endpoint (student/teacher)
- Validate enrolled + role
- Create discussion record
- Emit Socket.IO event
- Send notifications
- Return created discussion

### Task 6.5: Get Discussions API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo GET `/api/discussions/course/:courseId` endpoint (public)
- Get discussions sorted (pinned first, then latest)
- Include comment count
- Add pagination
- Add search/filter options
- Return discussions list

### Task 6.6: Get Discussion Detail API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/discussions/:id` endpoint (public)
- Increment views count
- Get discussion + all comments (nested support)
- Include user info, likes count
- Return discussion detail

### Task 6.7: Update Discussion API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo PUT `/api/discussions/:id` endpoint (owner/teacher)
- Validate ownership
- Update title + content
- Return updated discussion

### Task 6.8: Delete Discussion API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo DELETE `/api/discussions/:id` endpoint (owner/teacher)
- Validate ownership
- Delete discussion + all comments
- Return success

### Task 6.9: Like Discussion API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo PUT `/api/discussions/:id/like` endpoint (student)
- Toggle like (add/remove user from likes array)
- Emit Socket.IO event
- Return updated like count

### Task 6.10: Pin Discussion API

**Ưu tiên:** LOW  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo PUT `/api/discussions/:id/pin` endpoint (teacher only)
- Validate course ownership
- Toggle isPinned status
- Emit Socket.IO event
- Return success

### Task 6.11: Create Comment API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo POST `/api/discussions/:id/comment` endpoint (student)
- Validate enrolled
- Create comment record (with optional parentId for nested)
- Emit Socket.IO event
- Send notification to discussion owner
- Return created comment

### Task 6.12: Update Comment API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo PUT `/api/comments/:id` endpoint (owner)
- Validate ownership
- Update content
- Return updated comment

### Task 6.13: Delete Comment API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo DELETE `/api/comments/:id` endpoint (owner/teacher)
- Validate ownership
- Delete comment (soft or hard delete based on replies)
- Return success

### Task 6.14: Like Comment API

**Ưu tiên:** LOW  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo PUT `/api/comments/:id/like` endpoint (student)
- Toggle like
- Emit Socket.IO event
- Return updated like count

---

## 📹 PHASE 7: VIDEO CALL & LIVE SESSION (Tuần 9)

### Task 7.1: Tạo LiveSession Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Viết LiveSession schema
- Add fields: courseId, hostId, title, scheduledAt, participants, recordingUrl, status
- Setup indexes
- Add timestamps

### Task 7.2: Setup WebRTC Signaling Server (Socket.IO)

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 3 tiếng  
**Nội dung:**

- Tạo `/socket/sessionHandler.js`
- Setup 'session:join' event (join video room)
- Setup 'session:leave' event
- Setup 'webrtc:offer' event (forward offer to peer)
- Setup 'webrtc:answer' event (forward answer to peer)
- Setup 'webrtc:ice-candidate' event (forward ICE candidates)
- Setup room management (track participants)
- Handle user disconnect cleanup

### Task 7.3: Setup Real-time Chat in Video Call

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo 'session:chat' event handler
- Setup 'session:chat-message' broadcast event
- Store chat messages (optional)
- Emit messages to all participants

### Task 7.4: Setup Screen Share (WebRTC)

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo 'session:screen-share' event handler
- Setup 'session:user-screen-share' broadcast event
- Handle screen capture negotiation
- Handle screen share stop
- Support multiple simultaneous screen shares

### Task 7.5: Setup Audio/Video Controls

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo 'session:toggle-video' event
- Tạo 'session:toggle-audio' event
- Broadcast user state changes
- Update participant list

### Task 7.6: Setup Hand Raise Feature

**Ưu tiên:** LOW  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo 'session:raise-hand' event
- Broadcast hand raise to all participants
- Track hand raise state

### Task 7.7: Create Live Session API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/sessions` endpoint (teacher)
- Validate course ownership
- Create session record
- Set status to 'scheduled'
- Send notifications to enrolled students
- Return created session

### Task 7.8: Get Sessions API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/sessions/course/:courseId` endpoint (public)
- Get all sessions for course
- Filter by status (scheduled, live, ended)
- Add pagination
- Return sessions list

### Task 7.9: Get Session Detail API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo GET `/api/sessions/:id` endpoint (public)
- Get session + participants list
- Get recording if available
- Return session detail

### Task 7.10: Update Session API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo PUT `/api/sessions/:id` endpoint (teacher, owner)
- Validate ownership
- Update title, description, scheduledAt
- Return updated session

### Task 7.11: Start Session API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo PUT `/api/sessions/:id/start` endpoint (teacher, owner)
- Validate ownership
- Change status to 'live'
- Broadcast session:live notification via Socket.IO
- Send email + in-app notifications
- Return success

### Task 7.12: End Session API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo PUT `/api/sessions/:id/end` endpoint (teacher, owner)
- Validate ownership
- Change status to 'ended'
- Calculate duration
- Save participants session time
- Broadcast session:ended event
- Return success

### Task 7.13: Join Session API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo POST `/api/sessions/:id/join` endpoint (student)
- Validate enrolled + session is live
- Add to participants array
- Record joinedAt time
- Emit Socket.IO join event
- Return session room info

### Task 7.14: Delete Session API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo DELETE `/api/sessions/:id` endpoint (teacher, owner)
- Validate ownership
- Delete session record
- Delete recording if exists
- Return success

---

## 🔔 PHASE 8: NOTIFICATIONS (Tuần 10)

### Task 8.1: Tạo Notification Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Notification schema
- Add fields: userId, type, title, content, link, isRead
- Setup indexes (userId, isRead, createdAt)
- Add timestamps

### Task 8.2: Setup Notification Socket.IO Events

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo `/socket/notificationHandler.js`
- Setup 'notification:new' broadcast event (real-time push)
- Setup user-specific notification delivery
- Test real-time notifications

### Task 8.3: Create Notification Service

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo `/services/notificationService.js`
- Create functions: notifyEnrollment, notifyQuizAssigned, notifyDiscussionReply, notifyGrade, etc.
- For each function: save to DB + Socket.IO emit + optional email
- Support batch notifications
- Handle user preferences (email/in-app)

### Task 8.4: Get Notifications API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- Tạo GET `/api/notifications` endpoint (user)
- Get notifications for current user
- Add pagination
- Add filtering (type, isRead)
- Add sorting (createdAt desc)
- Return notifications list

### Task 8.5: Get Unread Count API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo GET `/api/notifications/unread-count` endpoint (user)
- Count unread notifications
- Return count

### Task 8.6: Mark Notification Read API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo PUT `/api/notifications/:id/read` endpoint (user)
- Mark single notification as read
- Return success

### Task 8.7: Mark All Notifications Read API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo PUT `/api/notifications/read-all` endpoint (user)
- Mark all unread notifications as read
- Return success

### Task 8.8: Delete Notification API

**Ưu tiên:** LOW  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Tạo DELETE `/api/notifications/:id` endpoint (user)
- Delete notification
- Return success

### Task 8.9: Setup Course Enrollment Notifications

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- When user enrolls: create notification
- Notify teacher when student enrolls
- Trigger via notificationService
- Include enrollment details

### Task 8.10: Setup Quiz Assignment Notifications

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- When quiz is published: notify enrolled students
- Include quiz deadline if set
- Setup email reminder (optional cron job)
- Trigger via notificationService

### Task 8.11: Setup Discussion Reply Notifications

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- When comment posted: notify discussion creator + repliers
- Support mention notifications (@username)
- Trigger via notificationService
- Include preview of comment

### Task 8.12: Setup Grade/Quiz Result Notifications

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 1.5 tiếng  
**Nội dung:**

- When quiz graded: notify student
- Include score + passed/failed status
- Include teacher feedback (if available)
- Trigger via notificationService

### Task 8.13: Setup Live Session Notifications

**Ưu tiên:** MEDIUM  
**Thời gian ước تار:** 1.5 tiếng  
**Nội dung:**

- When session starts: notify enrolled students
- Send reminder 5 minutes before scheduled time
- Include session details + join link
- Trigger via notificationService

---

## 📊 PHASE 9: ANALYTICS & REPORTING (Tuần 11)

### Task 9.1: Tạo Analytics Schema & Model

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 1 tiếng  
**Nội dung:**

- Viết Analytics schema
- Add fields: courseId, date, totalStudents, activeStudents, completionRate, averageScore, etc.
- Setup indexes (courseId, date)
- Add timestamps

### Task 9.2: Create Analytics Data Collection Service

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 3 tiếng  
**Nội dung:**

- Tạo cron job (daily scheduled task)
- Calculate for each course: total students, active students, completion rate, average score
- Save to Analytics collection
- Handle errors + logging
- Setup schedule (e.g., 00:00 UTC daily)

### Task 9.3: Get Course Analytics API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo GET `/api/analytics/course/:courseId` endpoint (teacher, owner)
- Validate course ownership
- Get analytics data for date range
- Include trend data (7 days, 30 days)
- Calculate growth metrics
- Return analytics data

### Task 9.4: Get Student Analytics API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Tạo GET `/api/analytics/student/:userId` endpoint (student/teacher)
- Get personal learning statistics
- Include courses progress, quiz scores, time spent, etc.
- Return student analytics

### Task 9.5: Get Dashboard Analytics API

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo GET `/api/analytics/dashboard` endpoint (teacher/admin)
- For teacher: summary of all their courses
- For admin: platform-wide statistics
- Include top courses, top students, trends
- Return dashboard data

### Task 9.6: Export Course Analytics API

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Tạo GET `/api/reports/export` endpoint (teacher)
- Validate course ownership
- Generate CSV file with:
  - Student list + enrollment date
  - Progress data
  - Quiz scores
  - Time spent
- Return downloadable CSV

### Task 9.7: Generate Student Report API

**Ưu tiên:** LOW  
**Thời gian ước تین:** 2 tiếng  
**Nội dung:**

- Tạo GET `/api/reports/student/:userId` endpoint (teacher/student)
- Generate comprehensive student report
- Include all courses, progress, scores, participation
- Optional: export as PDF
- Return report data

---

## 🔧 PHASE 10: TESTING & DEPLOYMENT (Tuần 12)

### Task 10.1: Setup Unit Tests

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 3 tiếng  
**Nội dung:**

- Setup Jest testing framework
- Write unit tests for services (auth, upload, email, notification)
- Write tests for utility functions
- Setup test database (test MongoDB)
- Configure CI/CD integration
- Aim for 70%+ coverage

### Task 10.2: Setup API Integration Tests

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 4 tiếng  
**Nội dung:**

- Write tests for authentication endpoints
- Write tests for CRUD operations (courses, lessons, quizzes)
- Write tests for authorization (role-based)
- Test error handling
- Test edge cases

### Task 10.3: Database Backup & Migration Setup

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Setup MongoDB Atlas automatic backups
- Create migration scripts for schema updates
- Document migration procedures
- Setup rollback procedures

### Task 10.4: Setup Production Environment

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Setup MongoDB Atlas production cluster
- Setup production Cloudinary account
- Setup production SendGrid configuration
- Create production .env file
- Setup environment-specific configs

### Task 10.5: Setup Logging & Monitoring

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Setup Winston logger
- Configure log levels (error, warn, info, debug)
- Setup error tracking (Sentry optional)
- Setup performance monitoring
- Create log rotation policy

### Task 10.6: Deploy Backend to Production

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2.5 tiếng  
**Nội dung:**

- Deploy to Railway/Heroku/DigitalOcean
- Configure domain + SSL certificate
- Setup environment variables
- Configure CORS for production
- Test all endpoints in production
- Setup CI/CD pipeline

### Task 10.7: Setup Rate Limiting & Security

**Ưu tiên:** HIGH  
**Thời gian ước tính:** 2 tiếng  
**Nội dung:**

- Configure rate limiting per endpoint
- Setup CORS whitelist
- Setup CSRF protection (if needed)
- Enable HTTPS everywhere
- Add security headers (Helmet)
- Test security measures

### Task 10.8: Create API Documentation

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 3 tiếng  
**Nội dung:**

- Document all API endpoints (Swagger/OpenAPI)
- Include request/response examples
- Document error codes
- Create postman collection
- Add authentication instructions
- Deploy documentation

### Task 10.9: Performance Optimization

**Ưu tiên:** MEDIUM  
**Thời gian ước tính:** 3 tiếng  
**Nội dung:**

- Optimize database queries (add indexes)
- Implement query pagination
- Setup response caching
- Optimize file uploads
- Profile and benchmark endpoints
- Document performance metrics

### Task 10.10: Final Testing & QA

**Ưu tiên:** HIGH  
**Thời gian ước تین:** 4 tiếng  
**Nội dung:**

- Perform end-to-end testing
- Test all user flows
- Test error scenarios
- Load testing
- Security testing
- Fix bugs and issues
- Document known issues

---

## 📝 SUMMARY

**Total Backend Tasks:** 45  
**Estimated Total Time:** 12 weeks (assuming 1 developer)  
**Can be parallelized:** Phase 3-9 (multiple developers)

**Task Breakdown by Phase:**

- Phase 1 (Setup): 7 tasks → 1 week
- Phase 2 (Auth): 16 tasks → 2 weeks
- Phase 3 (Courses): 20 tasks → 2 weeks
- Phase 4 (Lessons): 12 tasks → 1.5 weeks
- Phase 5 (Quiz): 14 tasks → 1.5 weeks
- Phase 6 (Discussion): 14 tasks → 1.5 weeks
- Phase 7 (Video Call): 14 tasks → 1.5 weeks
- Phase 8 (Notifications): 13 tasks → 1.5 weeks
- Phase 9 (Analytics): 7 tasks → 1 week
- Phase 10 (Testing & Deploy): 10 tasks → 1.5 weeks

---

**Last Updated:** 2025  
**Status:** Ready for Development
