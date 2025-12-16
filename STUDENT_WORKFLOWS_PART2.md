# 📚 STUDENT WORKFLOWS - PHẦN 2: CHI TIẾT

> **Mô tả chi tiết các workflow của Student (Phần 2/2)**
>
> **Bao gồm:** Discussions, Live Sessions, Notifications, Analytics

---

## 6. DISCUSSIONS & COMMUNITY

### 6.1. Workflow Xem danh sách discussions trong khóa học

**Mục đích:** Student xem tất cả các bài thảo luận trong một khóa học

**Các bước:**

1. Student ở trang course detail, click tab "Discussions" hoặc "Forum"
2. Frontend gửi **GET /api/discussions/course/{courseId}** với query params:
   - page: số trang (default: 1)
   - limit: số discussions mỗi trang (default: 10)
   - sort: "recent", "popular", "unanswered" (optional)
3. Backend xử lý:
   - Tìm course trong **collection courses** để validate courseId tồn tại
   - Query **collection discussions** với:
     - courseId = courseId
     - Sort theo:
       - recent: createdAt desc
       - popular: likeCount desc, commentCount desc
       - unanswered: commentCount = 0, createdAt desc
   - Populate author từ **collection users** (lấy \_id, fullName, avatar, role)
   - Áp dụng pagination
4. Backend trả về response:
   - success: true
   - discussions: array of discussion objects, mỗi object:
     - \_id, courseId
     - author: { \_id, fullName, avatar, role (student/teacher) }
     - title, content (có thể truncate để preview)
     - isPinned: true/false (discussions được pin bởi teacher)
     - likeCount: số lượt like
     - commentCount: số comments
     - createdAt, updatedAt
     - lastCommentAt: timestamp của comment mới nhất (nếu có)
   - pagination: { page, limit, total, totalPages }
5. Frontend hiển thị:
   - List discussions dạng cards hoặc table
   - Pinned discussions ở đầu với badge "📌 Pinned"
   - Mỗi discussion hiển thị:
     - Avatar và tên author
     - Title (clickable)
     - Preview content (first 150 chars)
     - Stats: 👍 X likes, 💬 Y comments
     - Time: "2 hours ago", "3 days ago"
   - "Create Discussion" button
   - Sort/filter options

**Collections liên quan:**

- **discussions** (SELECT): Lấy danh sách discussions
- **courses** (SELECT): Validate courseId
- **users** (SELECT): Populate author info

---

### 6.2. Workflow Xem chi tiết một discussion

**Mục đích:** Student xem nội dung đầy đủ của một discussion và các comments

**Các bước:**

1. Student click vào một discussion từ list
2. Frontend gửi **GET /api/discussions/{discussionId}**
3. Backend xử lý:
   - Tìm discussion trong **collection discussions** theo \_id
   - Populate author từ **collection users**
   - Populate courseId để lấy course title
   - Query comments từ **collection comments** với:
     - discussionId = discussionId
     - Populate author cho mỗi comment
     - Load comments hierarchy (parent-child relationships)
     - Sort theo createdAt asc (oldest first)
   - Nếu student đã login:
     - Kiểm tra student đã like discussion chưa (userId có trong discussion.likes array)
     - Kiểm tra student đã like comments nào (userId trong comment.likes)
4. Backend trả về response:
   - success: true
   - discussion: object chứa:
     - \_id, courseId: { \_id, title }
     - author: { \_id, fullName, avatar, role }
     - title, content (full text)
     - isPinned, likeCount, commentCount
     - likes: array of userIds (hoặc chỉ isLikedByCurrentUser: true/false)
     - createdAt, updatedAt
   - comments: array of comment objects (nested or flat with parentId):
     - \_id, discussionId, parentId (null nếu top-level)
     - author: { \_id, fullName, avatar, role }
     - content
     - likeCount
     - isLikedByCurrentUser: true/false
     - createdAt, updatedAt
     - replies: array of child comments (nếu nested structure)
5. Frontend hiển thị:
   - Discussion header: title, author info, timestamp
   - Discussion content (full text với markdown rendering)
   - Like button với count: "👍 120 likes"
   - Stats: "💬 45 comments"
   - Pinned badge (nếu isPinned)
   - Edit/Delete buttons (nếu là author)
   - Comment section:
     - List comments với threading (parent-child)
     - Comment form để thêm comment mới
     - Like button trên mỗi comment
     - Reply button để trả lời comment

**Collections liên quan:**

- **discussions** (SELECT): Lấy discussion detail
- **comments** (SELECT): Lấy tất cả comments
- **users** (SELECT): Populate authors
- **courses** (SELECT): Lấy course title

---

### 6.3. Workflow Tạo discussion mới

**Mục đích:** Student tạo một bài thảo luận mới trong khóa học

**Các bước:**

1. Student ở trang discussions list, click "Create New Discussion" hoặc "Ask Question"
2. Frontend hiển thị form modal hoặc trang mới với fields:
   - Title (required)
   - Content/Body (required, có thể là rich text editor)
3. Student điền thông tin và click "Post" hoặc "Create Discussion"
4. Frontend validate:
   - Title không rỗng, length >= 10 chars
   - Content không rỗng, length >= 20 chars
5. Frontend gửi **POST /api/discussions** với body:
   - courseId: ID của khóa học
   - title: tiêu đề
   - content: nội dung
   - (Yêu cầu Bearer Token)
6. Backend xử lý:
   - Lấy userId từ JWT token
   - Validate dữ liệu đầu vào
   - Kiểm tra student đã enroll course (userId trong course.enrolledStudents hoặc check role)
   - Kiểm tra student không bị ban
   - Tạo document mới trong **collection discussions** với:
     - courseId, author: userId
     - title, content
     - isPinned: false
     - likes: [] (empty array)
     - likeCount: 0
     - commentCount: 0
     - createdAt, updatedAt: timestamp
   - (Optional) Tạo notification cho teacher của course trong **collection notifications**
   - (Optional) Log activity trong **collection analytics**
7. Backend trả về response:
   - success: true
   - discussion: object chứa discussion vừa tạo (populated author)
8. Frontend:
   - Đóng form/modal
   - Redirect đến discussion detail page hoặc refresh discussions list
   - Hiển thị thông báo "Discussion created successfully"
   - Add discussion mới vào đầu list (optimistic UI update)

**Collections liên quan:**

- **discussions** (INSERT): Tạo discussion mới
- **courses** (SELECT): Validate enrollment
- **notifications** (INSERT): Thông báo cho teacher
- **analytics** (INSERT): Log activity

**Socket Event:** Emit `discussion:new` để real-time update cho users khác đang xem

---

### 6.4. Workflow Cập nhật discussion của mình

**Mục đích:** Student chỉnh sửa discussion mà mình đã tạo

**Các bước:**

1. Student ở trang discussion detail (discussion mà mình tạo), click "Edit"
2. Frontend hiển thị form với title và content được pre-fill
3. Student chỉnh sửa title hoặc content
4. Student click "Save" hoặc "Update"
5. Frontend gửi **PUT /api/discussions/{discussionId}** với body:
   - title: tiêu đề mới (optional)
   - content: nội dung mới (optional)
   - (Yêu cầu Bearer Token)
6. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm discussion trong **collection discussions** theo \_id
   - Kiểm tra discussion.author = userId (chỉ author mới được edit)
   - Validate dữ liệu mới
   - Cập nhật fields trong discussion document:
     - title (nếu có)
     - content (nếu có)
     - updatedAt: timestamp hiện tại
     - (Optional) isEdited: true (để hiển thị "edited" badge)
7. Backend trả về response:
   - success: true
   - discussion: object chứa discussion đã update
8. Frontend:
   - Update UI ngay lập tức với nội dung mới
   - Hiển thị badge "Edited" hoặc "Last edited X minutes ago"
   - Hiển thị thông báo "Discussion updated successfully"

**Collections liên quan:**

- **discussions** (SELECT, UPDATE): Kiểm tra ownership và update

**Note:** Có thể có time limit để edit (ví dụ: chỉ edit được trong 24h sau khi tạo)

---

### 6.5. Workflow Xóa discussion của mình

**Mục đích:** Student xóa discussion mà mình đã tạo

**Các bước:**

1. Student ở trang discussion detail, click "Delete"
2. Frontend hiển thị confirmation dialog: "Are you sure you want to delete this discussion? This action cannot be undone."
3. Student confirm
4. Frontend gửi **DELETE /api/discussions/{discussionId}** (yêu cầu Bearer Token)
5. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm discussion trong **collection discussions**
   - Kiểm tra discussion.author = userId hoặc user.role = "admin" (chỉ author hoặc admin được delete)
   - Xóa discussion document từ **collection discussions**
   - Xóa tất cả comments liên quan từ **collection comments** (discussionId = discussionId)
   - (Optional) Xóa notifications liên quan từ **collection notifications**
6. Backend trả về response:
   - success: true
   - message: "Discussion deleted successfully"
7. Frontend:
   - Redirect về discussions list của course
   - Hiển thị thông báo "Discussion deleted"
   - Remove discussion khỏi list (nếu ở list page)

**Collections liên quan:**

- **discussions** (SELECT, DELETE): Kiểm tra ownership và xóa
- **comments** (DELETE): Xóa tất cả comments
- **notifications** (DELETE): Xóa notifications liên quan

**Socket Event:** Emit `discussion:deleted` để real-time update

---

### 6.6. Workflow Like/Unlike discussion

**Mục đích:** Student like hoặc unlike một discussion để thể hiện support

**Các bước:**

1. Student ở trang discussion detail, click nút "👍 Like" hoặc "Unlike" (nếu đã like)
2. Frontend gửi **PUT /api/discussions/{discussionId}/like** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm discussion trong **collection discussions**
   - Kiểm tra userId có trong array discussion.likes không:
     - Nếu có (đã like): Remove userId khỏi likes array, giảm likeCount
     - Nếu không có (chưa like): Add userId vào likes array, tăng likeCount
   - Cập nhật discussion document
   - Nếu like mới (không phải unlike):
     - Tạo notification cho author trong **collection notifications** (trừ khi author = userId)
4. Backend trả về response:
   - success: true
   - isLiked: true/false (trạng thái mới)
   - likeCount: số lượt like mới
5. Frontend:
   - Toggle button state: "Unlike" ↔ "Like"
   - Update like count: "👍 121 likes"
   - Animation hiệu ứng like
   - (Optional) Optimistic UI update

**Collections liên quan:**

- **discussions** (UPDATE): Toggle userId trong likes array, update likeCount
- **notifications** (INSERT): Thông báo cho author

**Socket Event:** Emit `discussion:liked` để real-time update like count

**Note:** Backend phải đảm bảo atomic operation để tránh race condition

---

### 6.7. Workflow Comment vào discussion

**Mục đích:** Student thêm comment vào một discussion

**Các bước:**

1. Student ở trang discussion detail, scroll đến comment section
2. Student nhập nội dung vào comment textarea
3. (Optional) Nếu reply comment khác, click "Reply" trên comment đó trước
4. Student click "Post Comment" hoặc "Reply"
5. Frontend gửi **POST /api/discussions/{discussionId}/comment** với body:
   - content: nội dung comment
   - parentId: \_id của comment cha (null nếu top-level comment)
   - (Yêu cầu Bearer Token)
6. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm discussion trong **collection discussions** để validate tồn tại
   - Validate content không rỗng, length >= 5 chars
   - Tạo document mới trong **collection comments** với:
     - discussionId, author: userId
     - content, parentId (null hoặc commentId)
     - likes: []
     - likeCount: 0
     - createdAt, updatedAt
   - Tăng commentCount trong **collection discussions**
   - Cập nhật lastCommentAt trong discussion
   - Tạo notification:
     - Cho author của discussion (nếu khác userId)
     - Cho author của parent comment (nếu là reply và khác userId)
   - Trong **collection notifications**
7. Backend trả về response:
   - success: true
   - comment: object chứa comment vừa tạo (populated author):
     - \_id, discussionId, parentId
     - author: { \_id, fullName, avatar, role }
     - content, likeCount
     - createdAt
8. Frontend:
   - Add comment mới vào list (top hoặc cuối tùy sort)
   - Clear textarea
   - Scroll đến comment vừa tạo
   - Update comment count trong header
   - Hiển thị notification "Comment posted"
   - (Optional) Highlight comment mới vài giây

**Collections liên quan:**

- **comments** (INSERT): Tạo comment mới
- **discussions** (UPDATE): Tăng commentCount, update lastCommentAt
- **notifications** (INSERT): Thông báo cho discussion author và parent comment author
- **users** (SELECT): Populate author

**Socket Event:** Emit `comment:new` để real-time update cho users đang xem

---

### 6.8. Workflow Cập nhật comment của mình

**Mục đích:** Student chỉnh sửa comment mà mình đã post

**Các bước:**

1. Student thấy comment của mình, click "Edit" trên comment
2. Frontend hiển thị textarea với content được pre-fill, hoặc inline edit
3. Student chỉnh sửa content
4. Student click "Save" hoặc "Update"
5. Frontend gửi **PUT /api/comments/{commentId}** với body:
   - content: nội dung mới
   - (Yêu cầu Bearer Token)
6. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm comment trong **collection comments** theo \_id
   - Kiểm tra comment.author = userId (chỉ author được edit)
   - Validate content mới
   - Cập nhật comment document:
     - content: nội dung mới
     - updatedAt: timestamp
     - isEdited: true
7. Backend trả về response:
   - success: true
   - comment: object chứa comment đã update
8. Frontend:
   - Update content trong UI ngay lập tức
   - Hiển thị badge "(edited)" hoặc "Edited X minutes ago"
   - Exit edit mode, show normal comment view

**Collections liên quan:**

- **comments** (SELECT, UPDATE): Kiểm tra ownership và update

**Note:** Có thể limit thời gian edit (ví dụ: trong 15 phút)

---

### 6.9. Workflow Xóa comment của mình

**Mục đích:** Student xóa comment mà mình đã post

**Các bước:**

1. Student thấy comment của mình, click "Delete"
2. Frontend hiển thị confirmation: "Delete this comment?"
3. Student confirm
4. Frontend gửi **DELETE /api/comments/{commentId}** (yêu cầu Bearer Token)
5. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm comment trong **collection comments**
   - Kiểm tra comment.author = userId hoặc user.role = "admin"
   - Xử lý theo hai cách:
     - **Soft delete**: Set comment.isDeleted = true, content = "[Deleted]"
     - **Hard delete**: Xóa comment document (nếu không có replies)
   - Nếu comment có replies (children):
     - Nên giữ lại với soft delete để preserve thread structure
     - Content thay bằng "[This comment has been deleted]"
   - Giảm commentCount trong **collection discussions**
   - Nếu hard delete và có parentId:
     - Có thể cần update parent comment's reply count
6. Backend trả về response:
   - success: true
   - message: "Comment deleted successfully"
7. Frontend:
   - Remove comment khỏi UI hoặc replace với "[Deleted]" text
   - Update comment count
   - Hiển thị notification "Comment deleted"

**Collections liên quan:**

- **comments** (SELECT, UPDATE/DELETE): Xóa hoặc soft delete
- **discussions** (UPDATE): Giảm commentCount

**Note:** Nếu comment có replies, nên soft delete để giữ context

---

### 6.10. Workflow Like/Unlike comment

**Mục đích:** Student like một comment

**Các bước:**

1. Student click nút "👍" trên một comment
2. Frontend gửi **PUT /api/comments/{commentId}/like** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm comment trong **collection comments**
   - Kiểm tra userId trong comment.likes array:
     - Nếu có: Remove và giảm likeCount (unlike)
     - Nếu không: Add và tăng likeCount (like)
   - Cập nhật comment document
   - Nếu like mới:
     - Tạo notification cho comment author trong **collection notifications**
4. Backend trả về response:
   - success: true
   - isLiked: true/false
   - likeCount: số likes mới
5. Frontend:
   - Toggle like button state
   - Update like count display
   - Animation effect

**Collections liên quan:**

- **comments** (UPDATE): Toggle like
- **notifications** (INSERT): Thông báo cho author

**Socket Event:** Có thể emit `comment:liked` cho real-time update

---

## 7. LIVE SESSIONS

### 7.1. Workflow Xem danh sách live sessions theo khóa học

**Mục đích:** Student xem các buổi học trực tuyến của một khóa học

**Các bước:**

1. Student ở trang course detail, click tab "Live Sessions" hoặc "Upcoming Sessions"
2. Frontend gửi **GET /api/sessions/course/{courseId}** với query params:
   - status: "scheduled", "live", "ended" (optional filter)
   - page, limit (pagination)
3. Backend xử lý:
   - Tìm course để validate
   - Query **collection liveSessions** với:
     - courseId = courseId
     - Sort theo scheduledAt asc (sắp diễn ra trước)
   - Filter theo status nếu có
   - Populate teacherId từ **collection users**
4. Backend trả về response:
   - success: true
   - sessions: array of session objects:
     - \_id, courseId
     - teacherId: { \_id, fullName, avatar }
     - title, description
     - scheduledAt: timestamp
     - duration: phút
     - status: "scheduled", "live", "ended", "cancelled"
     - participants: array of userIds (hoặc count)
     - recordingUrl: URL (nếu đã record và ended)
     - meetingLink: URL hoặc roomId (nếu scheduled/live)
   - pagination: { page, limit, total, totalPages }
5. Frontend hiển thị:
   - Tabs hoặc filters: "Upcoming", "Live Now", "Past"
   - List sessions với cards:
     - Title, description
     - Teacher info
     - Date & time: "Tomorrow at 10:00 AM", "In 2 hours"
     - Duration: "60 minutes"
     - Status badge: "🔴 Live", "📅 Scheduled", "✅ Ended"
     - Participant count: "45 students joined"
     - "Join Session" button (nếu live hoặc sắp bắt đầu)
     - "Watch Recording" button (nếu ended và có recording)
   - Calendar view option (optional)

**Collections liên quan:**

- **liveSessions** (SELECT): Lấy danh sách sessions
- **courses** (SELECT): Validate courseId
- **users** (SELECT): Populate teacher info

---

### 7.2. Workflow Xem chi tiết live session

**Mục đích:** Student xem thông tin chi tiết của một session

**Các bước:**

1. Student click vào một session từ list
2. Frontend gửi **GET /api/sessions/{sessionId}**
3. Backend xử lý:
   - Tìm session trong **collection liveSessions** theo \_id
   - Populate teacherId và courseId
   - Lấy số participants (count hoặc populate)
   - Nếu student đã login:
     - Kiểm tra student đã join chưa (userId trong session.participants)
4. Backend trả về response:
   - success: true
   - session: object chứa:
     - \_id, courseId: { \_id, title }
     - teacherId: { \_id, fullName, avatar, email }
     - title, description
     - scheduledAt, duration, status
     - participants: count hoặc array
     - recordingUrl (nếu có)
     - meetingLink hoặc roomId
     - isJoined: true/false (nếu student đã login)
     - createdAt, updatedAt
5. Frontend hiển thị:
   - Session header: title, teacher, course
   - Status indicator với color coding
   - Schedule info: date, time, duration
   - Description (full text)
   - Participants count: "45 students enrolled"
   - Action buttons:
     - "Join Session" (nếu live hoặc sắp bắt đầu trong 10 phút)
     - "Set Reminder" (nếu scheduled)
     - "Watch Recording" (nếu ended và có recording)
     - "Add to Calendar" (export .ics file)

**Collections liên quan:**

- **liveSessions** (SELECT): Lấy session detail
- **courses** (SELECT): Lấy course info
- **users** (SELECT): Lấy teacher info

---

### 7.3. Workflow Tham gia live session (Join Session)

**Mục đích:** Student tham gia buổi học trực tuyến đang diễn ra

**Các bước:**

1. Student ở trang session detail hoặc list, click "Join Session"
2. Frontend kiểm tra:
   - Session status = "live" hoặc scheduledAt trong vòng 10 phút tới
   - Student đã enroll course
   - Browser hỗ trợ WebRTC (camera, mic permissions)
3. Frontend gửi **POST /api/sessions/{sessionId}/join** (yêu cầu Bearer Token)
4. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm session trong **collection liveSessions**
   - Kiểm tra:
     - Session status = "live" hoặc sắp bắt đầu
     - Student đã enroll course của session
     - Student chưa có trong participants array (avoid duplicate)
   - Thêm userId vào session.participants array
   - Update participant count
   - Tạo session token hoặc credentials cho student
5. Backend trả về response:
   - success: true
   - sessionData: {
     sessionId, roomId,
     iceServers: array of STUN/TURN servers cho WebRTC,
     token: session access token,
     teacherId, participants: list of current participants
     }
6. Frontend:
   - Redirect đến video room page (/session/{sessionId})
   - Initialize WebRTC connection (workflow 7.4)
   - Yêu cầu quyền camera và microphone
   - Connect đến session room qua Socket.IO
   - Display video interface

**Collections liên quan:**

- **liveSessions** (SELECT, UPDATE): Kiểm tra session và add participant
- **courses** (SELECT): Validate enrollment
- **users** (SELECT): Lấy user info

**Socket Event:** Emit `session:join` với userId để notify teacher và participants khác

---

### 7.4. Workflow Kết nối WebRTC cho video call

**Mục đích:** Thiết lập kết nối peer-to-peer video/audio

**Các bước:**

1. Sau khi join session (workflow 7.3), frontend khởi tạo WebRTC
2. Frontend yêu cầu quyền:
   - navigator.mediaDevices.getUserMedia({ video: true, audio: true })
   - User accept camera và mic permissions
3. Frontend nhận local media stream (video + audio)
4. Frontend establish Socket.IO connection:
   - Connect đến `/sessions` namespace
   - Emit event `session:join` với { sessionId, userId, userName }
5. Backend (Socket.IO server) xử lý:
   - Validate session và user
   - Add user socket vào room: socket.join(sessionId)
   - Emit `user:joined` đến tất cả users trong room với user info
6. Frontend nhận events:
   - `user:joined`: User khác join → tạo peer connection mới
   - `webrtc:offer`: Nhận offer từ peer → tạo answer
   - `webrtc:answer`: Nhận answer → complete connection
   - `webrtc:ice-candidate`: Exchange ICE candidates
7. Frontend thiết lập RTCPeerConnection cho mỗi peer:
   - Create new RTCPeerConnection với iceServers
   - Add local stream tracks
   - Generate offer hoặc answer
   - Send via Socket.IO: emit `webrtc:offer` hoặc `webrtc:answer`
   - Handle ice candidates: emit `webrtc:ice-candidate`
8. Khi connection established:
   - Nhận remote stream từ peer
   - Display remote video trong UI
9. Frontend maintain connections:
   - Monitor connection state
   - Handle disconnections và reconnections
   - Clean up on leave

**Collections liên quan:**

- **liveSessions** (SELECT): Validate session
- **users** (SELECT): Get user info

**Socket Events:**

- `session:join` - Student join room
- `user:joined` - Notify others
- `webrtc:offer`, `webrtc:answer` - SDP exchange
- `webrtc:ice-candidate` - ICE candidate exchange
- `session:leave` - Student leave

**External Services:**

- STUN/TURN servers cho NAT traversal

**Note:** WebRTC là peer-to-peer nhưng cần signaling server (Socket.IO) để exchange SDP và ICE

---

### 7.5. Workflow Tương tác trong session (camera, mic, screen share)

**Mục đích:** Student điều khiển audio/video và share màn hình trong session

#### 7.5.1. Toggle Camera (Video On/Off)

**Các bước:**

1. Student click nút "Camera" trong video controls
2. Frontend toggle video track:
   - localStream.getVideoTracks()[0].enabled = !enabled
3. Frontend cập nhật UI: icon "📷" ↔ "📷🚫"
4. (Optional) Frontend emit Socket event `media:toggle` với:
   - { sessionId, userId, type: "video", enabled: true/false }
5. Other participants nhận event và update UI để hiển thị "Camera off"

#### 7.5.2. Toggle Microphone (Audio On/Off)

**Các bước:**

1. Student click nút "Microphone"
2. Frontend toggle audio track:
   - localStream.getAudioTracks()[0].enabled = !enabled
3. Update icon: "🎤" ↔ "🎤🚫"
4. Emit `media:toggle` event với type: "audio"

#### 7.5.3. Screen Share

**Các bước:**

1. Student click "Share Screen" button
2. Frontend gọi:
   - displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
3. Frontend replace video track trong RTCPeerConnection:
   - Lấy video track từ displayStream
   - Replace trong tất cả peer connections
   - sender.replaceTrack(newVideoTrack)
4. Frontend emit event `screen:share:start` với { sessionId, userId }
5. Other participants nhận event:
   - Display screen share trong larger view
   - Show indicator "Student X is sharing screen"
6. Khi stop screen share:
   - Student click "Stop Sharing" hoặc browser dialog
   - Frontend revert về camera stream
   - Replace track lại với camera
   - Emit `screen:share:stop` event

#### 7.5.4. Raise Hand

**Các bước:**

1. Student click "✋ Raise Hand"
2. Frontend emit event `hand:raised` với { sessionId, userId, userName }
3. Backend broadcast event đến teacher và all participants
4. Frontend của teacher nhận và hiển thị notification
5. Teacher có thể click để acknowledge hoặc unmute student

#### 7.5.5. Chat Message trong Session

**Các bước:**

1. Student nhập message trong chat box
2. Student press Enter hoặc click Send
3. Frontend emit event `chat:message` với:
   - { sessionId, userId, userName, message, timestamp }
4. Backend broadcast đến tất cả participants trong room
5. Frontend nhận và append message vào chat list

**Collections liên quan:**

- **liveSessions** (UPDATE): Có thể log activities
- (Optional) **sessionChats**: Lưu chat history

**Socket Events:**

- `media:toggle` - On/off camera/mic
- `screen:share:start`, `screen:share:stop` - Screen sharing
- `hand:raised`, `hand:lowered` - Raise hand
- `chat:message` - Chat trong session

**Note:** Tất cả interactions này real-time qua Socket.IO, không cần REST API calls

---

## 8. NOTIFICATIONS

### 8.1. Workflow Xem danh sách thông báo

**Mục đích:** Student xem tất cả thông báo của mình

**Các bước:**

1. Student click vào notification icon 🔔 trên header
2. Frontend gửi **GET /api/notifications** với query params:
   - page: 1
   - limit: 20
   - type: "course", "quiz", "discussion", "session", "system" (optional filter)
   - isRead: true/false (optional filter)
   - (Yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Query **collection notifications** với:
     - userId = userId
     - Sort theo createdAt desc (mới nhất trước)
   - Áp dụng filters nếu có
   - Áp dụng pagination
4. Backend trả về response:
   - success: true
   - notifications: array of notification objects:
     - \_id, userId
     - type: "course", "quiz", "discussion", "session", "system"
     - title: tiêu đề ngắn gọn
     - message: nội dung chi tiết
     - link: URL để redirect (ví dụ: /courses/123, /discussions/456)
     - isRead: true/false
     - createdAt
   - pagination: { page, limit, total, totalPages }
5. Frontend hiển thị:
   - Dropdown menu hoặc sidebar với list notifications
   - Mỗi notification có:
     - Icon theo type (📚 course, ❓ quiz, 💬 discussion, 🎥 session)
     - Title (bold nếu unread)
     - Message text
     - Time: "5 minutes ago", "2 hours ago"
     - Blue dot hoặc highlight nếu unread
   - Click vào notification:
     - Mark as read (workflow 8.3)
     - Navigate đến link
   - "Mark all as read" button
   - "Clear all" button

**Collections liên quan:**

- **notifications** (SELECT): Lấy danh sách notifications

---

### 8.2. Workflow Đếm số thông báo chưa đọc

**Mục đích:** Hiển thị badge số thông báo chưa đọc trên icon

**Các bước:**

1. Frontend định kỳ hoặc khi load page gửi **GET /api/notifications/unread-count** (yêu cầu Bearer Token)
2. Backend xử lý:
   - Lấy userId từ JWT token
   - Count documents trong **collection notifications** với:
     - userId = userId
     - isRead = false
3. Backend trả về response:
   - success: true
   - count: số thông báo chưa đọc (integer)
4. Frontend hiển thị:
   - Badge đỏ trên notification icon với số: 🔔(5)
   - Nếu count = 0, ẩn badge
   - Update real-time khi có notification mới

**Collections liên quan:**

- **notifications** (COUNT): Đếm unread notifications

**Socket Event:** Khi có notification mới, server emit `notification:new` đến user, frontend tự động increase count

---

### 8.3. Workflow Đánh dấu một thông báo đã đọc

**Mục đích:** Student đánh dấu một notification đã đọc khi xem

**Các bước:**

1. Student click vào một notification trong list
2. Frontend gửi **PUT /api/notifications/{notificationId}/read** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm notification trong **collection notifications** theo \_id
   - Kiểm tra notification.userId = userId (security)
   - Cập nhật:
     - isRead: true
     - readAt: timestamp hiện tại
4. Backend trả về response:
   - success: true
   - notification: object đã update
5. Frontend:
   - Remove blue dot hoặc unread indicator
   - Giảm unread count badge
   - Navigate đến notification.link

**Collections liên quan:**

- **notifications** (UPDATE): Set isRead = true

**Note:** Có thể auto-mark as read khi notification được hiển thị (seen) thay vì khi click

---

### 8.4. Workflow Đánh dấu tất cả thông báo đã đọc

**Mục đích:** Student đánh dấu tất cả notifications là đã đọc

**Các bước:**

1. Student click "Mark all as read" trong notification dropdown
2. Frontend gửi **PUT /api/notifications/read-all** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Update all documents trong **collection notifications** với:
     - userId = userId
     - isRead = false
   - Set isRead = true cho tất cả
4. Backend trả về response:
   - success: true
   - message: "All notifications marked as read"
   - updatedCount: số notifications đã update
5. Frontend:
   - Remove all unread indicators
   - Set unread count badge = 0
   - Update UI cho tất cả notifications

**Collections liên quan:**

- **notifications** (UPDATE MANY): Bulk update isRead

---

### 8.5. Workflow Xóa một thông báo

**Mục đích:** Student xóa một notification không cần thiết

**Các bước:**

1. Student hover/swipe một notification, click "Delete" hoặc "X"
2. Frontend gửi **DELETE /api/notifications/{notificationId}** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm notification trong **collection notifications**
   - Kiểm tra notification.userId = userId
   - Delete notification document
4. Backend trả về response:
   - success: true
   - message: "Notification deleted"
5. Frontend:
   - Remove notification khỏi list với animation
   - Update total count nếu cần

**Collections liên quan:**

- **notifications** (DELETE): Xóa notification

---

### 8.6. Workflow Xóa tất cả thông báo

**Mục đích:** Student xóa hết notifications để làm sạch

**Các bước:**

1. Student click "Clear all" hoặc "Delete all"
2. Frontend hiển thị confirmation: "Delete all notifications?"
3. Student confirm
4. Frontend gửi **DELETE /api/notifications** (yêu cầu Bearer Token)
5. Backend xử lý:
   - Lấy userId từ JWT token
   - Delete all documents trong **collection notifications** với userId = userId
6. Backend trả về response:
   - success: true
   - message: "All notifications deleted"
   - deletedCount: số notifications đã xóa
7. Frontend:
   - Clear notification list
   - Show empty state: "No notifications"
   - Set badge count = 0

**Collections liên quan:**

- **notifications** (DELETE MANY): Bulk delete

**Note:** Có thể có option để chỉ xóa notifications đã read

---

### 8.7. Workflow Xem cài đặt thông báo (Notification Preferences)

**Mục đích:** Student xem cấu hình nhận thông báo của mình

**Các bước:**

1. Student vào Settings → Notifications hoặc click "Notification Settings"
2. Frontend gửi **GET /api/notifications/preferences** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm user trong **collection users**
   - Lấy notification preferences từ user.notificationPreferences (embedded document hoặc separate collection)
4. Backend trả về response:
   - success: true
   - preferences: object chứa:
     - email: { courses: true/false, quizzes: true/false, discussions: true/false, sessions: true/false, system: true/false }
     - push: { courses: true/false, quizzes: true/false, discussions: true/false, sessions: true/false, system: true/false }
     - inApp: { courses: true/false, quizzes: true/false, discussions: true/false, sessions: true/false, system: true/false }
5. Frontend hiển thị:
   - Settings page với toggle switches
   - Sections theo loại notification:
     - Courses (enrollment, new lessons)
     - Quizzes (results, new quizzes)
     - Discussions (replies, mentions)
     - Live Sessions (reminders, started)
     - System (updates, announcements)
   - Toggle cho mỗi channel: Email, Push, In-App

**Collections liên quan:**

- **users** (SELECT): Lấy notification preferences

---

### 8.8. Workflow Cập nhật cài đặt thông báo

**Mục đích:** Student thay đổi preferences nhận thông báo

**Các bước:**

1. Student ở settings page, toggle switches để bật/tắt
2. Student click "Save" hoặc auto-save on change
3. Frontend gửi **PUT /api/notifications/preferences** với body:
   - email: { courses: true, quizzes: false, ... }
   - push: { ... }
   - inApp: { ... }
   - (Yêu cầu Bearer Token)
4. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm user trong **collection users**
   - Validate preferences structure
   - Cập nhật user.notificationPreferences với giá trị mới
5. Backend trả về response:
   - success: true
   - preferences: object đã update
   - message: "Preferences updated successfully"
6. Frontend:
   - Hiển thị thông báo "Settings saved"
   - Update local state

**Collections liên quan:**

- **users** (UPDATE): Cập nhật notification preferences

**Note:** Changes có hiệu lực ngay lập tức cho các notifications mới

---

## 9. ANALYTICS & PROGRESS TRACKING

### 9.1. Workflow Xem thống kê học tập cá nhân

**Mục đích:** Student xem overview về tiến độ học tập của mình

**Các bước:**

1. Student vào Dashboard hoặc Profile → Statistics
2. Frontend gửi **GET /api/analytics/student/{userId}** (yêu cầu Bearer Token)
   - userId có thể là "me" hoặc current user's ID
3. Backend xử lý:
   - Lấy userId từ JWT token (nếu param = "me", dùng userId từ token)
   - Query multiple collections để tính toán stats:
     - **users**: Lấy enrolledCourses array
     - **progress**: Aggregate progress của tất cả courses
     - **quizAttempts**: Aggregate quiz scores và pass rate
     - **discussions**: Count discussions và comments đã tạo
     - **liveSessions**: Count sessions đã tham gia
   - Tính toán:
     - totalCoursesEnrolled: length của enrolledCourses
     - coursesInProgress: courses với 0% < progress < 100%
     - coursesCompleted: courses với progress = 100%
     - totalLearningTime: sum tất cả watchedDuration (convert to hours)
     - averageQuizScore: average của tất cả quiz percentages
     - quizzesPassed: count quizzes với passed = true
     - totalQuizzesTaken: count tất cả quiz attempts
     - discussionsCreated: count discussions
     - commentsPosted: count comments
     - sessionsAttended: count session participations
     - certificatesEarned: count certificates (nếu có collection)
4. Backend trả về response:
   - success: true
   - analytics: object chứa:
     - overview:
       - totalCoursesEnrolled, coursesInProgress, coursesCompleted
       - completionRate: (coursesCompleted / totalCoursesEnrolled) \* 100
     - learning:
       - totalLearningTime: hours
       - averageDailyTime: hours (nếu track)
       - currentStreak: days (nếu track login streak)
     - assessment:
       - averageQuizScore: percentage
       - quizzesPassed, totalQuizzesTaken
       - passRate: (quizzesPassed / totalQuizzesTaken) \* 100
     - engagement:
       - discussionsCreated, commentsPosted
       - sessionsAttended
       - certificatesEarned
     - recentActivity: array of recent actions (last 10)
     - coursesProgress: array của top courses với progress
5. Frontend hiển thị:
   - Dashboard với cards/widgets:
     - "X Courses Enrolled"
     - "Y Hours Learned"
     - "Z% Average Score"
     - "A Certificates"
   - Progress charts:
     - Line chart: learning time over weeks
     - Bar chart: quiz scores
     - Pie chart: course completion distribution
   - Recent activity timeline
   - Top performing courses

**Collections liên quan:**

- **users** (SELECT): Lấy enrolledCourses
- **progress** (AGGREGATE): Tính learning time và completion
- **quizAttempts** (AGGREGATE): Tính quiz stats
- **discussions** (COUNT): Đếm discussions
- **comments** (COUNT): Đếm comments
- **liveSessions** (COUNT): Đếm session attendance
- **analytics** (SELECT): Lấy cached analytics nếu có

**Note:** Có thể cache kết quả trong **collection analytics** để tránh query nặng mỗi lần load

---

### 9.2. Workflow Xem báo cáo chi tiết của student

**Mục đích:** Student xem hoặc export báo cáo học tập chi tiết

**Các bước:**

1. Student ở analytics page, click "View Detailed Report" hoặc "Export Report"
2. Frontend gửi **GET /api/analytics/student-report/{userId}** với query params:
   - format: "json", "pdf", "csv" (optional)
   - dateRange: "last-month", "last-3-months", "all-time"
   - (Yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Generate comprehensive report với data từ:
     - **users**: User profile info
     - **courses**: Chi tiết các courses enrolled
     - **progress**: Progress breakdown per course, per lesson
     - **quizAttempts**: Chi tiết từng quiz attempt với scores
     - **discussions** & **comments**: Activity log
     - **liveSessions**: Session attendance records
   - Aggregate data theo time range
   - Generate report object hoặc file
4. Backend trả về response:
   - Nếu format = "json":
     - success: true
     - report: object chứa comprehensive data structure
   - Nếu format = "pdf":
     - Generate PDF file với charts và tables
     - Trả về file download hoặc URL
   - Nếu format = "csv":
     - Generate CSV với rows của data points
     - Trả về file download
5. Report structure (JSON):
   - studentInfo: { fullName, email, enrolledDate }
   - summary: { totalCourses, completedCourses, totalHours, avgScore }
   - coursesDetail: array of {
     courseName, enrolledDate, progress, completedLessons, totalLessons,
     quizResults: array of quiz scores,
     lastAccessedDate
     }
   - quizPerformance: array of {
     quizTitle, courseName, attemptDate, score, passed
     }
   - engagementMetrics: {
     discussionsCreated, commentsPosted, likesReceived,
     sessionsAttended, avgSessionDuration
     }
   - timeDistribution: {
     byDay: array of { date, minutesLearned },
     byWeek: array of { week, hoursLearned },
     byCourse: array of { courseName, hoursSpent }
     }
   - achievements: array of certificates và badges (nếu có)
6. Frontend:
   - Nếu JSON: Hiển thị detailed report page với sections
   - Nếu PDF/CSV: Trigger file download
   - Có thể preview trước khi download
   - Hiển thị generation date và disclaimer

**Collections liên quan:**

- **users** (SELECT)
- **courses** (SELECT)
- **progress** (AGGREGATE)
- **quizAttempts** (AGGREGATE)
- **discussions** (SELECT)
- **comments** (SELECT)
- **liveSessions** (SELECT)
- **analytics** (SELECT/INSERT): Cache report nếu expensive

**External Services:**

- PDF generation library (nếu format = PDF)
- Email service (nếu gửi report qua email)

**Note:** Report generation có thể mất thời gian, có thể implement async với notification khi ready

---

**KẾT THÚC PHẦN 2**

**Đã hoàn thành mô tả chi tiết:**

- ✅ 6. Discussions & Community (10 workflows)
- ✅ 7. Live Sessions (5 workflows)
- ✅ 8. Notifications (8 workflows)
- ✅ 9. Analytics & Progress Tracking (2 workflows)

**Tổng cộng Phần 2: 25 workflows đã được mô tả chi tiết**

---

## 📊 TỔNG KẾT TOÀN BỘ STUDENT WORKFLOWS

**Tổng cộng: 56 workflows đã được mô tả chi tiết đầy đủ**

### Phân nhóm:

1. ✅ Authentication & Account Management: 8 workflows
2. ✅ Profile Management: 3 workflows
3. ✅ Course Discovery & Enrollment: 8 workflows
4. ✅ Learning - Lessons & Content: 7 workflows
5. ✅ Quizzes & Assessment: 5 workflows
6. ✅ Discussions & Community: 10 workflows
7. ✅ Live Sessions: 5 workflows
8. ✅ Notifications: 8 workflows
9. ✅ Analytics & Progress Tracking: 2 workflows

### Collections Database sử dụng:

- users, userProfiles
- courses, chapters, lessons, media
- progress, quizzes, questions, quizAttempts
- discussions, comments
- liveSessions
- notifications
- analytics

### Socket.IO Events:

- Real-time notifications
- Discussion updates
- Live session interactions
- WebRTC signaling

---

**Tất cả workflows đều mô tả:**

- ✅ API endpoints cụ thể
- ✅ Request/Response data structure
- ✅ Collections DB được tác động
- ✅ Frontend behavior
- ✅ Security checks
- ✅ Real-time events (nếu có)
- ✅ Error handling considerations
