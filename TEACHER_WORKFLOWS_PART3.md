# 📚 TEACHER WORKFLOWS - PHẦN 3/3

> **Phần 3 (Cuối):** Quản lý Live Sessions, Quản lý Thông báo, Quản lý Analytics & Báo cáo, Theo dõi Tiến độ

---

## 7. QUẢN LÝ LIVE SESSIONS

### 7.1. Workflow Tạo Live Session Cho Khóa Học

**Mô tả:** Teacher tạo buổi học trực tuyến (live session) cho khóa học.

**API Endpoint:** `POST /api/sessions`

**Quy trình:**

1. Teacher vào trang quản lý khóa học và chọn "Tạo buổi học trực tuyến"
2. Điền form với thông tin:
   - courseId (khóa học)
   - title (tiêu đề buổi học)
   - description (mô tả)
   - scheduledAt (thời gian bắt đầu dự kiến)
   - duration (thời lượng, đơn vị: phút)
3. Gửi request POST đến `/api/sessions` kèm JWT token và dữ liệu
4. Hệ thống xác thực token
5. Kiểm tra user có role='teacher' hoặc 'admin'
6. Validate courseId và kiểm tra teacher là owner của course
7. Validate scheduledAt phải là thời điểm trong tương lai
8. Validate duration > 0
9. Tạo document mới trong collection **liveSessions** với:
   - courseId
   - hostId (userId của teacher)
   - title, description
   - scheduledAt, duration
   - status='scheduled' (mặc định)
   - participants (array rỗng)
   - recordingUrl (null)
   - createdAt, updatedAt
10. Gửi notification cho tất cả enrolled students về session mới
11. Có thể tạo calendar event hoặc reminder
12. Trả về thông tin session với sessionId

**Collections sử dụng:**

- `liveSessions` - Tạo document mới
- `courses` - Verify ownership
- `users` - Lấy danh sách enrolled students
- `progress` - Lấy enrolled students từ progress records
- `notifications` - Gửi thông báo cho students

---

### 7.2. Workflow Xem Danh Sách Sessions Của Teacher

**Mô tả:** Teacher xem tất cả các live sessions do mình tổ chức.

**API Endpoint:** `GET /api/sessions/my-sessions`

**Quy trình:**

1. Teacher truy cập trang "Live Sessions của tôi"
2. Gửi request GET đến `/api/sessions/my-sessions` kèm JWT token và query params (page, limit)
3. Hệ thống xác thực token
4. Kiểm tra role='teacher' hoặc 'admin'
5. Truy vấn collection **liveSessions** với filter `hostId=userId`
6. Có thể filter theo status: scheduled, live, ended, cancelled
7. Sort theo scheduledAt (sắp xếp theo thời gian)
8. Populate thông tin course từ collection **courses**
9. Đếm số participants cho mỗi session
10. Áp dụng pagination
11. Trả về danh sách sessions với metadata (total, page, limit)

**Collections sử dụng:**

- `liveSessions` - Đọc sessions với filter hostId
- `courses` - Populate thông tin course
- `users` - Populate host info

---

### 7.3. Workflow Xem Chi Tiết Session

**Mô tả:** Teacher hoặc student xem thông tin chi tiết của một live session.

**API Endpoint:** `GET /api/sessions/:id`

**Quy trình:**

1. User click vào session để xem chi tiết
2. Gửi request GET đến `/api/sessions/:id`
3. Không bắt buộc authentication nhưng khuyến nghị có
4. Validate sessionId
5. Tìm session trong collection **liveSessions**
6. Populate thông tin host từ collection **users**
7. Populate thông tin course từ collection **courses**
8. Nếu user authenticated, kiểm tra:
   - User đã enroll course chưa
   - User có trong danh sách participants chưa
9. Lấy số lượng participants hiện tại
10. Trả về thông tin session: title, description, scheduledAt, duration, status, host, course, participantCount, recordingUrl (nếu ended)

**Collections sử dụng:**

- `liveSessions` - Đọc thông tin session
- `users` - Populate host info
- `courses` - Populate course info và verify enrollment

---

### 7.4. Workflow Cập Nhật Thông Tin Session

**Mô tả:** Teacher cập nhật thông tin của live session.

**API Endpoint:** `PUT /api/sessions/:id`

**Quy trình:**

1. Teacher vào trang chỉnh sửa session
2. Cập nhật các thông tin: title, description, scheduledAt, duration
3. Gửi request PUT đến `/api/sessions/:id` kèm JWT token và dữ liệu
4. Hệ thống xác thực token
5. Validate sessionId và dữ liệu
6. Tìm session trong collection **liveSessions**
7. Kiểm tra user là host của session (hostId=userId)
8. Kiểm tra session chưa bắt đầu hoặc chưa kết thúc (status='scheduled')
9. Validate scheduledAt mới phải trong tương lai
10. Cập nhật các fields: title, description, scheduledAt, duration
11. Cập nhật field `updatedAt`
12. Nếu thay đổi scheduledAt, gửi notification cho participants
13. Trả về session đã cập nhật

**Collections sử dụng:**

- `liveSessions` - Cập nhật document
- `notifications` - Gửi thông báo nếu thay đổi thời gian

---

### 7.5. Workflow Bắt Đầu Session (Start)

**Mô tả:** Teacher bắt đầu live session vào thời điểm đã lên lịch.

**API Endpoint:** `PUT /api/sessions/:id/start`

**Quy trình:**

1. Teacher vào trang session và click "Bắt đầu"
2. Gửi request PUT đến `/api/sessions/:id/start` kèm JWT token
3. Hệ thống xác thực token
4. Validate sessionId
5. Tìm session trong collection **liveSessions**
6. Kiểm tra user là host (hostId=userId)
7. Kiểm tra status hiện tại là 'scheduled'
8. Cập nhật field `status='live'`
9. Cập nhật field `startedAt` với timestamp hiện tại
10. Thêm hostId vào array `participants`
11. Gửi notification real-time cho enrolled students (qua Socket.io)
12. Khởi tạo WebRTC room/session hoặc meeting link (nếu dùng third-party như Zoom, Jitsi)
13. Trả về session info với meeting link hoặc WebRTC credentials

**Collections sử dụng:**

- `liveSessions` - Cập nhật status và startedAt
- `notifications` - Gửi thông báo real-time
- Socket.io - Broadcast session start event

---

### 7.6. Workflow Kết Thúc Session (End)

**Mô tả:** Teacher kết thúc live session.

**API Endpoint:** `PUT /api/sessions/:id/end`

**Quy trình:**

1. Teacher click nút "Kết thúc buổi học"
2. Gửi request PUT đến `/api/sessions/:id/end` kèm JWT token
3. Hệ thống xác thực token
4. Validate sessionId
5. Tìm session trong collection **liveSessions**
6. Kiểm tra user là host
7. Kiểm tra status hiện tại là 'live'
8. Cập nhật field `status='ended'`
9. Cập nhật field `endedAt` với timestamp hiện tại
10. Tính toán thời lượng thực tế (endedAt - startedAt)
11. Đóng WebRTC room hoặc meeting
12. Nếu có recording, lưu recordingUrl (nếu có tích hợp recording)
13. Gửi notification cho participants về session đã kết thúc
14. Có thể cập nhật analytics về attendance
15. Trả về session info với actual duration

**Collections sử dụng:**

- `liveSessions` - Cập nhật status, endedAt, recordingUrl
- `notifications` - Gửi thông báo
- `analytics` - Cập nhật attendance data
- Socket.io - Broadcast session end event

---

### 7.7. Workflow Tham Gia Session

**Mô tả:** Teacher hoặc student tham gia vào live session đang diễn ra.

**API Endpoint:** `POST /api/sessions/:id/join`

**Quy trình:**

1. User click "Tham gia" khi session đang live
2. Gửi request POST đến `/api/sessions/:id/join` kèm JWT token
3. Hệ thống xác thực token
4. Validate sessionId
5. Tìm session trong collection **liveSessions**
6. Kiểm tra status='live' (session đang diễn ra)
7. Lấy courseId và kiểm tra user đã enroll hoặc là host/teacher
8. Kiểm tra user chưa có trong array `participants`
9. Thêm userId vào array `participants`
10. Cập nhật participant count
11. Tạo hoặc lấy WebRTC connection credentials
12. Gửi notification real-time cho host về participant mới
13. Log attendance trong collection **analytics** hoặc **sessionAttendance**
14. Trả về meeting link, WebRTC credentials, hoặc room info

**Collections sử dụng:**

- `liveSessions` - Cập nhật array participants
- `courses` - Verify enrollment
- `progress` - Verify enrollment
- `analytics` hoặc `sessionAttendance` - Log attendance
- Socket.io - Notify host và participants

---

### 7.8. Workflow Xóa Session

**Mô tả:** Teacher xóa hoặc hủy một live session.

**API Endpoint:** `DELETE /api/sessions/:id`

**Quy trình:**

1. Teacher click "Xóa/Hủy session" với xác nhận
2. Gửi request DELETE đến `/api/sessions/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate sessionId
5. Tìm session trong collection **liveSessions**
6. Kiểm tra user là host
7. Kiểm tra session chưa bắt đầu hoặc có thể cancel:
   - Nếu status='scheduled': có thể xóa hoàn toàn hoặc đổi status='cancelled'
   - Nếu status='live': không cho xóa, phải end trước
   - Nếu status='ended': có thể giữ lại để lưu lịch sử
8. Nếu xóa, cập nhật status='cancelled' hoặc xóa document
9. Gửi notification cho enrolled students về session đã bị hủy
10. Xóa calendar events/reminders liên quan
11. Trả về response thành công

**Collections sử dụng:**

- `liveSessions` - Xóa document hoặc update status='cancelled'
- `notifications` - Gửi thông báo hủy session
- `analytics` - Có thể giữ lại record nếu soft delete

---

## 8. QUẢN LÝ THÔNG BÁO (NOTIFICATIONS)

### 8.1. Workflow Xem Danh Sách Thông Báo

**Mô tả:** Teacher xem tất cả thông báo của mình.

**API Endpoint:** `GET /api/notifications`

**Quy trình:**

1. Teacher click vào icon thông báo
2. Gửi request GET đến `/api/notifications` kèm JWT token và query params:
   - page, limit (pagination)
   - type (course, quiz, discussion, session, system)
   - isRead (true/false để filter)
3. Hệ thống xác thực token và lấy userId
4. Truy vấn collection **notifications** với filter `userId=userId`
5. Áp dụng filters từ query params
6. Sort theo createdAt descending (mới nhất trước)
7. Populate thông tin related objects (course, user, etc.) nếu cần
8. Áp dụng pagination
9. Trả về danh sách notifications với:
   - \_id, type, title, message, link
   - isRead, createdAt
   - Metadata (total, page, limit, unreadCount)

**Collections sử dụng:**

- `notifications` - Đọc danh sách notifications
- `courses`, `users` - Populate related info (optional)

---

### 8.2. Workflow Xem Số Lượng Thông Báo Chưa Đọc

**Mô tả:** Teacher xem số thông báo chưa đọc để hiển thị badge.

**API Endpoint:** `GET /api/notifications/unread-count`

**Quy trình:**

1. Client gửi request định kỳ hoặc khi load trang
2. Gửi request GET đến `/api/notifications/unread-count` kèm JWT token
3. Hệ thống xác thực token và lấy userId
4. Đếm số documents trong collection **notifications** với điều kiện:
   - userId=userId
   - isRead=false
5. Trả về count number

**Collections sử dụng:**

- `notifications` - Đếm unread notifications

---

### 8.3. Workflow Đánh Dấu Thông Báo Đã Đọc

**Mô tả:** Teacher đánh dấu một thông báo cụ thể là đã đọc.

**API Endpoint:** `PUT /api/notifications/:id/read`

**Quy trình:**

1. Teacher click vào một thông báo
2. Gửi request PUT đến `/api/notifications/:id/read` kèm JWT token
3. Hệ thống xác thực token
4. Validate notificationId
5. Tìm notification trong collection **notifications**
6. Kiểm tra notification thuộc về userId hiện tại
7. Cập nhật field `isRead=true`
8. Cập nhật field `readAt` với timestamp hiện tại
9. Giảm unread count trong cache (nếu có)
10. Trả về notification đã cập nhật

**Collections sử dụng:**

- `notifications` - Cập nhật field isRead và readAt

---

### 8.4. Workflow Đánh Dấu Tất Cả Thông Báo Đã Đọc

**Mô tả:** Teacher đánh dấu tất cả thông báo là đã đọc cùng lúc.

**API Endpoint:** `PUT /api/notifications/read-all`

**Quy trình:**

1. Teacher click "Đánh dấu tất cả đã đọc"
2. Gửi request PUT đến `/api/notifications/read-all` kèm JWT token
3. Hệ thống xác thực token và lấy userId
4. Cập nhật tất cả documents trong collection **notifications** với điều kiện:
   - userId=userId
   - isRead=false
5. Set `isRead=true` và `readAt=timestamp` cho tất cả
6. Reset unread count về 0
7. Trả về số lượng notifications đã cập nhật

**Collections sử dụng:**

- `notifications` - Bulk update nhiều documents

---

### 8.5. Workflow Xóa Thông Báo

**Mô tả:** Teacher xóa một thông báo khỏi danh sách.

**API Endpoint:** `DELETE /api/notifications/:id`

**Quy trình:**

1. Teacher click nút xóa trên thông báo
2. Gửi request DELETE đến `/api/notifications/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate notificationId
5. Tìm notification trong collection **notifications**
6. Kiểm tra notification thuộc về userId hiện tại
7. Xóa document khỏi collection **notifications**
8. Nếu notification chưa đọc, giảm unread count
9. Trả về response thành công

**Collections sử dụng:**

- `notifications` - Xóa document

---

### 8.6. Workflow Xem Cài Đặt Notification Preferences

**Mô tả:** Teacher xem các tùy chọn nhận thông báo.

**API Endpoint:** `GET /api/notifications/preferences`

**Quy trình:**

1. Teacher vào trang "Cài đặt thông báo"
2. Gửi request GET đến `/api/notifications/preferences` kèm JWT token
3. Hệ thống xác thực token và lấy userId
4. Tìm preferences trong collection **users** (field notificationPreferences) hoặc collection **notificationPreferences**
5. Trả về settings:
   - emailNotifications (bool)
   - pushNotifications (bool)
   - Types preferences:
     - courseUpdates (bool)
     - newEnrollment (bool)
     - quizSubmission (bool)
     - newDiscussion (bool)
     - newComment (bool)
     - sessionReminder (bool)
     - systemAnnouncement (bool)

**Collections sử dụng:**

- `users` - Đọc field notificationPreferences
- Hoặc `notificationPreferences` - Collection riêng cho preferences

---

### 8.7. Workflow Cập Nhật Notification Preferences

**Mô tả:** Teacher cập nhật tùy chọn nhận thông báo.

**API Endpoint:** `PUT /api/notifications/preferences`

**Quy trình:**

1. Teacher thay đổi các settings và click "Lưu"
2. Gửi request PUT đến `/api/notifications/preferences` kèm JWT token và preferences object
3. Hệ thống xác thực token và lấy userId
4. Validate dữ liệu preferences (các boolean values)
5. Cập nhật preferences trong collection **users** hoặc **notificationPreferences**
6. Cập nhật field `updatedAt`
7. Trả về preferences đã cập nhật

**Collections sử dụng:**

- `users` - Cập nhật notificationPreferences
- Hoặc `notificationPreferences` - Cập nhật document

---

## 9. QUẢN LÝ ANALYTICS & BÁO CÁO

### 9.1. Workflow Xem Analytics Của Khóa Học

**Mô tả:** Teacher xem số liệu thống kê chi tiết về một khóa học cụ thể.

**API Endpoint:** `GET /api/analytics/course/:courseId`

**Quy trình:**

1. Teacher vào trang "Thống kê" của khóa học
2. Gửi request GET đến `/api/analytics/course/:courseId` kèm JWT token
3. Hệ thống xác thực token
4. Validate courseId
5. Tìm course trong collection **courses**
6. Kiểm tra teacher là owner hoặc admin
7. Truy vấn collection **analytics** hoặc tính toán real-time từ các collections:
   - Tổng số students enrolled (từ **progress**)
   - Completion rate (số students hoàn thành / tổng enrolled)
   - Average quiz score (từ **quizAttempts**)
   - Total revenue (price × enrollment count)
   - Engagement rate (active students / total enrolled)
   - Trends (so sánh với tháng/tuần trước):
     - Student growth
     - Completion rate trend
     - Revenue trend
8. Lấy thêm data về:
   - Top performing lessons
   - Difficult quizzes (lowest average scores)
   - Most active discussions
   - Session attendance rates
9. Trả về analytics object với tất cả metrics và trends

**Collections sử dụng:**

- `courses` - Verify ownership
- `analytics` - Đọc pre-calculated analytics
- `progress` - Tính enrollment và completion
- `quizAttempts` - Tính average scores
- `discussions` - Tính engagement
- `liveSessions` - Tính attendance

---

### 9.2. Workflow Xem Analytics Của Học Viên Cụ Thể

**Mô tả:** Teacher xem thống kê học tập của một student cụ thể.

**API Endpoint:** `GET /api/analytics/student/:userId`

**Quy trình:**

1. Teacher click vào student trong danh sách để xem chi tiết
2. Gửi request GET đến `/api/analytics/student/:userId` kèm JWT token
3. Hệ thống xác thực token
4. Validate userId của student
5. Kiểm tra quyền:
   - Student xem chính mình
   - Teacher xem student trong khóa học của mình
   - Admin xem tất cả
6. Truy vấn và tính toán:
   - Enrolled courses (từ **progress**)
   - Completed courses (isCompleted=true)
   - Total learning time (tổng watchedDuration)
   - Average quiz score (từ **quizAttempts**)
   - Certificates earned (từ **certificates** nếu có)
   - Participation rate (discussions, comments)
   - Session attendance (từ **liveSessions**)
7. Lấy progress cho từng course
8. Lấy recent activities
9. Trả về student analytics object

**Collections sử dụng:**

- `users` - Verify student exists
- `progress` - Đọc enrolled courses và completion
- `quizAttempts` - Tính average scores
- `discussions`, `comments` - Tính participation
- `liveSessions` - Tính attendance
- `certificates` - Đếm certificates

---

### 9.3. Workflow Xem Dashboard Analytics Tổng Quan

**Mô tả:** Teacher xem thống kê tổng quan về tất cả khóa học và hoạt động.

**API Endpoint:** `GET /api/analytics/dashboard`

**Quy trình:**

1. Teacher truy cập trang Dashboard
2. Gửi request GET đến `/api/analytics/dashboard` kèm JWT token
3. Hệ thống xác thực token
4. Kiểm tra role='teacher' hoặc 'admin'
5. Nếu teacher, filter theo hostId=userId
6. Tính toán các metrics tổng quan:
   - Total courses (từ **courses**)
   - Published vs unpublished courses
   - Total students (distinct enrolled students từ **progress**)
   - Total revenue (tổng thu nhập từ courses)
   - Total enrollments
   - Average course rating
   - Monthly growth (so sánh với tháng trước):
     - New students
     - New enrollments
     - Revenue growth
   - Recent activities (enrollments, quiz submissions, discussions)
7. Lấy top performing courses
8. Lấy upcoming live sessions
9. Trả về dashboard analytics với charts data

**Collections sử dụng:**

- `courses` - Đếm courses và tính revenue
- `progress` - Đếm enrollments và students
- `quizAttempts` - Recent quiz activities
- `discussions` - Recent discussions
- `liveSessions` - Upcoming sessions
- `analytics` - Pre-calculated dashboard data

---

### 9.4. Workflow Export Analytics Khóa Học Ra CSV

**Mô tả:** Teacher export dữ liệu thống kê khóa học ra file CSV.

**API Endpoint:** `GET /api/analytics/export`

**Quy trình:**

1. Teacher click nút "Export to CSV" trên trang analytics
2. Gửi request GET đến `/api/analytics/export?courseId=xxx` kèm JWT token
3. Hệ thống xác thực token
4. Validate courseId từ query param
5. Kiểm tra teacher là owner hoặc admin
6. Lấy tất cả dữ liệu analytics của course:
   - Student list với progress
   - Quiz scores cho từng student
   - Completion rates
   - Attendance records
   - Engagement metrics
7. Format dữ liệu thành CSV format:
   - Header row: Student Name, Email, Enrollment Date, Progress %, Quiz Average, Completion Status, etc.
   - Data rows cho từng student
8. Set response headers:
   - Content-Type: text/csv
   - Content-Disposition: attachment; filename="course-analytics-{courseId}-{date}.csv"
9. Stream hoặc trả về CSV content
10. Client browser tự động download file

**Collections sử dụng:**

- `courses` - Verify ownership
- `progress` - Lấy student progress
- `users` - Populate student info
- `quizAttempts` - Lấy quiz scores
- `liveSessions` - Lấy attendance

---

### 9.5. Workflow Tạo Báo Cáo Chi Tiết Học Viên

**Mô tả:** Teacher tạo báo cáo PDF hoặc chi tiết về một học viên.

**API Endpoint:** `GET /api/analytics/student-report/:userId`

**Quy trình:**

1. Teacher click "Tạo báo cáo" cho student
2. Gửi request GET đến `/api/analytics/student-report/:userId` kèm JWT token
3. Hệ thống xác thực token
4. Validate userId
5. Kiểm tra quyền xem student (teacher của enrolled courses hoặc admin)
6. Thu thập dữ liệu comprehensive:
   - Basic info: name, email, avatar
   - Enrollment history với timeline
   - Detailed progress cho từng course:
     - Completed lessons
     - Quiz results với breakdown
     - Discussion participation
     - Session attendance
   - Strengths và weaknesses analysis
   - Recommendations
7. Có thể generate PDF report hoặc trả về detailed JSON
8. Lưu report vào collection **reports** (optional)
9. Trả về report object hoặc PDF file

**Collections sử dụng:**

- `users` - Student info
- `progress` - Enrollment và progress history
- `quizAttempts` - Detailed quiz analysis
- `discussions`, `comments` - Participation
- `liveSessions` - Attendance
- `reports` - Lưu generated report (optional)

---

### 9.6. Workflow Kích Hoạt Thu Thập Analytics Thủ Công

**Mô tả:** Admin/Teacher trigger việc thu thập và tính toán analytics (thường chạy tự động bằng cron).

**API Endpoint:** `POST /api/analytics/collect`

**Quy trình:**

1. Admin vào trang system settings và click "Collect Analytics"
2. Gửi request POST đến `/api/analytics/collect` kèm JWT token
3. Hệ thống xác thực token
4. Kiểm tra role='admin' (chỉ admin mới được trigger)
5. Chạy analytics collection service:
   - Tính toán metrics cho tất cả courses
   - Aggregate student data
   - Calculate trends và growth rates
   - Update completion rates
   - Compute engagement metrics
6. Lưu kết quả vào collection **analytics** với timestamp
7. Clear cache cũ nếu có
8. Có thể chạy background job async
9. Trả về response với job status hoặc kết quả

**Collections sử dụng:**

- `analytics` - Lưu calculated metrics
- `courses`, `progress`, `quizAttempts`, `discussions`, `liveSessions` - Nguồn dữ liệu để tính toán

**Note:** Workflow này thường được trigger tự động bởi cron job, manual trigger chỉ dùng cho testing hoặc on-demand updates.

---

## 10. QUẢN LÝ TIẾN ĐỘ HỌC VIÊN (PROGRESS TRACKING)

### 10.1. Workflow Xem Tiến Độ Học Tập Của Học Viên Trong Khóa Học

**Mô tả:** Teacher xem chi tiết tiến độ học của một student hoặc tất cả students trong khóa học.

**API Endpoint:** `GET /api/progress/course/:courseId` (với filter userId nếu cần)

**Quy trình:**

1. Teacher vào trang "Tiến độ học viên" của khóa học
2. Có thể chọn xem tất cả students hoặc một student cụ thể
3. Gửi request GET đến endpoint phù hợp kèm JWT token
4. Hệ thống xác thực token
5. Validate courseId
6. Kiểm tra teacher là owner của course
7. Truy vấn collection **progress** với filter:
   - courseId=courseId
   - userId=specificUserId (nếu xem 1 student)
   - Hoặc lấy tất cả progress records của course
8. Với mỗi progress record, lấy thông tin:
   - Student info từ collection **users**
   - Enrolled date
   - Completed lessons (array với lessonId và completedAt)
   - Total lessons vs completed lessons
   - Progress percentage
   - Watched duration cho video lessons
   - Last activity timestamp
9. Lấy quiz scores từ collection **quizAttempts**
10. Tính overall completion status
11. Sort students theo progress % hoặc recent activity
12. Trả về danh sách progress records với detailed info

**API Alternative cho xem 1 student:**

- Có thể dùng GET endpoint riêng hoặc filter param

**Collections sử dụng:**

- `progress` - Đọc progress records
- `users` - Populate student info
- `courses` - Verify ownership
- `lessons` - Đếm total lessons
- `quizAttempts` - Lấy quiz performance

**Các metrics thường tracking:**

- Enrollment date (từ progress.enrolledAt)
- Completed lessons count và percentage
- Video watch time (watchedDuration cho mỗi lesson)
- Quiz completion và scores
- Last access time
- Time spent on course (total learning time)
- Completion status (in progress, completed, abandoned)

---

## 📝 TỔNG KẾT PHẦN 3

**Phần 3** đã mô tả chi tiết các workflow sau:

- ✅ 8 workflows về Quản lý Live Sessions
- ✅ 7 workflows về Quản lý Thông báo (Notifications)
- ✅ 6 workflows về Quản lý Analytics & Báo cáo
- ✅ 1 workflow về Theo dõi Tiến độ học viên

**Tổng cộng: 22 workflows trong Phần 3**

**Collections chính được sử dụng trong Phần 3:**

- `liveSessions` - Lưu thông tin live sessions
- `notifications` - Lưu thông báo
- `notificationPreferences` - Cài đặt thông báo
- `analytics` - Lưu pre-calculated analytics data
- `progress` - Tracking enrollment và tiến độ học
- `quizAttempts` - Kết quả quiz để analytics
- `discussions`, `comments` - Tính engagement metrics
- `users` - Populate user info
- `courses` - Verify ownership
- `certificates` - Chứng chỉ (nếu có)
- `reports` - Lưu generated reports (optional)

**External Services & Technologies:**

- Socket.io - Real-time notifications cho live sessions
- WebRTC hoặc third-party (Zoom, Jitsi) - Video conferencing
- PDF generation library - Tạo báo cáo PDF
- CSV export - Export analytics data
- Cron jobs - Automated analytics collection
- Email service (SendGrid) - Gửi notification emails

---

## 🎉 TỔNG KẾT TOÀN BỘ TEACHER WORKFLOWS

### 📊 Thống kê tổng quan:

**Phần 1:** 23 workflows (Tài khoản, Courses, Chapters)  
**Phần 2:** 25 workflows (Lessons, Quiz & Questions, Discussions & Comments)  
**Phần 3:** 22 workflows (Live Sessions, Notifications, Analytics, Progress)

**🔥 TỔNG CỘNG: 70 WORKFLOWS ĐẦY ĐỦ**

### 📚 Collections Database được sử dụng:

1. `users` - Thông tin user/teacher
2. `userProfiles` - Profile chi tiết
3. `courses` - Khóa học
4. `chapters` - Chương học
5. `lessons` - Bài học
6. `media` - Media files (video, resources)
7. `quizzes` - Quiz/kiểm tra
8. `questions` - Câu hỏi quiz
9. `quizAttempts` - Lần làm bài của students
10. `discussions` - Thảo luận
11. `comments` - Comments
12. `liveSessions` - Live sessions
13. `notifications` - Thông báo
14. `notificationPreferences` - Cài đặt thông báo
15. `progress` - Tiến độ học tập
16. `analytics` - Dữ liệu phân tích
17. `certificates` - Chứng chỉ
18. `reports` - Báo cáo
19. `tokens` hoặc `sessions` - Refresh tokens (optional)

### 🛠️ External Services:

- **Cloudinary** - Lưu trữ images, videos, files
- **SendGrid** - Email service
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **WebRTC/Zoom/Jitsi** - Video conferencing
- **PDF Library** - Generate reports
- **Cron Service** - Scheduled tasks

---

> ✅ **Hoàn thành toàn bộ tài liệu TEACHER WORKFLOWS!**
>
> Xem thêm:
>
> - [TEACHER_WORKFLOWS.md](./TEACHER_WORKFLOWS.md) - Mục lục tổng quan
> - [TEACHER_WORKFLOWS_PART1.md](./TEACHER_WORKFLOWS_PART1.md) - Phần 1
> - [TEACHER_WORKFLOWS_PART2.md](./TEACHER_WORKFLOWS_PART2.md) - Phần 2
> - [TEACHER_WORKFLOWS_PART3.md](./TEACHER_WORKFLOWS_PART3.md) - Phần 3 (file này)
