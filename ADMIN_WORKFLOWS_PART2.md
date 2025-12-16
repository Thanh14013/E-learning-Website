# ADMIN WORKFLOWS - PHẦN 2

## 7. QUẢN LÝ LIVE SESSION (BUỔI HỌC TRỰC TIẾP)

### 7.1. Workflow Tạo Live Session Mới

**Mô tả:**
Admin tạo một buổi học trực tiếp mới cho một khóa học.

**Quy trình:**

1. Admin truy cập trang tạo live session
2. Nhập thông tin session (title, description, courseId, scheduledStartTime, scheduledEndTime, meetingUrl, maxParticipants)
3. Gọi API POST /api/sessions với thông tin session
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate dữ liệu đầu vào
7. Kiểm tra scheduledStartTime phải trong tương lai
8. Kiểm tra scheduledEndTime phải sau scheduledStartTime
9. Tìm course trong database
10. Kiểm tra admin có quyền tạo session cho course không (là instructor hoặc admin)
11. Tạo session document với status = 'scheduled', host = admin ID
12. Lưu session vào database
13. Tạo notifications cho tất cả enrolled students về session mới
14. Trả về session đã tạo

**Collections sử dụng:**

- **liveSessions**: Tạo session document mới
- **courses**: Đọc để kiểm tra quyền và lấy enrolled students
- **notifications**: Tạo thông báo cho enrolled students

---

### 7.2. Workflow Xem Danh Sách Session Của Một Khóa Học

**Mô tả:**
Admin xem tất cả các buổi học trực tiếp của một khóa học cụ thể.

**Quy trình:**

1. Admin truy cập trang chi tiết khóa học
2. Click vào tab live sessions
3. Gọi API GET /api/sessions/course/:courseId với query params (page, limit, status)
4. Validate course ID
5. Xây dựng query filter theo status nếu có (scheduled, live, ended, cancelled)
6. Tìm tất cả sessions của course
7. Áp dụng phân trang
8. Populate thông tin host
9. Đếm số participants đã join mỗi session
10. Sort theo scheduledStartTime
11. Trả về danh sách sessions với metadata

**Collections sử dụng:**

- **liveSessions**: Đọc sessions với filter courseId
- **users**: Populate host info
- **courses**: Verify course exists

---

### 7.3. Workflow Xem Chi Tiết Session

**Mô tả:**
Admin xem thông tin chi tiết của một live session, bao gồm danh sách participants.

**Quy trình:**

1. Admin click vào một session
2. Gọi API GET /api/sessions/:id
3. Validate session ID
4. Tìm session trong database
5. Populate thông tin host
6. Populate thông tin course
7. Lấy danh sách participants với thông tin user
8. Tính thời gian thực tế (actualStartTime, actualEndTime nếu đã diễn ra)
9. Lấy thống kê attendance
10. Trả về thông tin đầy đủ session

**Collections sử dụng:**

- **liveSessions**: Đọc session document
- **users**: Populate host và participants info
- **courses**: Populate course info

---

### 7.4. Workflow Cập Nhật Thông Tin Session

**Mô tả:**
Admin cập nhật thông tin của live session (title, description, thời gian, meeting URL).

**Quy trình:**

1. Admin chỉnh sửa thông tin session trong form
2. Click nút save
3. Gọi API PUT /api/sessions/:id với dữ liệu mới
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate session ID và dữ liệu
7. Tìm session trong database
8. Kiểm tra admin có quyền cập nhật không (là host hoặc admin)
9. Kiểm tra session chưa kết thúc
10. Validate thời gian mới nếu có thay đổi
11. Cập nhật các field được phép
12. Nếu thay đổi thời gian hoặc meeting URL: tạo notifications cho participants
13. Trả về session đã cập nhật

**Collections sử dụng:**

- **liveSessions**: Cập nhật session document
- **notifications**: Tạo thông báo nếu có thay đổi quan trọng

---

### 7.5. Workflow Bắt Đầu Session

**Mô tả:**
Admin bắt đầu một buổi học trực tiếp đã được lên lịch.

**Quy trình:**

1. Admin click nút start session
2. Gọi API PUT /api/sessions/:id/start
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Validate session ID
6. Tìm session trong database
7. Kiểm tra admin có quyền start không (là host hoặc admin)
8. Kiểm tra session có status = 'scheduled'
9. Cập nhật status = 'live'
10. Lưu actualStartTime = thời gian hiện tại
11. Tạo notifications cho enrolled students về session đang diễn ra
12. Emit socket event để notify real-time
13. Trả về session đã cập nhật

**Collections sử dụng:**

- **liveSessions**: Cập nhật status và actualStartTime
- **notifications**: Tạo thông báo session bắt đầu

**Gói tin gửi đi:**

- Socket.IO event: 'session:started' đến enrolled students

---

### 7.6. Workflow Kết Thúc Session

**Mô tả:**
Admin kết thúc một buổi học trực tiếp đang diễn ra.

**Quy trình:**

1. Admin click nút end session
2. Gọi API PUT /api/sessions/:id/end
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Validate session ID
6. Tìm session trong database
7. Kiểm tra admin có quyền end không
8. Kiểm tra session có status = 'live'
9. Cập nhật status = 'ended'
10. Lưu actualEndTime = thời gian hiện tại
11. Tính toán duration thực tế
12. Tạo analytics record cho session
13. Tạo notifications cho participants về session đã kết thúc
14. Emit socket event để notify real-time
15. Trả về session đã cập nhật

**Collections sử dụng:**

- **liveSessions**: Cập nhật status, actualEndTime, duration
- **notifications**: Tạo thông báo session kết thúc
- **analytics**: Tạo record thống kê session

**Gói tin gửi đi:**

- Socket.IO event: 'session:ended' đến participants

---

### 7.7. Workflow Xem Các Session Do Admin Tạo

**Mô tả:**
Admin xem danh sách tất cả các live session do chính mình tạo/host.

**Quy trình:**

1. Admin truy cập trang my sessions
2. Gọi API GET /api/sessions/my-sessions với query params (page, limit, status)
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Lấy user ID từ token
6. Tìm tất cả sessions có host = user ID
7. Áp dụng filter theo status nếu có
8. Áp dụng phân trang
9. Populate course info
10. Đếm participants cho mỗi session
11. Sort theo thời gian
12. Trả về danh sách sessions với metadata

**Collections sử dụng:**

- **liveSessions**: Đọc sessions với filter host = admin ID
- **courses**: Populate course info

---

### 7.8. Workflow Xóa Session

**Mô tả:**
Admin xóa một live session (chỉ được phép xóa nếu session chưa bắt đầu hoặc đã kết thúc).

**Quy trình:**

1. Admin click nút delete trên session
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/sessions/:id
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate session ID
7. Tìm session trong database
8. Kiểm tra admin có quyền xóa không
9. Kiểm tra session không có status = 'live' (không được xóa session đang diễn ra)
10. Tạo notifications cho participants về session bị hủy (nếu status = 'scheduled')
11. Xóa session khỏi database
12. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **liveSessions**: Xóa session document
- **notifications**: Tạo thông báo session bị hủy

---

### 7.9. Workflow Join Session (Tham Gia Session)

**Mô tả:**
Admin tham gia vào một buổi học trực tiếp đang diễn ra.

**Quy trình:**

1. Admin click vào link meeting hoặc nút join session
2. Gọi API POST /api/sessions/:id/join
3. Hệ thống xác thực admin
4. Validate session ID
5. Tìm session trong database
6. Kiểm tra session có status = 'live' hoặc 'scheduled'
7. Tìm course liên quan
8. Kiểm tra admin đã enroll course hoặc là instructor hoặc admin
9. Kiểm tra số participants chưa vượt quá maxParticipants
10. Thêm admin ID vào participants array nếu chưa có
11. Cập nhật joinedAt timestamp
12. Emit socket event để notify participants khác
13. Trả về session info và meeting URL

**Collections sử dụng:**

- **liveSessions**: Cập nhật participants array
- **courses**: Verify enrollment

**Gói tin gửi đi:**

- Socket.IO event: 'participant:joined' đến các participants khác

---

## 8. QUẢN LÝ DISCUSSION (THẢO LUẬN)

### 8.1. Workflow Tạo Discussion Mới

**Mô tả:**
Admin tạo một chủ đề thảo luận mới trong một khóa học.

**Quy trình:**

1. Admin truy cập trang discussion của khóa học
2. Click nút create discussion
3. Nhập title và content
4. Gọi API POST /api/discussions với courseId, title, content
5. Hệ thống xác thực admin
6. Kiểm tra quyền student hoặc teacher (ai cũng có thể tạo discussion)
7. Validate dữ liệu đầu vào
8. Tìm course trong database
9. Kiểm tra course có tồn tại không
10. Tạo discussion document với author = admin ID
11. Khởi tạo likes = [], comments = [], views = 0, isPinned = false
12. Lưu discussion vào database
13. Tạo notification cho instructor và enrolled students
14. Trả về discussion đã tạo

**Collections sử dụng:**

- **discussions**: Tạo discussion document mới
- **courses**: Đọc để verify và lấy enrolled students
- **notifications**: Tạo thông báo cho instructor và students

---

### 8.2. Workflow Xem Danh Sách Discussion Của Khóa Học

**Mô tả:**
Admin xem tất cả các chủ đề thảo luận trong một khóa học.

**Quy trình:**

1. Admin truy cập trang discussions của khóa học
2. Gọi API GET /api/discussions/course/:courseId với query params (page, limit, search, sortBy, order)
3. Validate course ID
4. Xây dựng query filter
5. Áp dụng search nếu có (tìm trong title và content)
6. Áp dụng sort (mặc định: pinned trước, sau đó theo createdAt)
7. Áp dụng phân trang
8. Populate thông tin author
9. Đếm số comments cho mỗi discussion
10. Đếm số likes
11. Đánh dấu discussions admin đã like
12. Trả về danh sách discussions với metadata

**Collections sử dụng:**

- **discussions**: Đọc discussions với filter courseId
- **users**: Populate author info
- **comments**: Đếm comments cho mỗi discussion

---

### 8.3. Workflow Xem Chi Tiết Discussion

**Mô tả:**
Admin xem chi tiết một discussion và tất cả comments bên trong.

**Quy trình:**

1. Admin click vào một discussion
2. Gọi API GET /api/discussions/:id
3. Validate discussion ID
4. Tìm discussion trong database
5. Tăng views counter lên 1
6. Populate thông tin author
7. Lấy tất cả comments của discussion (sắp xếp theo thứ tự: pinned trước, sau đó theo likes/time)
8. Populate author cho mỗi comment
9. Xây dựng cây comments (parent-child relationships)
10. Đánh dấu discussion và comments admin đã like
11. Trả về discussion với comments tree

**Collections sử dụng:**

- **discussions**: Đọc và cập nhật views
- **users**: Populate author info
- **comments**: Lấy tất cả comments của discussion

---

### 8.4. Workflow Cập Nhật Discussion

**Mô tả:**
Admin cập nhật title và/hoặc content của discussion.

**Quy trình:**

1. Admin click nút edit trên discussion
2. Chỉnh sửa title và/hoặc content
3. Gọi API PUT /api/discussions/:id với dữ liệu mới
4. Hệ thống xác thực admin
5. Validate discussion ID và dữ liệu
6. Tìm discussion trong database
7. Kiểm tra quyền cập nhật (là author, teacher của course, hoặc admin)
8. Cập nhật title và/hoặc content
9. Cập nhật updatedAt timestamp
10. Trả về discussion đã cập nhật

**Collections sử dụng:**

- **discussions**: Cập nhật title, content, updatedAt
- **courses**: Đọc để kiểm tra quyền

---

### 8.5. Workflow Xóa Discussion

**Mô tả:**
Admin xóa một discussion và tất cả comments liên quan.

**Quy trình:**

1. Admin click nút delete trên discussion
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/discussions/:id
4. Hệ thống xác thực admin
5. Validate discussion ID
6. Tìm discussion trong database
7. Kiểm tra quyền xóa (là author, teacher của course, hoặc admin)
8. Xóa tất cả comments và replies của discussion
9. Xóa discussion khỏi database
10. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **discussions**: Xóa discussion document
- **comments**: Xóa tất cả comments liên quan
- **courses**: Đọc để kiểm tra quyền

---

### 8.6. Workflow Like/Unlike Discussion

**Mô tả:**
Admin like hoặc unlike một discussion.

**Quy trình:**

1. Admin click nút like trên discussion
2. Gọi API PUT /api/discussions/:id/like
3. Hệ thống xác thực admin
4. Validate discussion ID
5. Tìm discussion trong database
6. Kiểm tra admin ID có trong likes array không
7. Nếu có: remove admin ID (unlike)
8. Nếu không: thêm admin ID (like) và tạo notification cho author
9. Emit socket event để update real-time
10. Trả về discussion đã cập nhật

**Collections sử dụng:**

- **discussions**: Cập nhật likes array
- **notifications**: Tạo thông báo cho author khi có like mới

**Gói tin gửi đi:**

- Socket.IO event: 'discussion:liked' hoặc 'discussion:unliked'

---

### 8.7. Workflow Ghim/Bỏ Ghim Discussion

**Mô tả:**
Admin ghim một discussion quan trọng lên đầu danh sách hoặc bỏ ghim.

**Quy trình:**

1. Admin click nút pin/unpin trên discussion
2. Gọi API PUT /api/discussions/:id/pin
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Validate discussion ID
6. Tìm discussion trong database
7. Tìm course để kiểm tra quyền
8. Kiểm tra admin là instructor hoặc admin
9. Toggle isPinned (true/false)
10. Tạo notification cho enrolled students nếu pin
11. Trả về discussion đã cập nhật

**Collections sử dụng:**

- **discussions**: Cập nhật isPinned
- **courses**: Đọc để kiểm tra quyền
- **notifications**: Tạo thông báo khi pin discussion quan trọng

---

## 9. QUẢN LÝ COMMENT (BÌNH LUẬN)

### 9.1. Workflow Tạo Comment Trên Discussion

**Mô tả:**
Admin tạo comment hoặc reply trên một discussion.

**Quy trình:**

1. Admin nhập nội dung comment trong discussion
2. Nếu reply: chọn comment cha để reply
3. Gọi API POST /api/discussions/:id/comment với content và parentId (nếu là reply)
4. Hệ thống xác thực admin
5. Validate discussion ID và content
6. Tìm discussion trong database
7. Nếu có parentId: validate parent comment tồn tại và thuộc discussion này
8. Tạo comment document với author = admin ID
9. Khởi tạo likes = [], replies = [] (nếu là top-level comment)
10. Lưu comment vào database
11. Thêm comment ID vào comments array của discussion
12. Nếu là reply: thêm comment ID vào replies array của parent
13. Tạo notification cho discussion author (nếu là top-level) hoặc parent author (nếu là reply)
14. Emit socket event để update real-time
15. Trả về comment đã tạo

**Collections sử dụng:**

- **comments**: Tạo comment document mới
- **discussions**: Cập nhật comments array
- **notifications**: Tạo thông báo cho discussion/comment author

**Gói tin gửi đi:**

- Socket.IO event: 'comment:created'

---

### 9.2. Workflow Cập Nhật Comment

**Mô tả:**
Admin chỉnh sửa nội dung comment của mình.

**Quy trình:**

1. Admin click nút edit trên comment
2. Chỉnh sửa content
3. Gọi API PUT /api/comments/:id với content mới
4. Hệ thống xác thực admin
5. Validate comment ID và content
6. Tìm comment trong database
7. Kiểm tra quyền cập nhật (phải là author của comment)
8. Cập nhật content
9. Đánh dấu isEdited = true
10. Cập nhật updatedAt timestamp
11. Emit socket event để update real-time
12. Trả về comment đã cập nhật

**Collections sử dụng:**

- **comments**: Cập nhật content, isEdited, updatedAt

**Gói tin gửi đi:**

- Socket.IO event: 'comment:updated'

---

### 9.3. Workflow Xóa Comment

**Mô tả:**
Admin xóa một comment và tất cả replies bên trong (nếu có).

**Quy trình:**

1. Admin click nút delete trên comment
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/comments/:id
4. Hệ thống xác thực admin
5. Validate comment ID
6. Tìm comment trong database
7. Tìm discussion liên quan
8. Kiểm tra quyền xóa (là author, teacher của course, hoặc admin)
9. Nếu comment có replies: xóa tất cả replies đệ quy
10. Xóa comment khỏi database
11. Remove comment ID khỏi comments array của discussion (nếu top-level)
12. Remove comment ID khỏi replies array của parent (nếu là reply)
13. Emit socket event để update real-time
14. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **comments**: Xóa comment và tất cả replies
- **discussions**: Cập nhật comments array

**Gói tin gửi đi:**

- Socket.IO event: 'comment:deleted'

---

### 9.4. Workflow Like/Unlike Comment

**Mô tả:**
Admin like hoặc unlike một comment.

**Quy trình:**

1. Admin click nút like trên comment
2. Gọi API PUT /api/comments/:id/like
3. Hệ thống xác thực admin
4. Validate comment ID
5. Tìm comment trong database
6. Kiểm tra admin ID có trong likes array không
7. Nếu có: remove admin ID (unlike)
8. Nếu không: thêm admin ID (like) và tạo notification cho comment author
9. Emit socket event để update real-time
10. Trả về comment đã cập nhật

**Collections sử dụng:**

- **comments**: Cập nhật likes array
- **notifications**: Tạo thông báo cho comment author khi có like mới

**Gói tin gửi đi:**

- Socket.IO event: 'comment:liked' hoặc 'comment:unliked'

---

## 10. QUẢN LÝ NOTIFICATION (THÔNG BÁO)

### 10.1. Workflow Xem Danh Sách Thông Báo

**Mô tả:**
Admin xem tất cả thông báo của mình với các tùy chọn lọc và phân trang.

**Quy trình:**

1. Admin mở notification panel hoặc trang notifications
2. Gọi API GET /api/notifications với query params (page, limit, type, isRead)
3. Hệ thống xác thực admin
4. Lấy user ID từ token
5. Xây dựng query filter: recipient = admin ID
6. Áp dụng filter theo type nếu có (course, discussion, comment, session, quiz, etc.)
7. Áp dụng filter theo isRead nếu có
8. Áp dụng phân trang
9. Sort theo createdAt (mới nhất trước)
10. Populate thông tin sender
11. Populate thông tin liên quan (course, discussion, etc.)
12. Trả về danh sách notifications với metadata

**Collections sử dụng:**

- **notifications**: Đọc notifications với filter recipient = admin ID
- **users**: Populate sender info
- **courses/discussions/comments**: Populate related content

---

### 10.2. Workflow Xem Số Lượng Thông Báo Chưa Đọc

**Mô tả:**
Admin xem số lượng thông báo chưa đọc để hiển thị badge trên UI.

**Quy trình:**

1. Client gọi API định kỳ hoặc khi load trang
2. Gọi API GET /api/notifications/unread-count
3. Hệ thống xác thực admin
4. Lấy user ID từ token
5. Đếm số notifications có recipient = admin ID và isRead = false
6. Trả về số lượng unread

**Collections sử dụng:**

- **notifications**: Đếm với filter recipient = admin ID và isRead = false

---

### 10.3. Workflow Đánh Dấu Một Thông Báo Đã Đọc

**Mô tả:**
Admin click vào một thông báo để xem chi tiết và đánh dấu đã đọc.

**Quy trình:**

1. Admin click vào một notification
2. Gọi API PUT /api/notifications/:id/read
3. Hệ thống xác thực admin
4. Validate notification ID
5. Tìm notification trong database
6. Kiểm tra notification thuộc về admin không
7. Cập nhật isRead = true
8. Cập nhật readAt = thời gian hiện tại
9. Giảm unread count trong cache/state
10. Trả về notification đã cập nhật

**Collections sử dụng:**

- **notifications**: Cập nhật isRead và readAt

---

### 10.4. Workflow Đánh Dấu Tất Cả Thông Báo Đã Đọc

**Mô tả:**
Admin đánh dấu tất cả thông báo chưa đọc thành đã đọc cùng một lúc.

**Quy trình:**

1. Admin click nút "Mark all as read"
2. Gọi API PUT /api/notifications/read-all
3. Hệ thống xác thực admin
4. Lấy user ID từ token
5. Update tất cả notifications có recipient = admin ID và isRead = false
6. Set isRead = true và readAt = thời gian hiện tại
7. Trả về số lượng notifications đã được cập nhật

**Collections sử dụng:**

- **notifications**: Bulk update với filter recipient = admin ID và isRead = false

---

### 10.5. Workflow Xóa Một Thông Báo

**Mô tả:**
Admin xóa một thông báo cụ thể khỏi danh sách.

**Quy trình:**

1. Admin click nút delete trên một notification
2. Gọi API DELETE /api/notifications/:id
3. Hệ thống xác thực admin
4. Validate notification ID
5. Tìm notification trong database
6. Kiểm tra notification thuộc về admin không
7. Xóa notification khỏi database
8. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **notifications**: Xóa notification document

---

### 10.6. Workflow Xóa Tất Cả Thông Báo

**Mô tả:**
Admin xóa tất cả thông báo của mình cùng một lúc.

**Quy trình:**

1. Admin click nút "Clear all notifications"
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/notifications
4. Hệ thống xác thực admin
5. Lấy user ID từ token
6. Xóa tất cả notifications có recipient = admin ID
7. Trả về số lượng notifications đã được xóa

**Collections sử dụng:**

- **notifications**: Bulk delete với filter recipient = admin ID

---

### 10.7. Workflow Xem Cài Đặt Thông Báo

**Mô tả:**
Admin xem các tùy chọn cài đặt thông báo của mình.

**Quy trình:**

1. Admin truy cập trang notification settings
2. Gọi API GET /api/notifications/preferences
3. Hệ thống xác thực admin
4. Lấy user ID từ token
5. Tìm user trong database
6. Lấy notificationPreferences từ userProfile
7. Trả về preferences (email notifications, push notifications, notification types enabled)

**Collections sử dụng:**

- **users**: Đọc user
- **userProfiles**: Đọc notificationPreferences

---

### 10.8. Workflow Cập Nhật Cài Đặt Thông Báo

**Mô tả:**
Admin thay đổi cài đặt về loại thông báo nào sẽ nhận (email, push, in-app).

**Quy trình:**

1. Admin chỉnh sửa preferences trong settings
2. Toggle các options (email on comment, email on course update, push notifications, etc.)
3. Gọi API PUT /api/notifications/preferences với preferences mới
4. Hệ thống xác thực admin
5. Validate preferences data
6. Lấy user ID từ token
7. Cập nhật notificationPreferences trong userProfile
8. Trả về preferences đã cập nhật

**Collections sử dụng:**

- **userProfiles**: Cập nhật notificationPreferences object

---

## 11. QUẢN LÝ ANALYTICS VÀ BÁO CÁO

### 11.1. Workflow Xem Analytics Của Khóa Học

**Mô tả:**
Admin xem các chỉ số phân tích chi tiết của một khóa học cụ thể.

**Quy trình:**

1. Admin truy cập trang analytics của khóa học
2. Gọi API GET /api/analytics/course/:courseId với query params (startDate, endDate)
3. Hệ thống xác thực admin
4. Validate course ID
5. Tìm course trong database
6. Kiểm tra quyền xem analytics (là instructor hoặc admin)
7. Lấy analytics data từ analytics collection trong khoảng thời gian
8. Tính toán các metrics:
   - Total enrollments và trend
   - Completion rate và trend
   - Average progress
   - Active students count
   - Revenue (nếu là paid course)
   - Average rating
   - Student retention rate
   - Engagement metrics (video views, quiz attempts, discussion participation)
9. Tạo charts data (enrollment over time, progress distribution, etc.)
10. Trả về analytics với trends và growth rates

**Collections sử dụng:**

- **courses**: Đọc course info
- **analytics**: Lấy analytics records trong time range
- **progress**: Tính completion rate và average progress
- **quizAttempts**: Đếm số attempts và average scores
- **discussions**: Đếm engagement

---

### 11.2. Workflow Xem Analytics Của Sinh Viên

**Mô tả:**
Admin xem thống kê học tập và hoạt động của một sinh viên cụ thể.

**Quy trình:**

1. Admin truy cập trang student analytics
2. Gọi API GET /api/analytics/student/:userId với query params (startDate, endDate)
3. Hệ thống xác thực admin
4. Validate user ID
5. Tìm student trong database
6. Kiểm tra quyền xem (student xem của mình, teacher/admin xem của bất kỳ ai)
7. Lấy tất cả courses student đã enroll
8. Lấy progress của student trong các courses
9. Tính toán các metrics:
   - Total courses enrolled
   - Courses completed count
   - Overall completion rate
   - Total learning time (sum of video durations watched)
   - Quiz performance (average score, pass rate)
   - Discussion participation (posts, comments count)
   - Badges/achievements earned
   - Learning streak
   - Active days count
10. Tạo learning activity timeline
11. Trả về comprehensive student analytics

**Collections sử dụng:**

- **users**: Đọc student info
- **courses**: Lấy enrolled courses
- **progress**: Lấy progress trong các courses
- **quizAttempts**: Lấy quiz performance
- **discussions**: Đếm discussions created
- **comments**: Đếm comments created

---

### 11.3. Workflow Xem Dashboard Analytics Tổng Quan

**Mô tả:**
Admin xem dashboard tổng quan với các chỉ số quan trọng của toàn hệ thống hoặc của courses mình quản lý.

**Quy trình:**

1. Admin truy cập dashboard analytics
2. Gọi API GET /api/analytics/dashboard với query params (startDate, endDate)
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Nếu là teacher: lọc data theo courses của teacher
6. Nếu là admin: lấy data của toàn hệ thống
7. Tính toán overview metrics:
   - Total students count
   - Total courses count
   - Total enrollments
   - Active users (last 7/30 days)
   - Total revenue
   - Average course rating
8. Tính toán growth metrics:
   - New students (compared to previous period)
   - New enrollments trend
   - Revenue growth
9. Lấy top performing courses
10. Lấy recent activities
11. Tạo charts data (enrollments over time, popular categories, etc.)
12. Trả về dashboard data

**Collections sử dụng:**

- **users**: Đếm students, active users
- **courses**: Đếm courses, lấy top courses
- **analytics**: Lấy aggregated data
- **progress**: Tính completion rates

---

### 11.4. Workflow Export Analytics Khóa Học Ra CSV

**Mô tả:**
Admin xuất dữ liệu analytics của khóa học ra file CSV để phân tích offline.

**Quy trình:**

1. Admin click nút export trên trang analytics
2. Chọn time range và metrics muốn export
3. Gọi API GET /api/analytics/export với query params (courseId, startDate, endDate, metrics)
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher (owner)
6. Validate params
7. Lấy analytics data theo filter
8. Lấy chi tiết students enrollment và progress
9. Format data thành CSV format với các columns:
   - Student Name, Email
   - Enrollment Date
   - Progress Percentage
   - Completed Lessons
   - Quiz Scores
   - Last Activity Date
   - Completion Date (if completed)
10. Generate CSV file
11. Set response headers for file download
12. Trả về CSV file stream

**Collections sử dụng:**

- **courses**: Verify course
- **analytics**: Lấy analytics data
- **progress**: Lấy student progress details
- **users**: Lấy student info
- **quizAttempts**: Lấy quiz scores

---

### 11.5. Workflow Tạo Báo Cáo Chi Tiết Của Sinh Viên

**Mô tả:**
Admin tạo báo cáo toàn diện về học tập của một sinh viên (có thể export PDF/CSV).

**Quy trình:**

1. Admin truy cập student profile
2. Click nút generate report
3. Gọi API GET /api/analytics/student-report/:userId với query params (courseId, format)
4. Hệ thống xác thực admin
5. Validate user ID
6. Kiểm tra quyền (student xem của mình, teacher/admin xem của bất kỳ ai)
7. Lấy comprehensive data:
   - Student basic info và profile
   - All enrolled courses với progress
   - Detailed lesson completion history
   - All quiz attempts với scores và answers
   - Discussion và comment activity
   - Certificates earned
   - Learning milestones và achievements
   - Time spent statistics
8. Nếu có courseId: filter data theo course cụ thể
9. Generate report theo format (JSON/PDF/CSV)
10. Include charts và visualizations (nếu PDF)
11. Trả về report file

**Collections sử dụng:**

- **users**: Lấy student info
- **userProfiles**: Lấy detailed profile
- **courses**: Lấy enrolled courses
- **progress**: Lấy detailed progress
- **quizAttempts**: Lấy all attempts với details
- **discussions**: Lấy student discussions
- **comments**: Lấy student comments

---

### 11.6. Workflow Kích Hoạt Thu Thập Analytics Thủ Công

**Mô tả:**
Admin kích hoạt quá trình thu thập và tính toán analytics thủ công (thường chạy tự động theo cron job).

**Quy trình:**

1. Admin truy cập admin panel
2. Click nút "Collect Analytics Now" hoặc "Refresh Analytics"
3. Gọi API POST /api/analytics/collect
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin (chỉ admin mới được trigger)
6. Validate không có collection job nào đang chạy
7. Bắt đầu analytics collection process:
   - Traverse tất cả courses
   - Calculate current metrics cho mỗi course
   - Aggregate student data
   - Calculate growth rates và trends
   - Update analytics collection
8. Create analytics snapshot với timestamp
9. Update lastCollectedAt timestamp
10. Trả về status và summary của collection

**Collections sử dụng:**

- **analytics**: Tạo hoặc cập nhật analytics documents
- **courses**: Đọc tất cả courses
- **progress**: Aggregate progress data
- **quizAttempts**: Aggregate quiz data
- **discussions**: Aggregate engagement data

---

**KẾT THÚC PHẦN 2**

Phần 2 này đã bao gồm 5 phần cuối của admin workflows: 7. Quản lý Live Session (9 workflows) 8. Quản lý Discussion (7 workflows) 9. Quản lý Comment (4 workflows) 10. Quản lý Notification (8 workflows) 11. Quản lý Analytics và Báo cáo (6 workflows)

**Tổng cộng: 34 workflows trong phần 2**

---

## TỔNG KẾT TOÀN BỘ ADMIN WORKFLOWS

**Phần 1: 42 workflows**

- Quản lý tài khoản và xác thực (8)
- Quản lý người dùng (8)
- Quản lý khóa học (9)
- Quản lý chapter (4)
- Quản lý lesson (7)
- Quản lý quiz (6)

**Phần 2: 34 workflows**

- Quản lý Live Session (9)
- Quản lý Discussion (7)
- Quản lý Comment (4)
- Quản lý Notification (8)
- Quản lý Analytics và Báo cáo (6)

**TỔNG CỘNG: 76 workflows đầy đủ cho Admin**

Tất cả workflows đã được mô tả chi tiết với:
✅ Quy trình từng bước
✅ API endpoints được sử dụng
✅ Collections trong MongoDB được đọc/ghi
✅ Gói tin gửi đi (Socket.IO, Cloudinary, SendGrid)
✅ Kiểm tra quyền và validation
