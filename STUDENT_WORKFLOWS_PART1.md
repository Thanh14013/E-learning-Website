# 📚 STUDENT WORKFLOWS - PHẦN 1: CHI TIẾT

> **Mô tả chi tiết các workflow của Student (Phần 1/2)**
>
> **Bao gồm:** Authentication, Profile, Course Discovery, Learning, Quizzes

---

## 1. AUTHENTICATION & ACCOUNT MANAGEMENT

### 1.1. Workflow Đăng ký tài khoản

**Mục đích:** Student tạo tài khoản mới trong hệ thống

**Các bước:**

1. Student truy cập trang đăng ký (`/register`)
2. Student điền form với thông tin:
   - Họ tên đầy đủ (fullName)
   - Email
   - Password
   - Confirm Password
   - Ngày sinh (dateOfBirth) - optional
   - Chọn role qua **Radio Buttons** (Student/Teacher) - mặc định là "student"
3. Frontend validate:
   - Password và Confirm Password phải khớp
   - Email format hợp lệ
   - Các trường bắt buộc không được để trống
4. Frontend gửi **POST /api/auth/register** với body:
   ```json
   {
     "fullName": "Nguyen Van A",
     "email": "student@example.com",
     "password": "password123",
     "role": "student",
     "dateOfBirth": "2000-01-01"
   }
   ```
5. Backend xử lý:
   - Validate dữ liệu đầu vào (email format, password strength ≥ 6 ký tự)
   - Kiểm tra email đã tồn tại trong **collection users** chưa
   - Hash password bằng bcrypt
   - Tạo document mới trong **collection users** với:
     - fullName, email, password (hashed)
     - role: "student" (từ request)
     - isVerified: false
     - isBanned: false
     - profileCompleted: false
     - profileApprovalStatus: null
     - verificationToken: random 32-byte hex string
     - createdAt: timestamp hiện tại
   - Tạo document trong **collection userProfiles** liên kết với userId
   - Gửi email xác thực đến địa chỉ email của student qua SendGrid
   - Tạo JWT access token và refresh token
   - Lưu refresh token vào user document
6. Backend trả về response:
   ```json
   {
     "message": "Registration successful. Please check your email to verify your account.",
     "user": {
       "_id": "user_id",
       "fullName": "Nguyen Van A",
       "email": "student@example.com",
       "role": "student",
       "avatar": "",
       "isVerified": false,
       "profileCompleted": false,
       "profileApprovalStatus": null
     },
     "tokens": {
       "accessToken": "jwt_token",
       "refreshToken": "refresh_token"
     }
   }
   ```
7. Frontend xử lý response:
   - Lưu accessToken và refreshToken vào localStorage
   - Lưu thông tin user vào AuthContext
   - Hiển thị toast notification: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực."
   - **Redirect đến `/email-verification-required`**

**Collections liên quan:**

- **users** (INSERT): Tạo tài khoản student mới
- **userProfiles** (INSERT): Tạo profile mở rộng

**UI Changes:**

- Radio buttons thay vì dropdown cho role selection
- Visual styling với accent color cho radio buttons

**Note:** Student PHẢI verify email trước khi có thể login và sử dụng hệ thống

---

### 1.2. Workflow Xác thực email

**Mục đích:** Student xác nhận địa chỉ email để kích hoạt tài khoản

**Các bước:**

1. Student nhận email chứa link xác thực hoặc mã token
2. Student click vào link hoặc nhập token vào form
3. Frontend gửi **POST /api/auth/verify-email** với body:
   - token: email verification token
4. Backend xử lý:
   - Decode và validate token
   - Tìm user trong **collection users** có token khớp và chưa expire
   - Cập nhật field isEmailVerified = true
   - Xóa verification token
5. Backend trả về response:
   - success: true
   - message: "Email verified successfully"
6. Frontend hiển thị thông báo thành công
7. Redirect student đến trang login hoặc dashboard

**Collections liên quan:**

- **users** (UPDATE): Cập nhật isEmailVerified = true

---

### 1.3. Workflow Đăng nhập

**Mục đích:** Student đăng nhập vào hệ thống với tài khoản đã có

**Các bước:**

1. Student truy cập trang login (`/login`)
2. Student nhập:
   - Email
   - Password
3. Frontend gửi **POST /api/auth/login** với body:
   ```json
   {
     "email": "student@example.com",
     "password": "password123"
   }
   ```
4. Backend xử lý:
   - Tìm user trong **collection users** theo email (lowercase)
   - Kiểm tra user có tồn tại không → Nếu không: 401 "Invalid email or password"
   - So sánh password với hashed password bằng bcrypt.compare()
   - Nếu sai password → 401 "Invalid email or password"
   - **Kiểm tra email verification:**
     - Nếu `isVerified = false` → Trả về 403:
       ```json
       {
         "message": "Your account has not been verified. Please check your email.",
         "isVerified": false,
         "requiresVerification": true
       }
       ```
   - Nếu đã verified:
     - Tạo JWT access token (payload: id, role, email)
     - Tạo refresh token (expire 7 days)
     - Lưu refresh token vào user document
     - Set cookie với refreshToken (httpOnly, secure in production)
5. Backend trả về response thành công:
   ```json
   {
     "message": "Login successful.",
     "user": {
       "_id": "user_id",
       "fullName": "Nguyen Van A",
       "email": "student@example.com",
       "role": "student",
       "avatar": "",
       "isVerified": true,
       "profileCompleted": false,
       "profileApprovalStatus": null,
       "profile": {
         "phone": "0123456789",
         "address": "HCM",
         "bio": "Student bio"
       }
     },
     "tokens": {
       "accessToken": "jwt_token"
     }
   }
   ```
6. Frontend xử lý response:
   - **Nếu requiresVerification = true:**
     - Redirect đến `/email-verification-required`
     - Hiển thị trang thông báo cần verify email
   - **Nếu login thành công:**
     - Lưu accessToken vào localStorage
     - Lưu user info vào AuthContext
     - Hiển thị toast: "Chào mừng {fullName}!"
     - **Check isVerified:**
       - Nếu false → Redirect `/email-verification-required`
       - Nếu true → Redirect đến `/dashboard` hoặc trang trước đó

**Collections liên quan:**

- **users** (SELECT, UPDATE): Tìm user, lưu refreshToken
- **userProfiles** (SELECT): Lấy thông tin profile để trả về

**Login Flow cho Student:**

```
Login → Check credentials → Check isVerified
  ├─ Not Verified → Redirect to /email-verification-required
  └─ Verified → Redirect to /dashboard
```

**Note:** Student KHÔNG thể login nếu email chưa được verified

---

### 1.4. Workflow Quên mật khẩu

**Mục đích:** Student yêu cầu reset mật khẩu khi quên

**Các bước:**

1. Student click "Forgot Password" trên trang login
2. Student nhập email đã đăng ký
3. Frontend gửi **POST /api/auth/forgot-password** với body:
   - email: địa chỉ email
4. Backend xử lý:
   - Tìm user trong **collection users** theo email
   - Nếu tìm thấy:
     - Tạo reset password token (random string, expire 1 hour)
     - Lưu token và expiry time vào **collection users** (fields: resetPasswordToken, resetPasswordExpires)
     - Gửi email chứa link reset password với token
5. Backend trả về response:
   - success: true
   - message: "Reset password email sent"
6. Frontend hiển thị thông báo: "Kiểm tra email để reset mật khẩu"

**Collections liên quan:**

- **users** (SELECT, UPDATE): Tìm user, lưu reset token

**Note:** Vì lý do bảo mật, response không tiết lộ email có tồn tại hay không

---

### 1.5. Workflow Đặt lại mật khẩu

**Mục đích:** Student đặt mật khẩu mới sau khi yêu cầu reset

**Các bước:**

1. Student click link trong email reset password
2. Frontend extract token từ URL parameter
3. Student nhập mật khẩu mới và confirm password
4. Frontend gửi **PUT /api/auth/reset-password/{token}** với body:
   - password: mật khẩu mới
5. Backend xử lý:
   - Tìm user trong **collection users** có resetPasswordToken khớp
   - Kiểm tra token chưa expire (resetPasswordExpires > current time)
   - Hash password mới
   - Cập nhật password mới vào **collection users**
   - Xóa resetPasswordToken và resetPasswordExpires
   - Vô hiệu hóa tất cả refresh tokens cũ để force re-login
6. Backend trả về response:
   - success: true
   - message: "Password reset successfully"
7. Frontend hiển thị thông báo thành công
8. Redirect student đến trang login

**Collections liên quan:**

- **users** (SELECT, UPDATE): Tìm user theo token, cập nhật password mới

---

### 1.6. Workflow Gửi lại email xác thực

**Mục đích:** Student yêu cầu gửi lại email xác thực nếu chưa nhận được

**Các bước:**

1. Student đã login nhưng chưa verify email
2. Student click "Resend Verification Email"
3. Frontend gửi **POST /api/auth/resend-verification** (yêu cầu Bearer Token)
4. Backend xử lý:
   - Lấy userId từ JWT token trong header
   - Tìm user trong **collection users**
   - Kiểm tra isEmailVerified = false (nếu đã verify thì báo lỗi)
   - Tạo verification token mới
   - Cập nhật token vào **collection users**
   - Gửi email xác thực mới
5. Backend trả về response:
   - success: true
   - message: "Verification email sent"
6. Frontend hiển thị thông báo "Email đã được gửi lại"

**Collections liên quan:**

- **users** (SELECT, UPDATE): Tìm user, cập nhật verification token

---

### 1.7. Workflow Đăng xuất

**Mục đích:** Student đăng xuất khỏi hệ thống

**Các bước:**

1. Student click nút "Logout" trên header/menu
2. Frontend gửi **POST /api/auth/logout** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Xóa refresh token khỏi **collection users** hoặc blacklist access token
   - Có thể lưu access token vào blacklist (Redis) để vô hiệu hóa ngay
4. Backend trả về response:
   - success: true
   - message: "Logged out successfully"
5. Frontend:
   - Xóa accessToken khỏi localStorage
   - Xóa refreshToken khỏi localStorage
   - Xóa user info khỏi state/context
   - Redirect đến trang login hoặc homepage

**Collections liên quan:**

- **users** (UPDATE): Xóa refresh token

---

### 1.8. Workflow Refresh token

**Mục đích:** Làm mới access token khi hết hạn mà không cần login lại

**Các bước:**

1. Frontend phát hiện access token sắp hết hạn hoặc API trả về 401
2. Frontend gửi **POST /api/auth/refresh-token** với body:
   - refreshToken: refresh token đã lưu
3. Backend xử lý:
   - Validate refresh token
   - Kiểm tra token có trong **collection users** không
   - Kiểm tra token chưa expire
   - Tạo access token mới
   - (Optional) Tạo refresh token mới theo refresh token rotation
4. Backend trả về response:
   - success: true
   - accessToken: token mới
   - refreshToken: token mới (nếu có rotation)
5. Frontend:
   - Lưu access token mới vào localStorage
   - Retry request ban đầu với token mới

**Collections liên quan:**

- **users** (SELECT, UPDATE): Validate refresh token, có thể cập nhật token mới

---

## 2. PROFILE MANAGEMENT

### 2.1. Workflow Xem thông tin cá nhân

**Mục đích:** Student xem profile của mình

**Các bước:**

1. Student đã login và click vào "Profile" hoặc avatar
2. Frontend gửi **GET /api/users/profile** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm user trong **collection users** populate với **collection userProfiles**
   - Lấy thông tin:
     - Từ **users**: \_id, fullName, email, role, avatar, phone, isEmailVerified
     - Từ **userProfiles**: address, dateOfBirth, bio, socialLinks
   - Đếm số khóa học đã đăng ký từ user.enrolledCourses
4. Backend trả về response:
   - success: true
   - user: object chứa đầy đủ thông tin profile
5. Frontend hiển thị thông tin trên trang profile

**Collections liên quan:**

- **users** (SELECT): Lấy thông tin user
- **userProfiles** (SELECT): Lấy thông tin profile mở rộng

---

### 2.2. Workflow Cập nhật thông tin cá nhân

**Mục đích:** Student chỉnh sửa thông tin profile

**Các bước:**

1. Student ở trang profile, click "Edit Profile"
2. Student chỉnh sửa các field:
   - fullName
   - phone
   - address
   - dateOfBirth
   - bio
3. Frontend gửi **PUT /api/users/profile** với body chứa các field cần update (yêu cầu Bearer Token)
4. Backend xử lý:
   - Lấy userId từ JWT token
   - Validate dữ liệu (phone format, date format)
   - Cập nhật **collection users** với các field: fullName, phone
   - Cập nhật **collection userProfiles** với các field: address, dateOfBirth, bio
5. Backend trả về response:
   - success: true
   - user: object chứa thông tin đã cập nhật
6. Frontend:
   - Cập nhật user info trong state/context
   - Hiển thị thông báo "Profile updated successfully"

**Collections liên quan:**

- **users** (UPDATE): Cập nhật thông tin cơ bản
- **userProfiles** (UPDATE): Cập nhật thông tin mở rộng

---

### 2.3. Workflow Upload avatar

**Mục đích:** Student đổi ảnh đại diện

**Các bước:**

1. Student ở trang profile, click vào avatar hoặc "Change Avatar"
2. Student chọn file ảnh từ máy tính
3. Frontend validate file:
   - Định dạng: jpg, jpeg, png, gif
   - Kích thước: max 5MB
4. Frontend gửi **POST /api/users/avatar** với multipart/form-data (yêu cầu Bearer Token)
   - avatar: file ảnh
5. Backend xử lý:
   - Lấy userId từ JWT token
   - Validate file upload
   - Upload ảnh lên Cloudinary (hoặc storage service)
   - Nhận URL ảnh từ Cloudinary
   - Xóa avatar cũ từ Cloudinary (nếu có)
   - Cập nhật field avatar trong **collection users** với URL mới
6. Backend trả về response:
   - success: true
   - avatarUrl: URL ảnh mới
7. Frontend:
   - Hiển thị avatar mới ngay lập tức
   - Cập nhật avatar trong state/context
   - Hiển thị thông báo "Avatar updated successfully"

**Collections liên quan:**

- **users** (UPDATE): Cập nhật avatar URL
- **media** (INSERT/DELETE): Có thể lưu metadata của ảnh

**External Services:**

- Cloudinary API: Upload và lưu trữ ảnh

---

## 3. COURSE DISCOVERY & ENROLLMENT

### 3.1. Workflow Duyệt danh sách khóa học (Browse Courses)

**Mục đích:** Student xem tất cả khóa học có sẵn

**Các bước:**

1. Student truy cập trang "Courses" hoặc homepage
2. Frontend gửi **GET /api/courses** với query params:
   - page: số trang (default: 1)
   - limit: số khóa học mỗi trang (default: 10)
3. Backend xử lý:
   - Query **collection courses** với điều kiện isPublished = true
   - Populate field teacherId từ **collection users** để lấy thông tin giảng viên
   - Áp dụng pagination
   - Sắp xếp theo createdAt mới nhất (hoặc theo param sort nếu có)
4. Backend trả về response:
   - success: true
   - data: array các course objects, mỗi object chứa:
     - \_id, title, description, thumbnail
     - teacherId: { \_id, fullName, avatar }
     - category, level, price
     - enrollmentCount, averageRating
     - isPublished, createdAt
   - metadata:
     - total: tổng số courses
     - page: trang hiện tại
     - limit: số items/trang
     - totalPages: tổng số trang
5. Frontend hiển thị danh sách courses dạng grid/list với pagination

**Collections liên quan:**

- **courses** (SELECT): Lấy danh sách courses published
- **users** (SELECT): Lấy thông tin teacher (populate)

---

### 3.2. Workflow Tìm kiếm khóa học

**Mục đích:** Student tìm kiếm khóa học theo từ khóa

**Các bước:**

1. Student nhập từ khóa vào search box
2. Frontend gửi **GET /api/courses** với query params:
   - search: từ khóa tìm kiếm
   - page: 1
   - limit: 10
3. Backend xử lý:
   - Query **collection courses** với:
     - isPublished = true
     - $text search hoặc regex trên fields: title, description
   - Populate teacherId
   - Áp dụng pagination
4. Backend trả về response tương tự 3.1
5. Frontend hiển thị kết quả tìm kiếm với highlight từ khóa

**Collections liên quan:**

- **courses** (SELECT): Full-text search trên title, description

---

### 3.3. Workflow Lọc khóa học theo category, level, giá

**Mục đích:** Student lọc khóa học theo tiêu chí cụ thể

**Các bước:**

1. Student chọn filter options:
   - Category: "Programming", "Design", "Business"...
   - Level: "beginner", "intermediate", "advanced"
   - Price range hoặc "free"
2. Frontend gửi **GET /api/courses** với query params:
   - category: "Programming"
   - level: "beginner"
   - minPrice: 0
   - maxPrice: 1000000
   - page: 1
   - limit: 10
3. Backend xử lý:
   - Query **collection courses** với multiple conditions:
     - isPublished = true
     - category = param (nếu có)
     - level = param (nếu có)
     - price >= minPrice và price <= maxPrice (nếu có)
   - Populate teacherId
   - Áp dụng pagination
4. Backend trả về response tương tự 3.1
5. Frontend hiển thị courses đã filter với badge hiển thị các filter đang active

**Collections liên quan:**

- **courses** (SELECT): Query với multiple filters

---

### 3.4. Workflow Sắp xếp khóa học

**Mục đích:** Student sắp xếp courses theo tiêu chí

**Các bước:**

1. Student chọn sort option:
   - Newest: mới nhất
   - Popular: nhiều học viên nhất
   - Rating: đánh giá cao nhất
   - Price (asc/desc): giá tăng/giảm dần
2. Frontend gửi **GET /api/courses** với query param:
   - sort: "newest" | "popular" | "rating" | "price-asc" | "price-desc"
   - Kèm theo các params khác (page, limit, filters nếu có)
3. Backend xử lý:
   - Query **collection courses** với isPublished = true
   - Áp dụng sort theo param:
     - newest: sort by createdAt desc
     - popular: sort by enrollmentCount desc
     - rating: sort by averageRating desc
     - price-asc: sort by price asc
     - price-desc: sort by price desc
   - Populate teacherId
   - Áp dụng pagination
4. Backend trả về response tương tự 3.1
5. Frontend hiển thị courses đã sort với indicator sort đang active

**Collections liên quan:**

- **courses** (SELECT): Query với sorting

---

### 3.5. Workflow Xem chi tiết khóa học

**Mục đích:** Student xem thông tin đầy đủ của một khóa học

**Các bước:**

1. Student click vào một course card
2. Frontend gửi **GET /api/courses/{courseId}** (có thể không cần Bearer Token)
3. Backend xử lý:
   - Tìm course trong **collection courses** theo \_id
   - Populate teacherId từ **collection users** để lấy thông tin đầy đủ teacher
   - Lấy chapters từ **collection chapters** (courseId = courseId, sort by order)
   - Với mỗi chapter, lấy lessons từ **collection lessons** (chapterId = chapterId, sort by order)
   - Lấy quizzes từ **collection quizzes** nếu có (courseId = courseId)
   - Nếu student đã login:
     - Kiểm tra student đã enroll chưa (userId có trong course.enrolledStudents hoặc kiểm tra user.enrolledCourses)
     - Nếu đã enroll, lấy progress từ **collection progress**
4. Backend trả về response:
   - success: true
   - course: object chứa:
     - Thông tin cơ bản: \_id, title, description, thumbnail, category, level, price
     - teacherId: { \_id, fullName, email, avatar, bio }
     - chapters: array of chapters, mỗi chapter có:
       - \_id, title, order
       - lessons: array of lessons { \_id, title, type, duration, order }
     - quizzes: array of quizzes
     - stats: enrollmentCount, averageRating, totalLessons, totalDuration
     - isEnrolled: true/false (nếu student đã login)
     - progress: { completedLessons, percentage } (nếu đã enroll)
5. Frontend hiển thị:
   - Header với thumbnail, title, description
   - Teacher info
   - Course content (chapters & lessons tree)
   - Enrollment button hoặc "Continue Learning" button
   - Stats và ratings

**Collections liên quan:**

- **courses** (SELECT): Lấy thông tin course
- **users** (SELECT): Lấy thông tin teacher
- **chapters** (SELECT): Lấy danh sách chapters
- **lessons** (SELECT): Lấy danh sách lessons
- **quizzes** (SELECT): Lấy danh sách quizzes
- **progress** (SELECT): Lấy tiến độ nếu đã enroll

---

### 3.6. Workflow Đăng ký khóa học (Enroll)

**Mục đích:** Student đăng ký vào một khóa học

**Các bước:**

1. Student ở trang course detail, click nút "Enroll Now" hoặc "Start Learning"
2. (Optional) Nếu khóa học có phí, student phải thanh toán trước
3. Frontend gửi **POST /api/courses/{courseId}/enroll** (yêu cầu Bearer Token)
4. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm course trong **collection courses**
   - Kiểm tra:
     - Course tồn tại và isPublished = true
     - Student chưa enroll (userId không có trong course.enrolledStudents)
     - (Nếu có phí) Kiểm tra payment đã thành công
   - Thêm userId vào array enrolledStudents trong **collection courses**
   - Thêm courseId vào array enrolledCourses trong **collection users**
   - Tăng enrollmentCount trong **collection courses**
   - Tạo document mới trong **collection progress** với:
     - userId, courseId
     - enrolledAt: timestamp
     - completedLessons: [] (empty array)
     - percentage: 0
   - Tạo notification cho student trong **collection notifications**
   - (Optional) Gửi email welcome hoặc confirmation
5. Backend trả về response:
   - success: true
   - message: "Enrolled successfully"
   - enrollment: { courseId, enrolledAt }
6. Frontend:
   - Hiển thị thông báo "Bạn đã đăng ký khóa học thành công"
   - Redirect đến trang lesson đầu tiên hoặc course detail với isEnrolled = true
   - Cập nhật state để hiển thị nút "Continue Learning" thay vì "Enroll"

**Collections liên quan:**

- **courses** (SELECT, UPDATE): Kiểm tra course, thêm student vào enrolledStudents
- **users** (UPDATE): Thêm course vào enrolledCourses
- **progress** (INSERT): Tạo progress tracking mới
- **notifications** (INSERT): Tạo thông báo

**Socket Event:** Có thể emit event `enrollment:new` để real-time update

---

### 3.7. Workflow Xem danh sách khóa học đã đăng ký

**Mục đích:** Student xem tất cả courses mình đã enroll

**Các bước:**

1. Student click "My Courses" hoặc "Learning" trong menu
2. Frontend gửi **GET /api/courses/enrolled** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm user trong **collection users**
   - Lấy array enrolledCourses (array of courseIds)
   - Query **collection courses** với \_id in enrolledCourses array
   - Populate teacherId từ **collection users**
   - Với mỗi course, lấy progress từ **collection progress** (userId và courseId)
4. Backend trả về response:
   - success: true
   - courses: array of course objects, mỗi object chứa:
     - Course info: \_id, title, thumbnail, description
     - teacherId: { \_id, fullName, avatar }
     - progress: { completedLessons, totalLessons, percentage, lastAccessedLesson }
     - enrolledAt: timestamp
5. Frontend hiển thị:
   - Danh sách courses dạng cards
   - Progress bar cho mỗi course
   - Button "Continue Learning" redirect đến lesson tiếp theo
   - Filter/sort: "In Progress", "Completed", "Recently Accessed"

**Collections liên quan:**

- **users** (SELECT): Lấy enrolledCourses
- **courses** (SELECT): Lấy thông tin courses
- **progress** (SELECT): Lấy tiến độ từng course

---

### 3.8. Workflow Hủy đăng ký khóa học (Unenroll)

**Mục đích:** Student hủy đăng ký khỏi một khóa học

**Các bước:**

1. Student ở My Courses hoặc course detail, click "Unenroll" hoặc "Leave Course"
2. Frontend hiển thị confirmation dialog: "Bạn có chắc muốn hủy đăng ký?"
3. Student confirm
4. Frontend gửi **DELETE /api/courses/{courseId}/unenroll** (yêu cầu Bearer Token)
5. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm course trong **collection courses**
   - Kiểm tra student đã enroll (userId có trong enrolledStudents)
   - Xóa userId khỏi enrolledStudents trong **collection courses**
   - Xóa courseId khỏi enrolledCourses trong **collection users**
   - Giảm enrollmentCount trong **collection courses**
   - Xóa progress document trong **collection progress** (userId và courseId)
   - (Optional) Tạo notification hoặc log
6. Backend trả về response:
   - success: true
   - message: "Unenrolled successfully"
7. Frontend:
   - Hiển thị thông báo "Đã hủy đăng ký khỏi khóa học"
   - Redirect đến My Courses hoặc refresh page
   - Xóa course khỏi enrolled list

**Collections liên quan:**

- **courses** (UPDATE): Xóa student khỏi enrolledStudents
- **users** (UPDATE): Xóa course khỏi enrolledCourses
- **progress** (DELETE): Xóa progress tracking

**Note:** Có thể có policy không cho unenroll sau khi đã học quá 50% hoặc đã hoàn thành

---

## 4. LEARNING - LESSONS & CONTENT

### 4.1. Workflow Xem cấu trúc khóa học (Chapters & Lessons)

**Mục đích:** Student xem tổng quan cấu trúc bài học trong khóa học

**Các bước:**

1. Student đã enroll và ở trang course detail hoặc lesson player
2. Cấu trúc đã được load sẵn từ workflow 3.5 hoặc gọi lại API
3. Frontend gửi **GET /api/courses/{courseId}** nếu cần refresh (yêu cầu Bearer Token)
4. Backend xử lý giống workflow 3.5:
   - Lấy course với chapters và lessons
   - Với student đã enroll, đánh dấu lessons đã completed
5. Backend trả về:
   - Course structure với chapters/lessons tree
   - Progress info: lessons nào đã complete
6. Frontend hiển thị:
   - Sidebar hoặc expandable menu với chapters
   - Mỗi chapter có list lessons
   - Icon check ✓ cho lessons đã hoàn thành
   - Lock icon 🔒 cho lessons chưa unlock (nếu có sequential learning)
   - Current lesson được highlight

**Collections liên quan:**

- **courses** (SELECT)
- **chapters** (SELECT)
- **lessons** (SELECT)
- **progress** (SELECT): Để biết lessons nào đã complete

---

### 4.2. Workflow Xem chi tiết bài học

**Mục đích:** Student truy cập và xem nội dung một bài học

**Các bước:**

1. Student click vào một lesson trong course structure
2. Frontend gửi **GET /api/lessons/{lessonId}** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm lesson trong **collection lessons**
   - Populate courseId và chapterId để kiểm tra quyền truy cập
   - Kiểm tra student đã enroll khóa học (userId trong course.enrolledStudents)
   - Lấy media files từ **collection media** (lessonId = lessonId)
   - Lấy progress của lesson từ **collection progress** (userId, lessonId)
4. Backend trả về response:
   - success: true
   - lesson: object chứa:
     - \_id, title, content, type (video/text/quiz), duration, order
     - videoUrl: URL video (nếu type = video)
     - resources: array of downloadable files { \_id, name, url, type, size }
     - courseId: { \_id, title }
     - chapterId: { \_id, title }
     - nextLessonId: \_id của lesson tiếp theo (nếu có)
     - previousLessonId: \_id của lesson trước (nếu có)
     - progress: { watchedDuration, isCompleted, lastWatchedAt }
5. Frontend hiển thị:
   - Lesson player interface
   - Video player (nếu type = video)
   - Text content (nếu type = text)
   - Danh sách resources để download
   - Navigation buttons: Previous/Next lesson
   - Mark as complete button

**Collections liên quan:**

- **lessons** (SELECT): Lấy thông tin lesson
- **courses** (SELECT): Kiểm tra enrollment
- **media** (SELECT): Lấy video và resources
- **progress** (SELECT): Lấy tiến độ lesson

---

### 4.3. Workflow Xem video bài học

**Mục đích:** Student xem video của bài học

**Các bước:**

1. Student ở trang lesson player, video được load từ workflow 4.2
2. Frontend nhận videoUrl từ response
3. Frontend initialize video player (HTML5 video player hoặc custom player)
4. Student play video:
   - Video stream từ Cloudinary hoặc CDN
   - Player tracks: currentTime, duration, playbackRate
5. Trong quá trình xem:
   - Frontend theo dõi watchedDuration (thời lượng đã xem)
   - Mỗi 10-30 giây hoặc khi pause/change position, frontend gửi API update progress (workflow 4.5)
   - Player có thể seek đến vị trí lastWatchedAt để tiếp tục từ chỗ cũ
6. Khi video kết thúc hoặc xem đủ 90% duration:
   - Frontend có thể tự động mark lesson as completed (workflow 4.6)

**Collections liên quan:**

- **media** (SELECT): Lấy video URL
- **progress** (UPDATE): Cập nhật watched duration (xem workflow 4.5)

**Note:** Video URL có thể có expiration hoặc signed URL để bảo mật

---

### 4.4. Workflow Download tài liệu bài học

**Mục đích:** Student tải tài liệu đính kèm của bài học

**Các bước:**

1. Student ở trang lesson, thấy list resources (PDFs, docs, slides...)
2. Student click vào một resource để download
3. Frontend:
   - Option 1: Nếu có API endpoint riêng **GET /api/lessons/{lessonId}/resource/{resourceId}**
     - Gửi request với Bearer Token
     - Backend kiểm tra quyền truy cập
     - Backend trả về file hoặc signed URL
   - Option 2: Direct download từ URL đã có trong response của workflow 4.2
     - Frontend mở URL trong tab mới hoặc trigger download
4. Browser download file từ Cloudinary hoặc storage service
5. (Optional) Backend log download activity trong **collection analytics**

**Collections liên quan:**

- **lessons** (SELECT): Kiểm tra quyền
- **media** (SELECT): Lấy file URL
- **analytics** (INSERT): Log download activity

---

### 4.5. Workflow Cập nhật tiến độ xem video

**Mục đích:** Lưu tiến độ xem video của student để có thể tiếp tục lần sau

**Các bước:**

1. Trong quá trình xem video (workflow 4.3), video player emit event khi:
   - Video pause
   - Seek to new position
   - Mỗi 15-30 giây (throttled update)
2. Frontend gửi **PUT /api/progress/lesson/{lessonId}** với body:
   - watchedDuration: số giây đã xem (ví dụ: 145)
   - (Yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm hoặc tạo document trong **collection progress** với userId và lessonId
   - Cập nhật field watchedDuration với giá trị mới (lấy max nếu có nhiều updates)
   - Cập nhật lastWatchedAt: timestamp hiện tại
   - Nếu watchedDuration >= 90% của lesson.duration, có thể tự động set isCompleted = true
4. Backend trả về response:
   - success: true
   - progress: { lessonId, watchedDuration, isCompleted, lastWatchedAt }
5. Frontend:
   - Không cần hiển thị gì đặc biệt (background update)
   - Có thể hiển thị indicator nhỏ "Progress saved"
   - Cập nhật local state

**Collections liên quan:**

- **progress** (INSERT/UPDATE): Cập nhật watched duration
- **lessons** (SELECT): Lấy total duration để tính %

**Note:** Update này được gọi nhiều lần nên cần optimize (debounce/throttle)

---

### 4.6. Workflow Đánh dấu bài học hoàn thành

**Mục đích:** Student đánh dấu đã hoàn thành một bài học

**Các bước:**

1. Student xem xong video hoặc đọc xong content, click nút "Mark as Complete"
2. Frontend gửi **POST /api/progress/complete/{lessonId}** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm lesson trong **collection lessons** để lấy courseId
   - Tìm hoặc tạo document trong **collection progress** với userId và lessonId
   - Cập nhật:
     - isCompleted: true
     - completedAt: timestamp hiện tại
     - watchedDuration: lesson.duration (set full duration)
   - Cập nhật course progress:
     - Query tất cả lessons của course từ **collection lessons**
     - Query tất cả completed lessons của student từ **collection progress**
     - Tính percentage = (completedLessons / totalLessons) \* 100
     - Cập nhật progress document có courseId với percentage mới
   - Nếu percentage = 100%, tạo notification "Bạn đã hoàn thành khóa học!" trong **collection notifications**
   - (Optional) Nếu hoàn thành course, tạo certificate trong **collection certificates**
4. Backend trả về response:
   - success: true
   - progress: { lessonId, isCompleted, completedAt }
   - courseProgress: { completedLessons, totalLessons, percentage }
5. Frontend:
   - Hiển thị thông báo "Bài học đã hoàn thành"
   - Update UI: check icon ✓ trên lesson
   - Update progress bar của course
   - Nếu 100%, show congratulations message và certificate

**Collections liên quan:**

- **progress** (INSERT/UPDATE): Mark lesson completed, update course progress
- **lessons** (SELECT): Count total lessons
- **notifications** (INSERT): Thông báo hoàn thành course
- **certificates** (INSERT): Tạo certificate nếu hoàn thành

**Socket Event:** Có thể emit `progress:update` để real-time update trên các devices khác

---

### 4.7. Workflow Xem tiến độ khóa học

**Mục đích:** Student xem tổng quan tiến độ học tập của mình trong một khóa học

**Các bước:**

1. Student ở trang course detail hoặc dashboard
2. Frontend gửi **GET /api/progress/course/{courseId}** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Kiểm tra student đã enroll course
   - Query tất cả lessons của course từ **collection lessons** (grouped by chapters)
   - Query progress của tất cả lessons từ **collection progress** (userId, courseId)
   - Tính toán:
     - totalLessons: count all lessons
     - completedLessons: count lessons with isCompleted = true
     - percentage: (completedLessons / totalLessons) \* 100
     - totalDuration: sum all lesson durations
     - watchedDuration: sum all watched durations
   - Lấy quizzes và quiz attempts từ **collection quizAttempts**
4. Backend trả về response:
   - success: true
   - progress: object chứa:
     - courseId, userId
     - completedLessons, totalLessons, percentage
     - totalDuration, watchedDuration
     - enrolledAt, lastAccessedAt
     - lessons: array of { lessonId, title, isCompleted, watchedDuration, completedAt }
     - quizScores: array of { quizId, score, passed }
5. Frontend hiển thị:
   - Progress bar với percentage
   - Stats: "X/Y lessons completed"
   - List lessons với completion status
   - Time stats: "Đã học X giờ / Tổng Y giờ"
   - Quiz scores

**Collections liên quan:**

- **progress** (SELECT): Lấy progress của tất cả lessons
- **lessons** (SELECT): Lấy danh sách lessons
- **quizAttempts** (SELECT): Lấy quiz scores

---

## 5. QUIZZES & ASSESSMENT

### 5.1. Workflow Xem chi tiết quiz

**Mục đích:** Student xem thông tin về một bài quiz

**Các bước:**

1. Student thấy quiz trong course content, click vào
2. Frontend gửi **GET /api/quizzes/{quizId}** (có thể không cần Bearer Token)
3. Backend xử lý:
   - Tìm quiz trong **collection quizzes** theo \_id
   - Populate courseId để kiểm tra
   - Nếu student chưa start quiz:
     - Không trả về questions và correct answers
     - Chỉ trả về metadata: title, description, passingScore, timeLimit, maxAttempts
   - Nếu student đã login:
     - Đếm số lần đã làm từ **collection quizAttempts** (userId, quizId)
     - Lấy best score từ attempts
4. Backend trả về response:
   - success: true
   - quiz: object chứa:
     - \_id, title, description
     - courseId, chapterId (nếu có)
     - passingScore: điểm tối thiểu để pass (%)
     - timeLimit: thời gian làm bài (phút)
     - maxAttempts: số lần làm tối đa
     - totalQuestions: số câu hỏi
     - totalPoints: tổng điểm
     - attempts: số lần student đã làm (nếu đã login)
     - bestScore: điểm cao nhất (nếu có)
     - canAttempt: true/false (kiểm tra còn lượt làm không)
5. Frontend hiển thị:
   - Quiz information card
   - Instructions
   - Time limit và passing score
   - Attempts remaining: "X/Y attempts"
   - "Start Quiz" button (nếu canAttempt = true)
   - "View Results" button (nếu đã làm)

**Collections liên quan:**

- **quizzes** (SELECT): Lấy thông tin quiz
- **quizAttempts** (SELECT, COUNT): Đếm attempts, lấy best score

---

### 5.2. Workflow Bắt đầu làm quiz (Start Quiz Attempt)

**Mục đích:** Student bắt đầu một lần làm bài quiz mới

**Các bước:**

1. Student ở trang quiz detail, click "Start Quiz"
2. Frontend hiển thị confirmation: "Bạn có sẵn sàng bắt đầu? Quiz có thời gian X phút"
3. Student confirm
4. Frontend gửi **POST /api/quizzes/{quizId}/start** (yêu cầu Bearer Token)
5. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm quiz trong **collection quizzes**
   - Kiểm tra:
     - Student đã enroll course của quiz
     - Số attempts đã làm < maxAttempts
     - Không có attempt đang in-progress
   - Lấy questions từ **collection questions** (quizId = quizId)
   - Shuffle questions nếu quiz có randomize
   - Tạo document mới trong **collection quizAttempts** với:
     - userId, quizId, courseId
     - startedAt: timestamp hiện tại
     - expiresAt: startedAt + timeLimit (minutes)
     - status: "in-progress"
     - answers: [] (empty array)
     - questions: array của question IDs (thứ tự đã shuffle)
   - Tạo session cache (Redis) để track active attempt
6. Backend trả về response:
   - success: true
   - attempt: { \_id (attemptId), quizId, startedAt, expiresAt }
   - questions: array of questions (KHÔNG bao gồm correctAnswer), mỗi question:
     - \_id, questionText, questionType (multiple-choice, true-false, short-answer)
     - options: array of options (nếu multiple-choice)
     - points: điểm câu hỏi
7. Frontend:
   - Start countdown timer với timeLimit
   - Hiển thị questions một hoặc nhiều câu (paging)
   - Lưu attemptId vào state
   - Enable answer inputs
   - Disable "Start Quiz" button trên tất cả tabs/windows (lock attempt)

**Collections liên quan:**

- **quizzes** (SELECT): Lấy thông tin quiz
- **questions** (SELECT): Lấy câu hỏi
- **quizAttempts** (INSERT): Tạo attempt mới

**Note:** Nếu student refresh page hoặc mất kết nối, có thể resume attempt với attemptId

---

### 5.3. Workflow Nộp bài quiz (Submit Quiz)

**Mục đích:** Student nộp bài quiz sau khi hoàn thành

**Các bước:**

1. Student đã trả lời các câu hỏi hoặc hết thời gian (timer expired)
2. Frontend thu thập tất cả answers:
   - Array of { questionId, answer } objects
   - answer có thể là string hoặc array (multiple-choice multi-select)
3. Frontend gửi **POST /api/quizzes/{quizId}/submit** với body:
   - answers: array of { questionId, answer }
   - attemptId: \_id của attempt (nếu cần xác nhận)
   - (Yêu cầu Bearer Token)
4. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm attempt trong **collection quizAttempts** với:
     - userId, quizId, status: "in-progress"
   - Kiểm tra:
     - Attempt tồn tại và chưa expired (hoặc cho phép submit muộn)
   - Lấy quiz và questions từ **collection quizzes** và **collection questions**
   - Grade từng câu trả lời:
     - So sánh answer với correctAnswer trong question
     - Tính điểm: sum của points cho các câu đúng
   - Tính kết quả:
     - totalScore: sum all points
     - score: điểm đạt được
     - percentage: (score / totalScore) \* 100
     - passed: percentage >= quiz.passingScore
   - Cập nhật attempt document trong **collection quizAttempts**:
     - answers: lưu array answers
     - score, percentage, passed
     - completedAt: timestamp
     - status: "completed"
   - Nếu passed và là lần đầu pass:
     - Tạo notification "Bạn đã pass quiz!" trong **collection notifications**
     - (Optional) Update course progress
5. Backend trả về response:
   - success: true
   - result: object chứa:
     - attemptId, quizId
     - score, totalScore, percentage, passed
     - correctAnswers: số câu đúng
     - totalQuestions: tổng số câu
     - timeSpent: thời gian làm bài (seconds)
     - answers: array of { questionId, studentAnswer, correctAnswer, isCorrect, points }
6. Frontend hiển thị:
   - Result page với score và percentage
   - "Passed" hoặc "Failed" badge
   - Review answers với correct/incorrect indicators
   - Explanation cho mỗi câu (nếu có)
   - "Retake Quiz" button (nếu còn attempts)
   - "View Results History" button

**Collections liên quan:**

- **quizAttempts** (SELECT, UPDATE): Lấy attempt, cập nhật kết quả
- **quizzes** (SELECT): Lấy passing score
- **questions** (SELECT): Lấy correct answers để grade
- **notifications** (INSERT): Thông báo pass quiz

**Note:** Backend phải validate tất cả answers server-side, không trust client

---

### 5.4. Workflow Xem lịch sử các lần làm quiz

**Mục đích:** Student xem tất cả các lần đã làm một quiz

**Các bước:**

1. Student ở trang quiz detail hoặc quiz results, click "View Attempts History"
2. Frontend gửi **GET /api/quizzes/{quizId}/attempts** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Query **collection quizAttempts** với:
     - userId, quizId
     - status: "completed" (chỉ lấy attempts đã hoàn thành)
   - Sort by completedAt desc (mới nhất trên đầu)
4. Backend trả về response:
   - success: true
   - attempts: array of attempt objects, mỗi object:
     - \_id (attemptId)
     - score, percentage, passed
     - correctAnswers, totalQuestions
     - startedAt, completedAt
     - timeSpent: duration (seconds)
5. Frontend hiển thị:
   - Table hoặc list các attempts
   - Columns: Attempt #, Date, Score, Percentage, Pass/Fail, Time
   - Highlight best attempt
   - Click vào một attempt để xem chi tiết (workflow 5.5)

**Collections liên quan:**

- **quizAttempts** (SELECT): Lấy tất cả attempts của student

---

### 5.5. Workflow Xem kết quả chi tiết một lần làm quiz

**Mục đích:** Student xem review chi tiết của một attempt cụ thể

**Các bước:**

1. Student ở attempts history, click vào một attempt
2. Frontend gửi **GET /api/quizzes/{quizId}/results/{attemptId}** (yêu cầu Bearer Token)
3. Backend xử lý:
   - Lấy userId từ JWT token
   - Tìm attempt trong **collection quizAttempts** với \_id = attemptId
   - Kiểm tra attempt.userId = userId (security check)
   - Lấy quiz từ **collection quizzes**
   - Lấy questions từ **collection questions** theo attempt.questions order
   - Merge questions với answers từ attempt.answers
4. Backend trả về response:
   - success: true
   - result: object chứa:
     - attemptId, quizId
     - quizTitle: quiz.title
     - score, totalScore, percentage, passed
     - startedAt, completedAt, timeSpent
     - questions: array of {
       questionId, questionText, questionType,
       options (nếu có),
       studentAnswer: câu trả lời của student,
       correctAnswer: đáp án đúng,
       isCorrect: true/false,
       points, earnedPoints,
       explanation: giải thích (nếu có)
       }
5. Frontend hiển thị:
   - Header: Score, percentage, pass/fail
   - Stats: correctAnswers/totalQuestions, timeSpent
   - List tất cả questions với:
     - Question text
     - Student's answer (highlight red nếu sai, green nếu đúng)
     - Correct answer (nếu sai)
     - Explanation text
     - Points: "X/Y points"
   - "Retake Quiz" button
   - "Back to Quiz" button

**Collections liên quan:**

- **quizAttempts** (SELECT): Lấy attempt detail
- **quizzes** (SELECT): Lấy quiz info
- **questions** (SELECT): Lấy questions với correct answers và explanations

---

**KẾT THÚC PHẦN 1**

**Đã hoàn thành mô tả chi tiết:**

- ✅ 1. Authentication & Account Management (8 workflows)
- ✅ 2. Profile Management (3 workflows)
- ✅ 3. Course Discovery & Enrollment (8 workflows)
- ✅ 4. Learning - Lessons & Content (7 workflows)
- ✅ 5. Quizzes & Assessment (5 workflows)

**Tổng cộng: 31 workflows đã được mô tả chi tiết**

---

**Phần 2 sẽ bao gồm:**

- 6. Discussions & Community (10 workflows)
- 7. Live Sessions (5 workflows)
- 8. Notifications (8 workflows)
- 9. Analytics & Progress Tracking (2 workflows)

Tổng cộng: 25 workflows còn lại
