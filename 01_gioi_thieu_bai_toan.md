# 1. Giới thiệu bài toán

## 1.1 Bối cảnh và nhu cầu thực tiễn

Trong bối cảnh công nghệ phát triển nhanh chóng và đại dịch COVID-19 đã thay đổi cách thức giáo dục toàn cầu, nhu cầu về các nền tảng học tập trực tuyến (e-learning) ngày càng trở nên cấp thiết. Theo báo cáo của UNESCO, hơn 1.6 tỷ học sinh trên toàn thế giới đã phải chuyển sang hình thức học trực tuyến, và xu hướng này tiếp tục duy trì ngay cả khi tình hình dịch bệnh được kiểm soát.

**[ẢNH: Biểu đồ thống kê về sự tăng trưởng của thị trường e-learning toàn cầu từ 2020-2026]**

Các nền tảng e-learning truyền thống thường gặp phải một số vấn đề:

- **Thiếu tính tương tác**: Học viên không thể trao đổi trực tiếp với giảng viên và bạn học
- **Quản lý nội dung kém**: Khó khăn trong việc tổ chức và theo dõi tiến độ học tập
- **Trải nghiệm người dùng chưa tốt**: Giao diện phức tạp, khó sử dụng
- **Thiếu công cụ đánh giá**: Không có hệ thống kiểm tra và đánh giá tự động
- **Phân quyền không rõ ràng**: Không phân biệt vai trò giữa học viên, giảng viên và quản trị viên

Do đó, việc xây dựng một hệ thống quản lý học tập trực tuyến (Learning Management System - LMS) hiện đại, tích hợp đầy đủ các tính năng tương tác, quản lý nội dung thông minh, và hỗ trợ đa vai trò là một nhu cầu thực sự cần thiết.

## 1.2 Mục tiêu hệ thống

### 1.2.1 Mục tiêu chính

Xây dựng một nền tảng e-learning toàn diện với các mục tiêu sau:

1. **Tạo môi trường học tập tương tác cao**

   - Hỗ trợ giao tiếp real-time giữa giảng viên và học viên
   - Diễn đàn thảo luận cho từng khóa học và bài học
   - Hệ thống chat trực tiếp 1-1 giữa học viên và giảng viên

2. **Quản lý nội dung khóa học hiệu quả**

   - Cấu trúc khóa học đa tầng (Course → Chapter → Lesson → Quiz)
   - Hỗ trợ đa dạng định dạng nội dung (video, văn bản, tài liệu đính kèm)
   - Upload và quản lý media thông qua cloud storage

3. **Theo dõi tiến độ học tập tự động**

   - Tính toán tiến độ hoàn thành khóa học tự động
   - Lưu trữ lịch sử học tập của từng học viên
   - Hiển thị thống kê và báo cáo chi tiết

4. **Hệ thống phân quyền rõ ràng**
   - **Student (Học viên)**: Đăng ký, học tập, làm bài kiểm tra, tham gia thảo luận
   - **Teacher (Giảng viên)**: Tạo và quản lý khóa học, theo dõi học viên, phân tích dữ liệu
   - **Admin (Quản trị viên)**: Quản lý người dùng, phê duyệt khóa học, giám sát hệ thống

**[ẢNH: Sơ đồ use case tổng quan với 3 actors chính: Student, Teacher, Admin]**

### 1.2.2 Mục tiêu kỹ thuật

- **Hiệu năng cao**: Xử lý đồng thời nhiều người dùng với response time < 2s
- **Bảo mật tốt**: Áp dụng JWT authentication, mã hóa dữ liệu nhạy cảm
- **Scalability**: Kiến trúc cho phép mở rộng dễ dàng
- **User Experience**: Giao diện thân thiện, responsive trên mọi thiết bị
- **Maintainability**: Code clean, có tổ chức, dễ bảo trì và mở rộng

## 1.3 Phạm vi dự án

### 1.3.1 Các chức năng chính được triển khai

**Quản lý người dùng và xác thực:**

- Đăng ký, đăng nhập với email/password và Google OAuth
- Phân quyền dựa trên vai trò (RBAC - Role-Based Access Control)
- Quản lý hồ sơ cá nhân, đổi mật khẩu
- Xác thực giảng viên với CV upload và admin approval

**Quản lý khóa học:**

- Tạo, sửa, xóa khóa học với đầy đủ metadata
- Cấu trúc phân cấp: Course → Chapter → Lesson
- Upload thumbnail, video lessons, tài liệu đính kèm
- Hệ thống quiz với nhiều loại câu hỏi (multiple choice, true/false)
- Enrollment system cho học viên

**Tính năng tương tác:**

- Discussion forums cho khóa học và bài học
- Comment và reply với nested structure
- Real-time chat giữa student-teacher
- Notification system với Socket.IO

**Analytics và báo cáo:**

- Dashboard riêng cho từng vai trò
- Thống kê tiến độ học tập của học viên
- Báo cáo hiệu suất khóa học cho giảng viên
- System analytics cho admin

**[ẢNH: Sơ đồ mindmap các chức năng chính của hệ thống]**

### 1.3.2 Giới hạn phạm vi

Trong phạm vi dự án hiện tại, một số tính năng chưa được triển khai:

- Video conferencing real-time với WebRTC (dự kiến phát triển trong tương lai)
- Mobile application native (iOS/Android)
- Payment gateway integration
- AI-powered content recommendation
- Gamification với badges và leaderboards

## 1.4 Đối tượng sử dụng

### 1.4.1 Học viên (Students)

**Đặc điểm:**

- Độ tuổi: 16-45
- Mục đích: Học tập các kỹ năng mới, nâng cao trình độ chuyên môn
- Trình độ công nghệ: Cơ bản đến trung bình

**Nhu cầu:**

- Tìm kiếm và đăng ký khóa học dễ dàng
- Học tập với video, tài liệu chất lượng cao
- Làm bài kiểm tra và nhận feedback ngay lập tức
- Trao đổi với giảng viên và học viên khác
- Theo dõi tiến độ học tập của bản thân

### 1.4.2 Giảng viên (Teachers)

**Đặc điểm:**

- Chuyên gia trong lĩnh vực cụ thể
- Có kinh nghiệm giảng dạy trực tuyến hoặc offline
- Trình độ công nghệ: Trung bình đến cao

**Nhu cầu:**

- Tạo và quản lý khóa học một cách dễ dàng
- Upload và tổ chức nội dung học tập
- Theo dõi tiến độ của từng học viên
- Tương tác với học viên qua discussion và chat
- Xem báo cáo và phân tích về khóa học

**[ẢNH: Personas của 2 đối tượng chính - Student và Teacher]**

### 1.4.3 Quản trị viên (Administrators)

**Đặc điểm:**

- Quản lý nền tảng
- Trình độ công nghệ: Cao
- Có hiểu biết về content moderation

**Nhu cầu:**

- Quản lý người dùng (ban, unban, change role)
- Phê duyệt giảng viên và khóa học
- Giám sát hoạt động hệ thống
- Xem báo cáo tổng thể về platform
- Xử lý các báo cáo vi phạm

---

**Kết luận phần 1:**

Với bối cảnh e-learning phát triển mạnh mẽ và nhu cầu thực tế về một nền tảng học tập trực tuyến hiện đại, dự án hướng đến việc xây dựng một LMS toàn diện với đầy đủ các tính năng quản lý, tương tác, và phân tích. Hệ thống phục vụ ba đối tượng chính với các nhu cầu khác nhau, đồng thời đảm bảo tính mở rộng cho các tính năng nâng cao trong tương lai.
