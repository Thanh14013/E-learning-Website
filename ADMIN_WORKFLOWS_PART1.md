# ADMIN WORKFLOWS - PHẦN 1

## 1. QUẢN LÝ TÀI KHOẢN VÀ XÁC THỰC

**LƯU Ý QUAN TRỌNG:**

- Admin KHÔNG THỂ đăng ký tài khoản qua API
- Chỉ có DUY NHẤT 1 tài khoản admin được cấu hình trong file .env
- Thông tin đăng nhập admin hardcoded:
  - Username: ADMIN_ACC=thanh123
  - Password: ADMIN_PASS=nguyenvuthanh

---

### 1.1. Workflow Đăng Nhập Admin

**Mô tả:**
Admin đăng nhập vào hệ thống bằng email và mật khẩu.

**Quy trình:**

1. Admin nhập email và password
2. Gọi API POST /api/auth/login
3. Hệ thống tìm user theo email
4. Kiểm tra tài khoản có tồn tại không
5. Kiểm tra tài khoản đã được xác thực chưa
6. Kiểm tra tài khoản có bị cấm không
7. So sánh mật khẩu với hash trong database
8. Tạo access token (JWT, thời gian ngắn - 15 phút)
9. Tạo refresh token (JWT, thời gian dài - 7 ngày)
10. Lưu refresh token vào database
11. Trả về access token, refresh token và thông tin user

**Collections sử dụng:**

- **users**: Đọc thông tin user, kiểm tra credentials, lưu refreshToken

---

**Mô tả:**
Admin đăng xuất khỏi hệ thống, hủy session hiện tại.

**Quy trình:**

1. Admin click nút đăng xuất
2. Gọi API POST /api/auth/logout (kèm access token trong header)
3. Hệ thống xác thực token
4. Xóa refresh token từ cookie
5. Trả về thông báo đăng xuất thành công

**Lưu ý:** Admin không có user record trong database nên không cần xóa refreshToken từ DB

---

### 1.3. Workflow Làm Mới Token

**Mô tả:**
Khi access token hết hạn, admin sử dụng refresh token để lấy access token mới.

**Quy trình:**

1. Client phát hiện access token hết hạn
2. Gọi API POST /api/auth/refresh-token với refresh token
3. Hệ thống validate refresh token
4. Giải mã refresh token để lấy user ID
5. Tìm user trong database
6. Kiểm tra refresh token khớp với database không
7. Kiểm tra tài khoản có bị cấm không
8. Tạo access token mới
9. Trả về access token mới

**Collections sử dụng:**

- **users**: Đọc và so sánh refreshToken

---

**LƯU Ý:** Admin không có workflow quên mật khẩu hoặc gửi lại email xác thực vì sử dụng hardcoded credentials từ .env file. Để thay đổi mật khẩu admin, cần cập nhật trực tiếp trong file .env và restart server.

---

**Mô tả:**
Admin chưa nhận được hoặc email xác thực đã hết hạn, yêu cầu gửi lại email xác thực.

**Quy trình:**

1. Admin đăng nhập (nếu chưa xác thực, vẫn có thể đăng nhập nhưng bị giới hạn chức năng)
2. Gọi API POST /api/auth/resend-verification
3. Hệ thống kiểm tra user đã xác thực chưa
4. Nếu chưa xác thực, tạo verification token mới
5. Cập nhật token và thời gian hết hạn vào database
6. Gửi lại email xác thực
7. Trả về thông báo đã gửi email

**Collections sử dụng:**

- **users**: Cập nhật verificationToken và verificationTokenExpires

**Gói tin gửi đi:**

- Gửi email xác thực qua SendGrid service

---

## 2. QUẢN LÝ NGƯỜI DÙNG

### 2.1. Workflow Xem Danh Sách Người Dùng

**Mô tả:**
Admin xem danh sách tất cả người dùng trong hệ thống với các tùy chọn lọc, tìm kiếm và phân trang.

**Quy trình:**

1. Admin truy cập trang quản lý người dùng
2. Gọi API GET /api/users/list với các query params (page, limit, role, search, sortBy, order)
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin
5. Xây dựng query filter dựa trên params
6. Đếm tổng số user phù hợp
7. Lấy danh sách user với phân trang
8. Populate thông tin profile cho mỗi user
9. Trả về danh sách user và metadata (total, page, totalPages)

**Collections sử dụng:**

- **users**: Đọc danh sách users với filters
- **userProfiles**: Populate thông tin profile (avatar, bio, phone, etc.)

---

### 2.2. Workflow Xem Thông Tin Chi Tiết Người Dùng

**Mô tả:**
Admin xem thông tin chi tiết của một người dùng cụ thể, bao gồm profile và các hoạt động.

**Quy trình:**

1. Admin click vào một user trong danh sách
2. Gọi API GET /api/users/profile (với user ID cụ thể hoặc qua route riêng)
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin
5. Tìm user theo ID
6. Populate thông tin profile
7. Lấy thống kê liên quan (số khóa học đã tạo nếu là teacher, số khóa học đã đăng ký nếu là student)
8. Trả về thông tin đầy đủ

**Collections sử dụng:**

- **users**: Đọc thông tin user
- **userProfiles**: Đọc profile chi tiết
- **courses**: Đếm số khóa học liên quan

---

### 2.3. Workflow Cập Nhật Vai Trò Người Dùng

**Mô tả:**
Admin thay đổi vai trò của người dùng (student, teacher, admin).

**Quy trình:**

1. Admin chọn user cần thay đổi vai trò
2. Chọn vai trò mới từ dropdown
3. Gọi API PUT /api/users/:id/role với role mới
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin
6. Validate role mới (phải là 'student', 'teacher', hoặc 'admin')
7. Tìm user theo ID
8. Kiểm tra user có tồn tại không
9. Cập nhật role mới
10. Tạo notification cho user về thay đổi vai trò
11. Trả về thông tin user đã cập nhật

**Collections sử dụng:**

- **users**: Cập nhật role field
- **notifications**: Tạo thông báo về thay đổi vai trò

---

### 2.4. Workflow Cấm/Bỏ Cấm Người Dùng

**Mô tả:**
Admin cấm hoặc bỏ cấm tài khoản người dùng vi phạm quy định.

**Quy trình:**

1. Admin chọn user cần cấm/bỏ cấm
2. Click nút ban/unban
3. Gọi API PUT /api/users/:id/ban với trạng thái isBanned
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin
6. Tìm user theo ID
7. Kiểm tra không thể tự ban chính mình
8. Toggle trạng thái isBanned
9. Nếu ban: xóa tất cả refresh token (logout user khỏi mọi thiết bị)
10. Tạo notification cho user về trạng thái tài khoản
11. Trả về thông tin user đã cập nhật

**Collections sử dụng:**

- **users**: Cập nhật isBanned, xóa refreshToken nếu ban
- **notifications**: Tạo thông báo về trạng thái tài khoản

---

### 2.5. Workflow Xóa Người Dùng

**Mô tả:**
Admin xóa vĩnh viễn tài khoản người dùng và tất cả dữ liệu liên quan.

**Quy trình:**

1. Admin chọn user cần xóa
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/users/:id
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin
6. Tìm user theo ID
7. Kiểm tra không thể tự xóa chính mình
8. Xóa user profile
9. Xóa tất cả courses do user tạo (nếu là teacher)
10. Xóa tất cả enrollments (nếu là student)
11. Xóa tất cả discussions và comments của user
12. Xóa tất cả notifications của user
13. Xóa tất cả progress records
14. Xóa user khỏi database
15. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **users**: Xóa user document
- **userProfiles**: Xóa profile
- **courses**: Xóa courses của teacher hoặc remove enrollment của student
- **discussions**: Xóa discussions của user
- **comments**: Xóa comments của user
- **notifications**: Xóa notifications của user
- **progress**: Xóa progress records

---

### 2.6. Workflow Xem Profile Cá Nhân Admin

**Mô tả:**
Admin xem thông tin profile của chính mình.

**Quy trình:**

1. Admin truy cập trang profile cá nhân
2. Gọi API GET /api/users/profile
3. Hệ thống xác thực admin
4. Lấy user ID từ token
5. Tìm user và populate profile
6. Trả về thông tin đầy đủ của admin

**Collections sử dụng:**

- **users**: Đọc thông tin user
- **userProfiles**: Đọc profile chi tiết (avatar, bio, phone, social links, etc.)

---

### 2.7. Workflow Cập Nhật Profile Cá Nhân Admin

**Mô tả:**
Admin cập nhật thông tin profile cá nhân (name, bio, phone, social links).

**Quy trình:**

1. Admin chỉnh sửa thông tin trong form profile
2. Click nút save
3. Gọi API PUT /api/users/profile với dữ liệu mới
4. Hệ thống xác thực admin
5. Lấy user ID từ token
6. Validate dữ liệu đầu vào
7. Cập nhật thông tin trong users collection (name)
8. Cập nhật thông tin trong userProfiles collection (bio, phone, socialLinks, etc.)
9. Trả về profile đã cập nhật

**Collections sử dụng:**

- **users**: Cập nhật name nếu có thay đổi
- **userProfiles**: Cập nhật bio, phone, socialLinks, website, address, dateOfBirth

---

### 2.8. Workflow Upload Avatar Admin

**Mô tả:**
Admin upload hoặc thay đổi ảnh đại diện của mình.

**Quy trình:**

1. Admin chọn file ảnh từ máy tính
2. Gọi API POST /api/users/avatar với file ảnh
3. Hệ thống xác thực admin
4. Validate file (định dạng, kích thước)
5. Upload ảnh lên Cloudinary
6. Lấy URL ảnh từ Cloudinary
7. Nếu có avatar cũ trên Cloudinary, xóa ảnh cũ
8. Cập nhật avatar URL vào userProfile
9. Trả về URL avatar mới

**Collections sử dụng:**

- **userProfiles**: Cập nhật avatar URL

**Gói tin gửi đi:**

- Upload file lên Cloudinary service

---

## 3. QUẢN LÝ KHÓA HỌC

### 3.1. Workflow Tạo Khóa Học Mới

**Mô tả:**
Admin tạo một khóa học mới trong hệ thống.

**Quy trình:**

1. Admin truy cập trang tạo khóa học
2. Điền thông tin khóa học (title, description, category, level, price, language)
3. Gọi API POST /api/courses với thông tin khóa học
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate dữ liệu đầu vào
7. Tạo course document với instructor = admin ID
8. Khởi tạo các field mặc định (isPublished = false, enrollmentCount = 0, rating = 0)
9. Lưu course vào database
10. Tạo notification cho admin về khóa học mới
11. Trả về thông tin khóa học đã tạo

**Collections sử dụng:**

- **courses**: Tạo document mới với thông tin khóa học
- **notifications**: Tạo thông báo cho admin

---

### 3.2. Workflow Upload Thumbnail Cho Khóa Học

**Mô tả:**
Admin upload ảnh thumbnail cho khóa học.

**Quy trình:**

1. Admin chọn file ảnh thumbnail
2. Gọi API POST /api/courses/:id/thumbnail với file ảnh
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Validate course ID
6. Tìm course trong database
7. Kiểm tra admin có quyền chỉnh sửa course không (là instructor hoặc admin)
8. Validate file ảnh
9. Upload ảnh lên Cloudinary
10. Nếu có thumbnail cũ, xóa ảnh cũ trên Cloudinary
11. Cập nhật thumbnail URL vào course
12. Trả về thông tin course đã cập nhật

**Collections sử dụng:**

- **courses**: Cập nhật thumbnail URL

**Gói tin gửi đi:**

- Upload file lên Cloudinary service

---

### 3.3. Workflow Xem Danh Sách Tất Cả Khóa Học

**Mô tả:**
Admin xem danh sách tất cả khóa học trong hệ thống với các tùy chọn lọc và tìm kiếm.

**Quy trình:**

1. Admin truy cập trang quản lý khóa học
2. Gọi API GET /api/courses với query params (page, limit, category, level, search, sortBy, order)
3. Xây dựng query filter dựa trên params
4. Đếm tổng số khóa học phù hợp
5. Lấy danh sách khóa học với phân trang
6. Populate thông tin instructor
7. Tính toán các thống kê (rating trung bình, số học viên)
8. Trả về danh sách khóa học và metadata

**Collections sử dụng:**

- **courses**: Đọc danh sách courses với filters
- **users**: Populate thông tin instructor

---

### 3.4. Workflow Xem Chi Tiết Khóa Học

**Mô tả:**
Admin xem thông tin chi tiết của một khóa học, bao gồm chapters, lessons, và thống kê.

**Quy trình:**

1. Admin click vào một khóa học
2. Gọi API GET /api/courses/:id
3. Validate course ID
4. Tìm course trong database
5. Populate thông tin instructor
6. Lấy danh sách chapters và lessons của course (sorted by order)
7. Populate lesson videos và resources
8. Lấy thống kê enrollment, completion rate
9. Nếu admin đã enroll, lấy progress của admin
10. Trả về thông tin đầy đủ

**Collections sử dụng:**

- **courses**: Đọc thông tin course
- **users**: Populate instructor
- **chapters**: Lấy danh sách chapters của course
- **lessons**: Lấy danh sách lessons trong mỗi chapter
- **media**: Populate video và resources
- **progress**: Lấy progress nếu admin đã enroll

---

### 3.5. Workflow Cập Nhật Thông Tin Khóa Học

**Mô tả:**
Admin cập nhật thông tin của khóa học (title, description, category, level, price, etc.).

**Quy trình:**

1. Admin chỉnh sửa thông tin khóa học trong form
2. Click nút save
3. Gọi API PUT /api/courses/:id với dữ liệu mới
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate course ID và dữ liệu đầu vào
7. Tìm course trong database
8. Kiểm tra admin có quyền chỉnh sửa không (là instructor hoặc admin)
9. Cập nhật các field được phép thay đổi
10. Lưu course đã cập nhật
11. Tạo notification cho các học viên đã enroll về cập nhật khóa học
12. Trả về course đã cập nhật

**Collections sử dụng:**

- **courses**: Cập nhật thông tin course
- **notifications**: Tạo thông báo cho enrolled students

---

### 3.6. Workflow Xuất Bản/Ẩn Khóa Học

**Mô tả:**
Admin xuất bản khóa học để công khai hoặc ẩn khóa học khỏi danh sách public.

**Quy trình:**

1. Admin click nút publish/unpublish
2. Gọi API PUT /api/courses/:id/publish
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Validate course ID
6. Tìm course trong database
7. Kiểm tra admin có quyền không
8. Kiểm tra khóa học đã có đủ nội dung chưa (ít nhất 1 chapter và 1 lesson) trước khi publish
9. Toggle trạng thái isPublished
10. Nếu publish: tạo notification cho followers của instructor
11. Trả về course đã cập nhật

**Collections sử dụng:**

- **courses**: Cập nhật isPublished
- **notifications**: Tạo thông báo cho followers khi publish

---

### 3.7. Workflow Xóa Khóa Học

**Mô tả:**
Admin xóa vĩnh viễn một khóa học và tất cả dữ liệu liên quan.

**Quy trình:**

1. Admin chọn khóa học cần xóa
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/courses/:id
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate course ID
7. Tìm course trong database
8. Kiểm tra admin có quyền xóa không
9. Xóa tất cả chapters của course
10. Xóa tất cả lessons của course
11. Xóa tất cả media (videos, resources) trên Cloudinary
12. Xóa tất cả quizzes của course
13. Xóa tất cả quiz attempts
14. Xóa tất cả discussions của course
15. Xóa tất cả enrollments
16. Xóa tất cả progress records
17. Xóa thumbnail trên Cloudinary nếu có
18. Xóa course khỏi database
19. Tạo notification cho enrolled students về việc xóa khóa học
20. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **courses**: Xóa course document
- **chapters**: Xóa tất cả chapters
- **lessons**: Xóa tất cả lessons
- **media**: Xóa tất cả media documents
- **quizzes**: Xóa tất cả quizzes
- **quizAttempts**: Xóa tất cả attempts
- **discussions**: Xóa tất cả discussions
- **comments**: Xóa tất cả comments liên quan
- **progress**: Xóa tất cả progress records
- **notifications**: Tạo thông báo cho students

**Gói tin gửi đi:**

- Xóa files trên Cloudinary service

---

### 3.8. Workflow Xem Danh Sách Sinh Viên Đã Đăng Ký Khóa Học

**Mô tả:**
Admin xem danh sách tất cả sinh viên đã đăng ký một khóa học cụ thể.

**Quy trình:**

1. Admin truy cập trang chi tiết khóa học
2. Click vào tab students
3. Gọi API GET /api/courses/:id/students
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate course ID
7. Tìm course trong database
8. Kiểm tra admin có quyền xem không (là instructor hoặc admin)
9. Lấy danh sách student IDs từ enrolledStudents array
10. Populate thông tin students từ users collection
11. Lấy progress của từng student trong khóa học
12. Tính completion rate cho từng student
13. Trả về danh sách students với progress

**Collections sử dụng:**

- **courses**: Đọc enrolledStudents array
- **users**: Populate thông tin students
- **userProfiles**: Populate profile students
- **progress**: Lấy progress của từng student

---

### 3.9. Workflow Xem Các Khóa Học Do Admin Tạo

**Mô tả:**
Admin xem danh sách tất cả khóa học do chính mình tạo.

**Quy trình:**

1. Admin truy cập trang my courses
2. Gọi API GET /api/courses/my-courses với query params (page, limit)
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Lấy user ID từ token
6. Tìm tất cả courses có instructor = user ID
7. Áp dụng phân trang
8. Đếm tổng số courses
9. Lấy thống kê cho mỗi course (enrollments, rating, revenue)
10. Trả về danh sách courses và metadata

**Collections sử dụng:**

- **courses**: Đọc courses với filter instructor = admin ID
- **analytics**: Lấy thống kê cho từng course

---

## 4. QUẢN LÝ CHAPTER (CHƯƠNG HỌC)

### 4.1. Workflow Tạo Chapter Mới

**Mô tả:**
Admin tạo một chapter (chương) mới trong một khóa học.

**Quy trình:**

1. Admin ở trang chi tiết khóa học
2. Click nút add chapter
3. Nhập title cho chapter
4. Gọi API POST /api/chapters với courseId và title
5. Hệ thống xác thực admin
6. Kiểm tra quyền admin hoặc teacher
7. Validate dữ liệu đầu vào
8. Tìm course trong database
9. Kiểm tra admin có quyền chỉnh sửa course không
10. Đếm số chapters hiện có của course
11. Tạo chapter mới với order = số chapters + 1
12. Lưu chapter vào database
13. Thêm chapter ID vào chapters array của course
14. Trả về chapter đã tạo

**Collections sử dụng:**

- **chapters**: Tạo chapter document mới
- **courses**: Cập nhật chapters array

---

### 4.2. Workflow Cập Nhật Thông Tin Chapter

**Mô tả:**
Admin cập nhật title của chapter.

**Quy trình:**

1. Admin click vào chapter cần chỉnh sửa
2. Chỉnh sửa title
3. Gọi API PUT /api/chapters/:id với title mới
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate chapter ID và title
7. Tìm chapter trong database
8. Tìm course liên quan
9. Kiểm tra admin có quyền chỉnh sửa không
10. Cập nhật title của chapter
11. Trả về chapter đã cập nhật

**Collections sử dụng:**

- **chapters**: Cập nhật title
- **courses**: Đọc để kiểm tra quyền

---

### 4.3. Workflow Sắp Xếp Lại Thứ Tự Các Chapter

**Mô tả:**
Admin kéo thả để sắp xếp lại thứ tự các chapter trong khóa học.

**Quy trình:**

1. Admin kéo thả chapters trong UI
2. Gọi API PUT /api/chapters/reorder với courseId và chapters array mới (chứa chapter IDs theo thứ tự)
3. Hệ thống xác thực admin
4. Kiểm tra quyền admin hoặc teacher
5. Validate courseId và chapters array
6. Tìm course trong database
7. Kiểm tra admin có quyền chỉnh sửa không
8. Kiểm tra tất cả chapter IDs có thuộc course không
9. Cập nhật order cho từng chapter theo vị trí mới
10. Cập nhật chapters array trong course
11. Trả về danh sách chapters đã sắp xếp

**Collections sử dụng:**

- **chapters**: Cập nhật order field cho từng chapter
- **courses**: Cập nhật chapters array với thứ tự mới

---

### 4.4. Workflow Xóa Chapter

**Mô tả:**
Admin xóa một chapter và tất cả lessons bên trong chapter đó.

**Quy trình:**

1. Admin click nút delete trên chapter
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/chapters/:id
4. Hệ thống xác thực admin
5. Kiểm tra quyền admin hoặc teacher
6. Validate chapter ID
7. Tìm chapter trong database
8. Tìm course liên quan
9. Kiểm tra admin có quyền xóa không
10. Lấy danh sách lessons trong chapter
11. Xóa tất cả media (videos, resources) của các lessons trên Cloudinary
12. Xóa tất cả lessons trong chapter
13. Xóa tất cả progress records liên quan đến lessons
14. Xóa chapter khỏi database
15. Remove chapter ID khỏi chapters array của course
16. Cập nhật lại order của các chapters còn lại
17. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **chapters**: Xóa chapter document
- **lessons**: Xóa tất cả lessons trong chapter
- **media**: Xóa tất cả media documents
- **progress**: Xóa progress records liên quan
- **courses**: Cập nhật chapters array

**Gói tin gửi đi:**

- Xóa files trên Cloudinary service

---

## 5. QUẢN LÝ LESSON (BÀI HỌC)

### 5.1. Workflow Tạo Lesson Mới

**Mô tả:**
Admin tạo một lesson (bài học) mới trong một chapter.

**Quy trình:**

1. Admin ở trang chi tiết chapter
2. Click nút add lesson
3. Nhập thông tin lesson (title, description, chapterId, type, duration, isFree)
4. Gọi API POST /api/lessons với thông tin lesson
5. Hệ thống xác thực admin
6. Kiểm tra quyền teacher
7. Validate dữ liệu đầu vào
8. Tìm chapter trong database
9. Tìm course liên quan
10. Kiểm tra admin có quyền chỉnh sửa course không
11. Đếm số lessons hiện có trong chapter
12. Tạo lesson mới với order = số lessons + 1
13. Lưu lesson vào database
14. Thêm lesson ID vào lessons array của chapter
15. Trả về lesson đã tạo

**Collections sử dụng:**

- **lessons**: Tạo lesson document mới
- **chapters**: Cập nhật lessons array
- **courses**: Đọc để kiểm tra quyền

---

### 5.2. Workflow Cập Nhật Thông Tin Lesson

**Mô tả:**
Admin cập nhật thông tin của lesson (title, description, type, duration, isFree).

**Quy trình:**

1. Admin click vào lesson cần chỉnh sửa
2. Chỉnh sửa thông tin trong form
3. Gọi API PUT /api/lessons/:id với dữ liệu mới
4. Hệ thống xác thực admin
5. Kiểm tra quyền teacher
6. Validate lesson ID và dữ liệu
7. Tìm lesson trong database
8. Tìm chapter và course liên quan
9. Kiểm tra admin có quyền chỉnh sửa không
10. Cập nhật các field được phép thay đổi
11. Trả về lesson đã cập nhật

**Collections sử dụng:**

- **lessons**: Cập nhật thông tin lesson
- **chapters**: Đọc để kiểm tra quyền
- **courses**: Đọc để kiểm tra quyền

---

### 5.3. Workflow Upload Video Cho Lesson

**Mô tả:**
Admin upload video bài giảng cho lesson.

**Quy trình:**

1. Admin chọn file video từ máy tính
2. Gọi API POST /api/lessons/:id/video với file video
3. Hệ thống xác thực admin
4. Kiểm tra quyền teacher
5. Validate lesson ID và file video
6. Tìm lesson trong database
7. Tìm chapter và course để kiểm tra quyền
8. Validate file video (định dạng, kích thước)
9. Upload video lên Cloudinary
10. Lấy URL video và các metadata (duration, format, size)
11. Nếu có video cũ, xóa video cũ trên Cloudinary
12. Tạo hoặc cập nhật media document cho video
13. Cập nhật videoUrl trong lesson
14. Cập nhật duration của lesson nếu có
15. Trả về lesson đã cập nhật với video URL

**Collections sử dụng:**

- **lessons**: Cập nhật videoUrl
- **media**: Tạo hoặc cập nhật media document cho video

**Gói tin gửi đi:**

- Upload file lên Cloudinary service

---

### 5.4. Workflow Upload Tài Nguyên Cho Lesson

**Mô tả:**
Admin upload các tài nguyên bổ sung cho lesson (PDF, slides, documents).

**Quy trình:**

1. Admin chọn các file tài nguyên từ máy tính
2. Gọi API POST /api/lessons/:id/resource với array files
3. Hệ thống xác thực admin
4. Kiểm tra quyền teacher
5. Validate lesson ID và files
6. Tìm lesson trong database
7. Kiểm tra quyền chỉnh sửa
8. Validate từng file (định dạng, kích thước)
9. Upload từng file lên Cloudinary
10. Tạo media document cho mỗi file với URL và metadata
11. Thêm các media IDs vào resources array của lesson
12. Trả về lesson với danh sách resources mới

**Collections sử dụng:**

- **lessons**: Cập nhật resources array
- **media**: Tạo media documents cho mỗi file

**Gói tin gửi đi:**

- Upload files lên Cloudinary service

---

### 5.5. Workflow Xóa Tài Nguyên Của Lesson

**Mô tả:**
Admin xóa một tài nguyên cụ thể khỏi lesson.

**Quy trình:**

1. Admin click nút delete trên một resource
2. Xác nhận xóa
3. Gọi API DELETE /api/lessons/:id/resource/:resId
4. Hệ thống xác thực admin
5. Kiểm tra quyền teacher
6. Validate lesson ID và resource ID
7. Tìm lesson trong database
8. Kiểm tra quyền chỉnh sửa
9. Tìm media document theo resource ID
10. Xóa file trên Cloudinary
11. Xóa media document khỏi database
12. Remove resource ID khỏi resources array của lesson
13. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **lessons**: Cập nhật resources array
- **media**: Xóa media document

**Gói tin gửi đi:**

- Xóa file trên Cloudinary service

---

### 5.6. Workflow Xem Chi Tiết Lesson

**Mô tả:**
Admin xem thông tin chi tiết của một lesson, bao gồm video và resources.

**Quy trình:**

1. Admin click vào một lesson
2. Gọi API GET /api/lessons/:id
3. Validate lesson ID
4. Tìm lesson trong database
5. Populate video media
6. Populate resources media
7. Lấy chapter và course liên quan
8. Nếu admin đã enroll course, lấy progress của lesson
9. Trả về thông tin đầy đủ lesson

**Collections sử dụng:**

- **lessons**: Đọc thông tin lesson
- **media**: Populate video và resources
- **chapters**: Đọc thông tin chapter
- **courses**: Đọc thông tin course
- **progress**: Lấy progress nếu đã enroll

---

### 5.7. Workflow Xóa Lesson

**Mô tả:**
Admin xóa một lesson và tất cả media liên quan.

**Quy trình:**

1. Admin click nút delete trên lesson
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/lessons/:id
4. Hệ thống xác thực admin
5. Kiểm tra quyền teacher
6. Validate lesson ID
7. Tìm lesson trong database
8. Kiểm tra quyền xóa
9. Xóa video trên Cloudinary nếu có
10. Xóa tất cả resources trên Cloudinary
11. Xóa tất cả media documents liên quan
12. Xóa tất cả progress records của lesson
13. Xóa lesson khỏi database
14. Remove lesson ID khỏi lessons array của chapter
15. Cập nhật lại order của các lessons còn lại trong chapter
16. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **lessons**: Xóa lesson document
- **media**: Xóa tất cả media documents
- **progress**: Xóa progress records liên quan
- **chapters**: Cập nhật lessons array

**Gói tin gửi đi:**

- Xóa files trên Cloudinary service

---

## 6. QUẢN LÝ QUIZ (BÀI KIỂM TRA)

### 6.1. Workflow Tạo Quiz Mới

**Mô tả:**
Admin tạo một bài kiểm tra mới cho một lesson hoặc chapter.

**Quy trình:**

1. Admin ở trang tạo quiz
2. Nhập thông tin quiz (title, description, courseId, chapterId/lessonId, timeLimit, passingScore, maxAttempts)
3. Thêm danh sách câu hỏi với answers và correctAnswer
4. Gọi API POST /api/quizzes với dữ liệu quiz
5. Hệ thống xác thực admin
6. Kiểm tra quyền teacher
7. Validate dữ liệu quiz và questions
8. Tìm course trong database
9. Kiểm tra admin có quyền tạo quiz cho course không
10. Validate tất cả questions có ít nhất 2 answers
11. Validate correctAnswer có trong danh sách answers
12. Tính totalPoints dựa trên số câu hỏi
13. Tạo quiz document
14. Lưu quiz vào database
15. Trả về quiz đã tạo

**Collections sử dụng:**

- **quizzes**: Tạo quiz document mới với questions array
- **courses**: Đọc để kiểm tra quyền

---

### 6.2. Workflow Cập Nhật Quiz

**Mô tả:**
Admin cập nhật thông tin của quiz (title, description, questions, settings).

**Quy trình:**

1. Admin chỉnh sửa quiz trong form
2. Cập nhật questions, thêm/xóa/sửa câu hỏi
3. Gọi API PUT /api/quizzes/:id với dữ liệu mới
4. Hệ thống xác thực admin
5. Kiểm tra quyền teacher
6. Validate quiz ID và dữ liệu
7. Tìm quiz trong database
8. Tìm course để kiểm tra quyền
9. Validate questions nếu có thay đổi
10. Cập nhật các field được phép
11. Recalculate totalPoints nếu questions thay đổi
12. Trả về quiz đã cập nhật

**Collections sử dụng:**

- **quizzes**: Cập nhật quiz document
- **courses**: Đọc để kiểm tra quyền

---

### 6.3. Workflow Xem Chi Tiết Quiz

**Mô tả:**
Admin xem thông tin chi tiết của quiz, bao gồm tất cả questions và settings.

**Quy trình:**

1. Admin click vào một quiz
2. Gọi API GET /api/quizzes/:id
3. Validate quiz ID
4. Tìm quiz trong database
5. Populate course và chapter/lesson liên quan
6. Lấy thống kê quiz (số attempts, avg score, completion rate)
7. Trả về thông tin đầy đủ quiz

**Collections sử dụng:**

- **quizzes**: Đọc quiz document với questions
- **courses**: Populate course info
- **chapters/lessons**: Populate liên kết
- **quizAttempts**: Tính thống kê

---

### 6.4. Workflow Xóa Quiz

**Mô tả:**
Admin xóa một quiz và tất cả attempts liên quan.

**Quy trình:**

1. Admin click nút delete trên quiz
2. Xác nhận xóa trong dialog
3. Gọi API DELETE /api/quizzes/:id
4. Hệ thống xác thực admin
5. Kiểm tra quyền teacher
6. Validate quiz ID
7. Tìm quiz trong database
8. Kiểm tra quyền xóa
9. Xóa tất cả quiz attempts liên quan
10. Xóa quiz khỏi database
11. Trả về thông báo xóa thành công

**Collections sử dụng:**

- **quizzes**: Xóa quiz document
- **quizAttempts**: Xóa tất cả attempts liên quan

---

### 6.5. Workflow Xem Danh Sách Attempt Của Quiz

**Mô tả:**
Admin xem tất cả các lần làm bài của sinh viên cho một quiz cụ thể.

**Quy trình:**

1. Admin truy cập trang quản lý attempts của quiz
2. Gọi API GET /api/quizzes/:id/attempts với query params (page, limit)
3. Hệ thống xác thực admin
4. Kiểm tra quyền student (để xem attempts của chính mình) hoặc teacher (để xem tất cả)
5. Validate quiz ID
6. Tìm quiz trong database
7. Nếu là student: lấy attempts của student đó
8. Nếu là admin/teacher: lấy tất cả attempts với phân trang
9. Populate thông tin student cho mỗi attempt
10. Sort theo thời gian hoặc điểm số
11. Trả về danh sách attempts với metadata

**Collections sử dụng:**

- **quizzes**: Đọc thông tin quiz
- **quizAttempts**: Lấy danh sách attempts
- **users**: Populate student info

---

### 6.6. Workflow Xem Kết Quả Chi Tiết Của Một Attempt

**Mô tả:**
Admin xem chi tiết kết quả của một lần làm bài cụ thể, bao gồm từng câu trả lời.

**Quy trình:**

1. Admin click vào một attempt
2. Gọi API GET /api/quizzes/:id/results/:attemptId
3. Hệ thống xác thực admin
4. Validate quiz ID và attempt ID
5. Tìm attempt trong database
6. Tìm quiz để lấy questions
7. Kiểm tra quyền xem (owner hoặc teacher/admin)
8. Populate thông tin student
9. So sánh userAnswers với correctAnswers
10. Tính điểm cho từng câu
11. Hiển thị chi tiết: câu hỏi, đáp án đúng, đáp án của student, điểm
12. Trả về kết quả chi tiết

**Collections sử dụng:**

- **quizAttempts**: Đọc attempt document với userAnswers
- **quizzes**: Đọc quiz để lấy questions và correctAnswers
- **users**: Populate student info

---

**KẾT THÚC PHẦN 1**

Phần 1 này đã bao gồm 6 phần đầu tiên của admin workflows:

1. Quản lý tài khoản và xác thực (8 workflows)
2. Quản lý người dùng (8 workflows)
3. Quản lý khóa học (9 workflows)
4. Quản lý chapter (4 workflows)
5. Quản lý lesson (7 workflows)
6. Quản lý quiz (6 workflows)

**Tổng cộng: 42 workflows trong phần 1**

Phần 2 sẽ tiếp tục với:

- Quản lý Live Session
- Quản lý Discussion
- Quản lý Comment
- Quản lý Notification
- Quản lý Analytics và Báo cáo
