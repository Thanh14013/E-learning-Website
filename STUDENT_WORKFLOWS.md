# 📚 STUDENT WORKFLOWS - E-LEARNING PLATFORM

> **Tài liệu mô tả chi tiết các workflow của Student trong hệ thống E-Learning**
>
> **Ngày cập nhật:** 15/12/2025

---

## 📋 DANH SÁCH CÁC WORKFLOW

### 1. AUTHENTICATION & ACCOUNT MANAGEMENT

- **1.1. Workflow Đăng ký tài khoản**
- **1.2. Workflow Xác thực email**
- **1.3. Workflow Đăng nhập**
- **1.4. Workflow Quên mật khẩu**
- **1.5. Workflow Đặt lại mật khẩu**
- **1.6. Workflow Gửi lại email xác thực**
- **1.7. Workflow Đăng xuất**
- **1.8. Workflow Refresh token**

### 2. PROFILE MANAGEMENT

- **2.1. Workflow Xem thông tin cá nhân**
- **2.2. Workflow Cập nhật thông tin cá nhân**
- **2.3. Workflow Upload avatar**

### 3. COURSE DISCOVERY & ENROLLMENT

- **3.1. Workflow Duyệt danh sách khóa học (Browse Courses)**
- **3.2. Workflow Tìm kiếm khóa học**
- **3.3. Workflow Lọc khóa học theo category, level, giá**
- **3.4. Workflow Sắp xếp khóa học (newest, popular, rating)**
- **3.5. Workflow Xem chi tiết khóa học**
- **3.6. Workflow Đăng ký khóa học (Enroll)**
- **3.7. Workflow Xem danh sách khóa học đã đăng ký**
- **3.8. Workflow Hủy đăng ký khóa học (Unenroll)**

### 4. LEARNING - LESSONS & CONTENT

- **4.1. Workflow Xem cấu trúc khóa học (Chapters & Lessons)**
- **4.2. Workflow Xem chi tiết bài học**
- **4.3. Workflow Xem video bài học**
- **4.4. Workflow Download tài liệu bài học**
- **4.5. Workflow Cập nhật tiến độ xem video**
- **4.6. Workflow Đánh dấu bài học hoàn thành**
- **4.7. Workflow Xem tiến độ khóa học**

### 5. QUIZZES & ASSESSMENT

- **5.1. Workflow Xem chi tiết quiz**
- **5.2. Workflow Bắt đầu làm quiz (Start Quiz Attempt)**
- **5.3. Workflow Nộp bài quiz (Submit Quiz)**
- **5.4. Workflow Xem lịch sử các lần làm quiz**
- **5.5. Workflow Xem kết quả chi tiết một lần làm quiz**

### 6. DISCUSSIONS & COMMUNITY

- **6.1. Workflow Xem danh sách discussions trong khóa học**
- **6.2. Workflow Xem chi tiết một discussion**
- **6.3. Workflow Tạo discussion mới**
- **6.4. Workflow Cập nhật discussion của mình**
- **6.5. Workflow Xóa discussion của mình**
- **6.6. Workflow Like/Unlike discussion**
- **6.7. Workflow Comment vào discussion**
- **6.8. Workflow Cập nhật comment của mình**
- **6.9. Workflow Xóa comment của mình**
- **6.10. Workflow Like/Unlike comment**

### 7. LIVE SESSIONS

- **7.1. Workflow Xem danh sách live sessions theo khóa học**
- **7.2. Workflow Xem chi tiết live session**
- **7.3. Workflow Tham gia live session (Join Session)**
- **7.4. Workflow Kết nối WebRTC cho video call**
- **7.5. Workflow Tương tác trong session (camera, mic, screen share)**

### 8. NOTIFICATIONS

- **8.1. Workflow Xem danh sách thông báo**
- **8.2. Workflow Đếm số thông báo chưa đọc**
- **8.3. Workflow Đánh dấu một thông báo đã đọc**
- **8.4. Workflow Đánh dấu tất cả thông báo đã đọc**
- **8.5. Workflow Xóa một thông báo**
- **8.6. Workflow Xóa tất cả thông báo**
- **8.7. Workflow Xem cài đặt thông báo (Notification Preferences)**
- **8.8. Workflow Cập nhật cài đặt thông báo**

### 9. ANALYTICS & PROGRESS TRACKING

- **9.1. Workflow Xem thống kê học tập cá nhân**
- **9.2. Workflow Xem báo cáo chi tiết của student**

---

## 📊 COLLECTIONS TRONG DATABASE

### Collections được sử dụng trong Student Workflows:

1. **users** - Thông tin tài khoản và profile student
2. **userProfiles** - Thông tin mở rộng của user
3. **courses** - Thông tin khóa học
4. **chapters** - Chương trong khóa học
5. **lessons** - Bài học trong chương
6. **media** - Video, tài liệu đính kèm
7. **progress** - Tiến độ học tập của student
8. **quizzes** - Bài quiz/bài kiểm tra
9. **questions** - Câu hỏi trong quiz
10. **quizAttempts** - Lịch sử làm quiz của student
11. **discussions** - Bài viết thảo luận
12. **comments** - Bình luận trong discussions
13. **liveSessions** - Buổi học trực tuyến
14. **notifications** - Thông báo cho student
15. **analytics** - Thống kê và phân tích

---

## 🔗 SOCKET.IO EVENTS (Real-time)

### Events Student có thể nhận:

- `notification:new` - Thông báo mới
- `discussion:new` - Discussion mới trong khóa học
- `comment:new` - Comment mới trong discussion
- `session:start` - Live session bắt đầu
- `session:end` - Live session kết thúc
- `progress:update` - Cập nhật tiến độ học

### Events Student có thể gửi:

- `session:join` - Tham gia session
- `session:leave` - Rời khỏi session
- `discussion:typing` - Đang typing comment
- `webrtc:signal` - Tín hiệu WebRTC

---

## 📝 GHI CHÚ

- Tất cả các API yêu cầu authentication sẽ cần **Bearer Token** trong header
- Token có thời hạn 24 giờ, cần refresh khi hết hạn
- Các workflow liên quan đến file upload sử dụng **multipart/form-data**
- Pagination được áp dụng cho các API list với params: `page`, `limit`
- Search và filter sử dụng query parameters

---

**Tiếp theo:** Chi tiết từng workflow sẽ được mô tả trong các phần tiếp theo.
