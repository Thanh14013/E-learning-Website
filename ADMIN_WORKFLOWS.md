# DANH SÁCH CÁC WORKFLOW CỦA ADMIN

## Mục lục

### 1. QUẢN LÝ TÀI KHOẢN VÀ XÁC THỰC

- 1.1. Workflow đăng nhập admin (hardcoded credentials)
- 1.2. Workflow đăng xuất
- 1.3. Workflow làm mới token

**Lưu ý**: Admin không thể đăng ký tài khoản. Chỉ có duy nhất 1 tài khoản admin được cấu hình trong file .env với:

- ADMIN_ACC=thanh123
- ADMIN_PASS=nguyenvuthanh

### 2. QUẢN LÝ NGƯỜI DÙNG

- 2.1. Workflow xem danh sách người dùng
- 2.2. Workflow xem thông tin chi tiết người dùng
- 2.3. Workflow cập nhật vai trò người dùng
- 2.4. Workflow cấm/bỏ cấm người dùng
- 2.5. Workflow xóa người dùng
- 2.6. Workflow xem profile cá nhân admin
- 2.7. Workflow cập nhật profile cá nhân admin
- 2.8. Workflow upload avatar admin

### 3. QUẢN LÝ KHÓA HỌC

- 3.1. Workflow tạo khóa học mới
- 3.2. Workflow upload thumbnail cho khóa học
- 3.3. Workflow xem danh sách tất cả khóa học
- 3.4. Workflow xem chi tiết khóa học
- 3.5. Workflow cập nhật thông tin khóa học
- 3.6. Workflow xuất bản/ẩn khóa học
- 3.7. Workflow xóa khóa học
- 3.8. Workflow xem danh sách sinh viên đã đăng ký khóa học
- 3.9. Workflow xem các khóa học do admin tạo

### 4. QUẢN LÝ CHAPTER (CHƯƠNG HỌC)

- 4.1. Workflow tạo chapter mới
- 4.2. Workflow cập nhật thông tin chapter
- 4.3. Workflow sắp xếp lại thứ tự các chapter
- 4.4. Workflow xóa chapter

### 5. QUẢN LÝ LESSON (BÀI HỌC)

- 5.1. Workflow tạo lesson mới
- 5.2. Workflow cập nhật thông tin lesson
- 5.3. Workflow upload video cho lesson
- 5.4. Workflow upload tài nguyên cho lesson
- 5.5. Workflow xóa tài nguyên của lesson
- 5.6. Workflow xem chi tiết lesson
- 5.7. Workflow xóa lesson

### 6. QUẢN LÝ QUIZ (BÀI KIỂM TRA)

- 6.1. Workflow tạo quiz mới
- 6.2. Workflow cập nhật quiz
- 6.3. Workflow xem chi tiết quiz
- 6.4. Workflow xóa quiz
- 6.5. Workflow xem danh sách attempt của quiz
- 6.6. Workflow xem kết quả chi tiết của một attempt

### 7. QUẢN LÝ LIVE SESSION (BUỔI HỌC TRỰC TIẾP)

- 7.1. Workflow tạo live session mới
- 7.2. Workflow xem danh sách session của một khóa học
- 7.3. Workflow xem chi tiết session
- 7.4. Workflow cập nhật thông tin session
- 7.5. Workflow bắt đầu session
- 7.6. Workflow kết thúc session
- 7.7. Workflow xem các session do admin tạo
- 7.8. Workflow xóa session

### 8. QUẢN LÝ DISCUSSION (THẢO LUẬN)

- 8.1. Workflow tạo discussion mới
- 8.2. Workflow xem danh sách discussion của khóa học
- 8.3. Workflow xem chi tiết discussion
- 8.4. Workflow cập nhật discussion
- 8.5. Workflow xóa discussion
- 8.6. Workflow like/unlike discussion
- 8.7. Workflow ghim/bỏ ghim discussion

### 9. QUẢN LÝ COMMENT (BÌNH LUẬN)

- 9.1. Workflow tạo comment trên discussion
- 9.2. Workflow cập nhật comment
- 9.3. Workflow xóa comment
- 9.4. Workflow like/unlike comment

### 10. QUẢN LÝ NOTIFICATION (THÔNG BÁO)

- 10.1. Workflow xem danh sách thông báo
- 10.2. Workflow xem số lượng thông báo chưa đọc
- 10.3. Workflow đánh dấu một thông báo đã đọc
- 10.4. Workflow đánh dấu tất cả thông báo đã đọc
- 10.5. Workflow xóa một thông báo
- 10.6. Workflow xóa tất cả thông báo
- 10.7. Workflow xem cài đặt thông báo
- 10.8. Workflow cập nhật cài đặt thông báo

### 11. QUẢN LÝ ANALYTICS VÀ BÁO CÁO

- 11.1. Workflow xem analytics của khóa học
- 11.2. Workflow xem analytics của sinh viên
- 11.3. Workflow xem dashboard analytics tổng quan
- 11.4. Workflow export analytics khóa học ra CSV
- 11.5. Workflow tạo báo cáo chi tiết của sinh viên
- 11.6. Workflow kích hoạt thu thập analytics thủ công

---

**Lưu ý:**

- Các workflow chi tiết sẽ được mô tả trong các file ADMIN_WORKFLOWS_PART1.md và ADMIN_WORKFLOWS_PART2.md
- Mỗi workflow sẽ bao gồm: mô tả quy trình, API được gọi, và các collection trong database được sử dụng
