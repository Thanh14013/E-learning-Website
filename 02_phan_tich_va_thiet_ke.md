# 2. Phân tích và thiết kế hệ thống

## 2.1 Phân tích yêu cầu

### 2.1.1 Yêu cầu chức năng

#### A. Yêu cầu chức năng cho Student (Học viên)

**Xác thực và quản lý tài khoản:**

- Đăng ký tài khoản với email và password
- Đăng nhập bằng email/password hoặc Google OAuth 2.0
- Quản lý profile: cập nhật thông tin cá nhân, avatar
- Đổi mật khẩu
- Nhận email xác thực tài khoản

**Quản lý khóa học:**

- Xem danh sách khóa học với filter theo category, level, search
- Xem chi tiết khóa học (syllabus, lessons, reviews)
- Enroll vào khóa học
- Xem danh sách khóa học đã đăng ký
- Unenroll khỏi khóa học

**Học tập:**

- Xem video lessons với player tích hợp
- Đọc nội dung bài học dạng rich text
- Download tài liệu đính kèm
- Làm quiz với nhiều loại câu hỏi
- Xem kết quả và review quiz đã làm
- Tự động lưu progress khi hoàn thành lesson

**Tương tác:**

- Tạo discussion thread trong khóa học/bài học
- Comment và reply trong discussion
- Like/unlike discussions và comments
- Chat trực tiếp với giảng viên của khóa học đã enroll
- Nhận notification real-time

**Theo dõi tiến độ:**

- Xem progress bar của từng khóa học
- Xem lịch sử học tập
- Xem điểm số các quiz đã làm

#### B. Yêu cầu chức năng cho Teacher (Giảng viên)

**Quản lý hồ sơ giảng viên:**

- Complete teacher profile với thông tin chi tiết
- Upload CV để admin xét duyệt
- Chờ admin approval trước khi được phép tạo khóa học

**Quản lý khóa học:**

- Tạo khóa học mới với đầy đủ thông tin
- Upload thumbnail cho khóa học
- Tạo chapters trong khóa học
- Tạo lessons trong chapter với:
  - Rich text content (HTML editor)
  - Video upload (Cloudinary)
  - Tài liệu đính kèm (PDF, PPT, DOC, etc.)
- Sắp xếp thứ tự chapters và lessons
- Đánh dấu lesson là preview (free)
- Cập nhật, xóa khóa học

**Quản lý Quiz:**

- Tạo quiz cho từng lesson
- Thêm câu hỏi với nhiều loại (multiple choice, true/false)
- Thiết lập thời gian làm bài
- Thiết lập điểm passing score
- Giới hạn số lần làm bài

**Tương tác với học viên:**

- Xem danh sách học viên đã enroll
- Chat với học viên
- Reply trong discussion forums
- Pin/unpin discussions quan trọng

**Analytics:**

- Xem dashboard với số liệu tổng quan
- Xem analytics của từng khóa học
- Xem tiến độ của từng học viên
- Export báo cáo analytics
- Xem revenue (nếu có payment)

**[ẢNH: Biểu đồ use case chi tiết cho Teacher role]**

#### C. Yêu cầu chức năng cho Admin (Quản trị viên)

**Quản lý người dùng:**

- Xem danh sách tất cả users với filter
- Cập nhật role của user (student ↔ teacher ↔ admin)
- Ban/unban user
- Delete user
- Approve/reject teacher registration với CV review

**Quản lý nội dung:**

- Xem danh sách tất cả khóa học
- Approve/reject khóa học mới tạo
- Xóa khóa học vi phạm
- Xem và xử lý reports từ users

**System monitoring:**

- Xem dashboard với system analytics
- Monitor live activities
- Xem thống kê tổng quan (users, courses, revenue)
- Quản lý system settings

**[ẢNH: Biểu đồ use case chi tiết cho Admin role]**

### 2.1.2 Yêu cầu phi chức năng

#### A. Performance (Hiệu năng)

- **Response time**:

  - API endpoints: < 500ms cho 95% requests
  - Page load: < 2s cho first contentful paint
  - Video streaming: < 3s buffer time

- **Throughput**:

  - Hỗ trợ 1000+ concurrent users
  - Xử lý 10,000+ API requests/minute

- **Database**:
  - Query response time < 100ms
  - Indexing cho các trường thường xuyên query

#### B. Security (Bảo mật)

- **Authentication**:

  - JWT với access token (3h) và refresh token (7d)
  - Password hashing với bcrypt (salt rounds: 10)
  - Refresh token rotation

- **Authorization**:

  - Role-based access control (RBAC)
  - Route-level và resource-level permission checks

- **Data protection**:

  - HTTPS cho tất cả communications
  - Input validation và sanitization
  - Protection against common attacks:
    - SQL Injection (sử dụng Mongoose)
    - XSS (sanitize HTML input)
    - CSRF (CSRF tokens)
    - Brute force (rate limiting)

- **Third-party security**:
  - Helmet.js cho security headers
  - CORS configuration
  - Environment variables cho sensitive data

#### C. Scalability (Khả năng mở rộng)

- Kiến trúc modular cho phép scale từng service
- Stateless API design
- Database indexing và optimization
- Cloud storage cho media files
- Ready cho horizontal scaling

#### D. Usability (Tính dễ sử dụng)

- Giao diện responsive (mobile, tablet, desktop)
- Intuitive navigation
- Consistent UI/UX patterns
- Accessibility support
- Multi-language ready (hiện tại: Vietnamese)

#### E. Reliability (Độ tin cậy)

- Error handling và logging đầy đủ
- Data validation ở cả client và server
- Graceful degradation khi service unavailable
- Auto-reconnect cho Socket.IO

#### F. Maintainability (Tính bảo trì)

- Clean code với naming conventions
- Code organization theo MVC pattern
- Comprehensive comments
- API documentation
- Git version control

**[ẢNH: Bảng so sánh các yêu cầu phi chức năng với industry standards]**

### 2.1.3 Biểu đồ Use Case tổng quan

**[ẢNH: Use Case Diagram tổng quan với 3 actors (Student, Teacher, Admin) và tất cả các use cases chính, bao gồm các relationships như include, extend, generalization]**

## 2.2 Thiết kế kiến trúc hệ thống

### 2.2.1 Kiến trúc tổng quan Client-Server

Hệ thống được thiết kế theo mô hình **3-tier architecture** với các tầng rõ ràng:

**Tầng 1: Presentation Layer (Client)**

- **Công nghệ**: React 18 + Vite
- **Nhiệm vụ**:
  - Render giao diện người dùng
  - Handle user interactions
  - Manage client-side state (Context API)
  - Routing với React Router
  - Real-time updates với Socket.IO client

**Tầng 2: Application Layer (Server)**

- **Công nghệ**: Node.js + Express
- **Nhiệm vụ**:
  - Process business logic
  - Handle authentication & authorization
  - Validate requests
  - Coordinate between client và database
  - Manage real-time connections (Socket.IO server)

**Tầng 3: Data Layer**

- **Công nghệ**: MongoDB + Mongoose
- **Nhiệm vụ**:
  - Persistent data storage
  - Data relationships management
  - Query optimization với indexes

**External Services:**

- **Cloudinary**: Media storage (images, videos, documents)
- **SendGrid**: Email service (verification, notifications)

**[ẢNH: Sơ đồ kiến trúc 3-tier với luồng dữ liệu giữa Client, Server, Database và External Services]**

### 2.2.2 Cơ chế giao tiếp API RESTful

#### A. RESTful API Design Principles

Hệ thống sử dụng REST API với các nguyên tắc:

1. **Resource-based URLs**:

   ```
   /api/courses          - Collection
   /api/courses/:id      - Single resource
   /api/courses/:id/chapters - Nested resource
   ```

2. **HTTP Methods**:

   - `GET`: Retrieve data
   - `POST`: Create new resource
   - `PUT`: Update entire resource
   - `PATCH`: Partial update
   - `DELETE`: Remove resource

3. **Status Codes**:

   - `200`: Success
   - `201`: Created
   - `400`: Bad Request
   - `401`: Unauthorized
   - `403`: Forbidden
   - `404`: Not Found
   - `500`: Server Error

4. **Response Format**:
   ```json
   {
     "success": true,
     "message": "Operation successful",
     "data": { ... },
     "pagination": {
       "page": 1,
       "limit": 10,
       "total": 100
     }
   }
   ```

**[ẢNH: Sơ đồ minh họa Request-Response cycle của RESTful API]**

#### B. API Endpoints Structure

**Authentication Routes** (`/api/auth`):

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/refresh
POST   /api/auth/logout
```

**Course Routes** (`/api/courses`):

```
GET    /api/courses                    - Public list
GET    /api/courses/:id                - Public detail
POST   /api/courses                    - Create (Teacher)
PUT    /api/courses/:id                - Update (Teacher)
DELETE /api/courses/:id                - Delete (Teacher)
GET    /api/courses/enrolled           - Student's enrolled courses
GET    /api/courses/my-courses         - Teacher's courses
POST   /api/courses/:id/enroll         - Enroll (Student)
DELETE /api/courses/:id/unenroll       - Unenroll (Student)
```

**Chapter & Lesson Routes**:

```
POST   /api/chapters                   - Create chapter
PUT    /api/chapters/:id               - Update chapter
DELETE /api/chapters/:id               - Delete chapter
POST   /api/lessons                    - Create lesson
PUT    /api/lessons/:id                - Update lesson
DELETE /api/lessons/:id                - Delete lesson
POST   /api/lessons/:id/upload-video   - Upload video
```

**Quiz Routes** (`/api/quizzes`):

```
POST   /api/quizzes                    - Create quiz
GET    /api/quizzes/:id                - Get quiz details
POST   /api/quizzes/:id/attempt        - Submit quiz attempt
GET    /api/quizzes/:id/attempts       - Get attempt history
```

**Discussion Routes** (`/api/discussions`):

```
GET    /api/discussions                - List discussions
POST   /api/discussions                - Create discussion
PUT    /api/discussions/:id            - Update discussion
DELETE /api/discussions/:id            - Delete discussion
POST   /api/discussions/:id/like       - Like/unlike
```

**Admin Routes** (`/api/admin`):

```
GET    /api/admin/users                - List all users
PUT    /api/admin/users/:id/role       - Update user role
PUT    /api/admin/users/:id/ban        - Ban/unban user
GET    /api/admin/courses              - List all courses
PUT    /api/admin/courses/:id/approve  - Approve course
```

**[ẢNH: Sơ đồ API structure dạng tree view với tất cả endpoints]**

### 2.2.3 Real-time Communication với Socket.IO

#### A. Socket.IO Architecture

Hệ thống sử dụng **Socket.IO namespaces** để tổ chức các real-time features:

```javascript
// Socket.IO Namespaces
/discussion    - Discussion forums real-time updates
/notification  - Real-time notifications
/chat          - 1-1 chat between student-teacher
/session       - Live session events
```

#### B. Event-driven Communication

**Discussion Namespace** (`/discussion`):

```javascript
// Client → Server events
- 'join:discussion' - Join discussion room
- 'leave:discussion' - Leave discussion room
- 'new:comment' - New comment added

// Server → Client events
- 'discussion:updated' - Discussion updated
- 'comment:added' - New comment notification
- 'like:updated' - Like count updated
```

**Notification Namespace** (`/notification`):

```javascript
// Client → Server events
- 'join:notifications' - Subscribe to user notifications

// Server → Client events
- 'new:notification' - New notification
- 'notification:read' - Notification marked as read
```

**Chat Namespace** (`/chat`):

```javascript
// Client → Server events
- 'join:conversation' - Join chat room
- 'send:message' - Send message
- 'typing:start' - User started typing
- 'typing:stop' - User stopped typing

// Server → Client events
- 'message:received' - New message
- 'user:typing' - Other user typing
- 'message:delivered' - Message delivery confirmation
```

**[ẢNH: Sequence diagram cho real-time chat flow: User A sends message → Server validates → Broadcast to User B → Acknowledgment]**

#### C. Room-based Communication

Socket.IO sử dụng **rooms** để group connections:

```javascript
// Example: Discussion room
socket.join(`discussion:${discussionId}`);

// Broadcast to room
io.to(`discussion:${discussionId}`).emit("comment:added", data);

// User-specific notifications
socket.join(`user:${userId}`);
io.to(`user:${userId}`).emit("new:notification", notification);
```

**[ẢNH: Diagram minh họa Socket.IO rooms với multiple clients connected đến different rooms]**

### 2.2.4 WebRTC cho Video Conferencing

#### A. WebRTC Architecture

Hệ thống sử dụng **WebRTC (Web Real-Time Communication)** cho peer-to-peer video/audio streaming trong live sessions.

**Components:**

1. **Signaling Server**: Socket.IO namespace `/session` để trao đổi SDP và ICE candidates
2. **STUN Server**: Google STUN server để discover public IP
3. **Simple-peer Library**: WebRTC wrapper cho React
4. **Media Streams**: getUserMedia API cho camera/microphone access

**Connection Flow:**

```
Teacher (Host)                     Signaling Server                    Students
    │                                     │                                  │
    ├─────[1] Create Session──────────────►│                                  │
    │                                     │                                  │
    │                                     │◄─────[2] Join Request─────────────┤
    │                                     │                                  │
    │◄────[3] Student Joined──────────────┤                                  │
    │                                     │                                  │
    ├─────[4] Offer (SDP)────────────────►├─────[4] Offer──────────────────►│
    │                                     │                                  │
    │◄────[5] Answer (SDP)────────────────├◄────[5] Answer──────────────────┤
    │                                     │                                  │
    ├─────[6] ICE Candidates─────────────►├─────[6] ICE Candidates──────────►│
    │                                     │                                  │
    │◄═══════[7] P2P Video/Audio Stream═══════════════════════════════════►│
```

**[ẢNH: Sequence diagram chi tiết của WebRTC connection establishment]**

#### B. Mesh vs SFU Architecture

**Current Implementation: Mesh Network**

```
         Teacher
        /   |   \
       /    |    \
      /     |     \
 Student1  Student2  Student3
      \     |     /
       \    |    /
        \   |   /
      (Full Mesh)
```

**Pros:**

- Low latency
- No server bandwidth costs
- Simple implementation

**Cons:**

- Scalability limited (max 5-8 participants)
- High client bandwidth usage

**Future: SFU (Selective Forwarding Unit)**

- Better scalability (50+ participants)
- Lower client bandwidth
- Requires media server (Janus, Mediasoup)

#### C. Media Controls & Session Model

**Implemented Features:**

- Toggle video on/off
- Toggle audio (mute/unmute)
- Screen sharing (teacher only)
- Hand raise (students)
- Participant list
- Chat sidebar
- Recording (basic implementation)

**Session Model:**

```javascript
const liveSessionSchema = new mongoose.Schema({
  courseId: ObjectId,
  hostId: ObjectId,
  title: String,
  scheduledAt: Date,
  participants: [
    {
      userId: ObjectId,
      joinedAt: Date,
      leftAt: Date,
      handRaised: Boolean,
      videoEnabled: Boolean,
      audioEnabled: Boolean,
    },
  ],
  status: Enum[("scheduled", "live", "ended", "cancelled")],
  startedAt: Date,
  endedAt: Date,
  recordingUrl: String,
});
```

**[ẢNH: ERD diagram showing LiveSession relationships với Course, User, và Recording]**

#### D. Security Considerations

**Authentication:**

- JWT token verification trước khi join session
- Only enrolled students có thể join
- Teacher authorization check

**Privacy:**

- Media streams không được recorded nếu không có consent
- End-to-end encryption với DTLS
- Secure signaling với WSS (WebSocket Secure)

**[ẢNH: Flowchart của WebRTC security flow]**

### 2.3 Thiết kế cơ sở dữ liệu

### 2.3.1 Mô hình ERD

Hệ thống sử dụng **MongoDB** - NoSQL database với schema design tối ưu cho flexibility và performance.

**[ẢNH: Entity Relationship Diagram (ERD) đầy đủ cho tất cả các collections với relationships: User, UserProfile, Course, Chapter, Lesson, Quiz, Question, QuizAttempt, Discussion, Comment, Progress, Notification, Conversation, Message, Analytics, Report]**

### 2.3.2 Các Collection chính

#### A. User Collection

```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: Enum ['student', 'teacher', 'admin'],
  avatar: String (Cloudinary URL),
  isVerified: Boolean,
  isBanned: Boolean,
  profileCompleted: Boolean,
  profileApprovalStatus: Enum ['pending', 'approved', 'rejected'],
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- `email`: Unique index cho login
- `role`: Index cho role-based queries

#### B. Course Collection

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  thumbnail: String (Cloudinary URL),
  teacherId: ObjectId (ref: User),
  category: Enum [...],
  level: Enum ['beginner', 'intermediate', 'advanced'],
  price: Number,
  enrolledStudents: [ObjectId] (ref: User),
  totalLessons: Number,
  totalDuration: Number (minutes),
  rating: Number,
  reviewCount: Number,
  isPublished: Boolean,
  approvalStatus: Enum ['pending', 'approved', 'rejected'],
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- `teacherId`: For teacher's courses
- `category`: For filtering
- `enrolledStudents`: For enrollment checks
- `isPublished`, `approvalStatus`: Compound index

#### C. Chapter Collection

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: Course),
  title: String,
  description: String,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### D. Lesson Collection

```javascript
{
  _id: ObjectId,
  chapterId: ObjectId (ref: Chapter),
  title: String,
  content: String (HTML),
  videoUrl: String (Cloudinary),
  videoDuration: Number (seconds),
  resources: [{
    name: String,
    url: String,
    type: Enum ['pdf', 'ppt', 'doc', 'image', 'link', 'video']
  }],
  order: Number,
  isPreview: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### E. Quiz Collection

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: Course),
  lessonId: ObjectId (ref: Lesson),
  title: String,
  duration: Number (minutes),
  passingScore: Number,
  attemptsAllowed: Number,
  isPublished: Boolean,
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### F. Question Collection

```javascript
{
  _id: ObjectId,
  quizId: ObjectId (ref: Quiz),
  questionText: String,
  questionType: Enum ['multiple-choice', 'true-false'],
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  explanation: String,
  points: Number,
  order: Number,
  createdAt: Date
}
```

#### G. Progress Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  completedLessons: [ObjectId] (ref: Lesson),
  completedQuizzes: [{
    quizId: ObjectId,
    score: Number,
    attemptDate: Date
  }],
  progressPercentage: Number,
  lastAccessedAt: Date,
  enrolledAt: Date,
  completedAt: Date
}
```

**Indexes**:

- Compound index: `{userId: 1, courseId: 1}` (unique)

#### H. Discussion Collection

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: Course),
  lessonId: ObjectId (ref: Lesson, optional),
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  isPinned: Boolean,
  likes: [ObjectId] (ref: User),
  views: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### I. Comment Collection

```javascript
{
  _id: ObjectId,
  discussionId: ObjectId (ref: Discussion),
  userId: ObjectId (ref: User),
  content: String,
  parentId: ObjectId (ref: Comment, optional),
  likes: [ObjectId] (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**[ẢNH: Diagram chi tiết về relationships giữa Course → Chapter → Lesson → Quiz → Question]**

### 2.4 Thiết kế giao diện người dùng

### 2.4.1 Design Principles

**A. Nguyên tắc thiết kế:**

- **Simplicity**: Giao diện đơn giản, dễ hiểu
- **Consistency**: Thống nhất về colors, typography, components
- **Responsiveness**: Hoạt động tốt trên mọi thiết bị
- **Accessibility**: Hỗ trợ keyboard navigation, screen readers
- **Performance**: Fast loading, lazy loading cho images/videos

**B. Design System:**

- **Colors**:
  - Primary: #4F46E5 (Indigo)
  - Secondary: #10B981 (Green)
  - Danger: #EF4444 (Red)
  - Neutral: Grays scale
- **Typography**: Inter font family
- **Spacing**: 8px base unit
- **Components**: Reusable React components

**[ẢNH: Design system guide với color palette, typography scale, spacing system, và component library]**

### 2.4.2 Wireframes và Mockups

**A. Student Interface:**

**Homepage:**

- Hero section với search bar
- Featured courses carousel
- Course categories grid
- Testimonials
- Footer với links

**[ẢNH: Wireframe của Homepage với annotations]**

**Course Listing Page:**

- Filters sidebar (category, level, price)
- Course cards grid
- Pagination
- Search và sort options

**[ẢNH: Wireframe của Course Listing Page]**

**Course Detail Page:**

- Course header (title, thumbnail, teacher, rating)
- Tabs: Overview, Curriculum, Discussions, Reviews
- Enroll button
- Related courses

**[ẢNH: Wireframe của Course Detail Page]**

**Lesson Player:**

- Video player (full width)
- Lesson navigation sidebar
- Content area với rich text
- Resources downloads
- Discussion section below

**[ẢNH: Wireframe của Lesson Player interface]**

**B. Teacher Interface:**

**Teacher Dashboard:**

- Analytics cards (students, courses, revenue)
- Charts (enrollment over time, course performance)
- Recent activities feed
- Quick actions

**[ẢNH: Wireframe của Teacher Dashboard]**

**Course Management:**

- Course list với status badges
- Create new course button
- Edit/Delete actions
- Analytics link

**Course Editor:**

- Course info form
- Chapter/Lesson tree view
- Drag-and-drop reordering
- Add content buttons

**[ẢNH: Wireframe của Course Editor với chapter/lesson tree]**

**C. Admin Interface:**

**Admin Dashboard:**

- System metrics
- User statistics
- Course approval queue
- Live activities feed

**[ẢNH: Wireframe của Admin Dashboard]**

**User Management:**

- Users table với filters
- Role change dropdown
- Ban/Delete actions
- Teacher approval section

**[ẢNH: Wireframe của User Management interface]**

### 2.4.3 Responsive Design

**Breakpoints:**

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**[ẢNH: Side-by-side comparison của cùng một screen trên Mobile, Tablet, và Desktop]**

---

**Kết luận phần 2:**

Phần phân tích và thiết kế đã trình bày chi tiết các yêu cầu chức năng và phi chức năng của hệ thống, cùng với kiến trúc 3-tier, cơ chế giao tiếp REST API và Socket.IO cho real-time features. Database được thiết kế với MongoDB schema tối ưu cho các collections chính. Giao diện người dùng tuân theo design principles và có wireframes rõ ràng cho từng vai trò, đảm bảo UX tốt trên mọi thiết bị.
