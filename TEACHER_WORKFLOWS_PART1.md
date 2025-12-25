# 📚 TEACHER WORKFLOWS - PHẦN 1/3

> **Phần 1:** Quản lý Tài khoản & Xác thực, Quản lý Khóa học, Quản lý Chương

---

## 1. QUẢN LÝ TÀI KHOẢN & XÁC THỰC

### 1.1. Workflow Đăng Ký Tài Khoản Teacher

**Mô tả:** Teacher tạo tài khoản mới trên hệ thống.

**API Endpoint:** `POST /api/auth/register`

**Quy trình:**

1. Teacher truy cập trang đăng ký (`/register`)
2. Điền form đăng ký với thông tin:
   - Họ tên đầy đủ (fullName)
   - Email
   - Password
   - Confirm Password
   - Ngày sinh (dateOfBirth) - optional
   - **Chọn role = "teacher" qua Radio Buttons** (Student/Teacher)
3. Frontend validate dữ liệu (password khớp, email hợp lệ)
4. Gửi request POST đến `/api/auth/register` với body:
   ```json
   {
     "fullName": "Nguyen Van B",
     "email": "teacher@example.com",
     "password": "password123",
     "role": "teacher",
     "dateOfBirth": "1990-01-01"
   }
   ```
5. Backend xử lý:
   - Validate dữ liệu đầu vào (email hợp lệ, password ≥ 6 ký tự)
   - Kiểm tra email đã tồn tại trong **collection users** chưa
   - Hash password bằng bcrypt
   - Tạo document mới trong collection **users** với:
     - fullName, email, password (hashed)
     - role: "teacher"
     - isVerified: true (mặc định, không cần xác thực email)
     - isBanned: false
     - **profileCompleted: false**
     - **profileApprovalStatus: null**
     - createdAt: timestamp hiện tại
   - Tạo document trong collection **userProfiles** liên kết với userId
6. Trả về response:
   ```json
   {
     "success": true,
     "message": "Registration successful. Please login.",
     "user": {
       "_id": "user_id",
       "fullName": "Nguyen Van B",
       "email": "teacher@example.com",
       "role": "teacher",
       "avatar": "",
       "isVerified": true,
       "profileCompleted": false,
       "profileApprovalStatus": null
     }
   }
   ```
7. Frontend xử lý:
   - Hiển thị toast: "Đăng ký thành công! Vui lòng đăng nhập."
   - **Redirect đến `/login`**

**Collections sử dụng:**

- `users` - Tạo document mới cho teacher
- `userProfiles` - Tạo profile mới

**UI Changes:**

- Radio buttons cho role selection (Student/Teacher)
- Accent color styling cho radio buttons

**Note:** Teacher có thể đăng nhập ngay sau khi đăng ký (không cần verify email)

---

### 1.2. Workflow Đăng Nhập

**Mô tả:** Teacher đăng nhập vào hệ thống với email và password.

**API Endpoint:** `POST /api/auth/login`

**Quy trình:**

1. Teacher truy cập trang đăng nhập (`/login`)
2. Nhập email và password
3. Gửi request POST đến `/api/auth/login` với body:
   ```json
   {
     "email": "teacher@example.com",
     "password": "password123"
   }
   ```
4. Backend xử lý:
   - Tìm user trong collection **users** theo email (lowercase)
   - Kiểm tra user có tồn tại không → Nếu không: 401 "Invalid email or password"
   - So sánh password với hashed password bằng bcrypt.compare()
   - Nếu sai password → 401 "Invalid email or password"
   - **Kiểm tra email verification (CRITICAL):**
     - Nếu `isVerified = false` → Trả về 403:
       ```json
       {
         "message": "Your account has not been verified. Please check your email.",
         "isVerified": false,
         "requiresVerification": true
       }
       ```
       **→ STOP, không cho login**
   - Nếu đã verified, tạo JWT access token và refresh token
   - Lưu refresh token vào user document
   - Set cookie với refreshToken (httpOnly, secure)
5. Trả về response thành công:
   ```json
   {
     "message": "Login successful.",
     "user": {
       "_id": "user_id",
       "fullName": "Nguyen Van B",
       "email": "teacher@example.com",
       "role": "teacher",
       "avatar": "",
       "isVerified": true,
       "profileCompleted": false,
       "profileApprovalStatus": null,
       "profile": {
         "phone": null,
         "address": null,
         "bio": null,
         "expertise": null,
         "qualifications": null,
         "cvUrl": null
       }
     },
     "tokens": {
       "accessToken": "jwt_token"
     }
   }
   ```
6. Frontend xử lý response theo Teacher Flow:
   - **Nếu requiresVerification = true:**
     - Redirect đến `/email-verification-required`
   - **Nếu login thành công:**
     - Lưu accessToken vào localStorage
     - Lưu user info vào AuthContext
     - Hiển thị toast: "Chào mừng {fullName}!"
     - **Check verification và profile status:**
       ```javascript
       if (!user.isVerified) {
         navigate("/email-verification-required");
       } else if (!user.profileCompleted) {
         navigate("/teacher/complete-profile");
       } else if (user.profileApprovalStatus === "pending") {
         navigate("/teacher/approval-pending");
       } else if (user.profileApprovalStatus === "rejected") {
         showError("Hồ sơ của bạn đã bị từ chối. Vui lòng liên hệ admin.");
       } else {
         navigate("/dashboard");
       }
       ```

**Collections sử dụng:**

- `users` - Đọc thông tin user để xác thực, lưu refreshToken
- `userProfiles` - Lấy thông tin profile để trả về

**Teacher Login Flow:**

```
Login → Check credentials → Check isVerified
  ├─ Not Verified → /email-verification-required
  └─ Verified → Check profileCompleted
      ├─ Not Completed → /teacher/complete-profile
      └─ Completed → Check profileApprovalStatus
          ├─ pending → /teacher/approval-pending
          ├─ rejected → Show error message
          └─ approved → /dashboard
```

**Note:** Teacher phải qua 3 bước trước khi vào dashboard:

1. Email verification
2. Profile completion
3. Admin approval

---

### 1.3. Workflow Hoàn Thành Hồ Sơ Teacher

**Mô tả:** Teacher điền đầy đủ thông tin cá nhân và upload CV sau khi đăng ký.

**API Endpoint:** `POST /api/users/complete-teacher-profile`

**Điều kiện tiên quyết:**

- User phải có role = "teacher"
- Profile chưa được hoàn thành (`profileCompleted = false`)

**Quy trình:**

1. Teacher login thành công và được redirect đến `/teacher/complete-profile`
2. Teacher điền form với thông tin:
   - **Số điện thoại** (phone) - required
   - **Địa chỉ** (address) - required
   - **Giới thiệu bản thân** (bio) - required, textarea
   - **Chuyên môn** (expertise) - required, textarea
   - **Bằng cấp & Chứng chỉ** (qualifications) - required, textarea
   - **Upload CV** (file PDF, max 5MB) - required
3. Frontend validate:
   - Tất cả các trường đều bắt buộc
   - File CV phải là PDF
   - File size không quá 5MB
4. Frontend gửi request POST đến `/api/users/complete-teacher-profile` với Content-Type: `multipart/form-data`:
   ```
   FormData {
     phone: "0987654321",
     address: "123 Đường ABC, Quận XYZ, TP.HCM",
     bio: "Tôi là giảng viên...",
     expertise: "Lập trình Web, Machine Learning...",
     qualifications: "Thạc sĩ CNTT, Chứng chỉ AWS...",
     cv: File (PDF)
   }
   ```
5. Backend xử lý:
   - Xác thực JWT token từ header
   - Kiểm tra user.role === "teacher"
   - Kiểm tra user.profileCompleted === false (chưa submit trước đó)
   - Validate tất cả các trường required
   - **Upload CV lên Cloudinary:**
     - Folder: "cvs"
     - Resource type: "raw" (cho PDF)
     - Lấy về: secure_url, public_id
     - Xóa file local sau khi upload thành công
   - Cập nhật **collection userProfiles:**
     - phone, address, bio, expertise, qualifications
     - cvUrl, cvPublicId
   - Cập nhật **collection users:**
     - profileCompleted = true
     - profileApprovalStatus = "pending"
6. Trả về response thành công:
   ```json
   {
     "success": true,
     "message": "Profile submitted successfully. Please wait for admin approval (at least 48 hours).",
     "data": {
       "profileCompleted": true,
       "profileApprovalStatus": "pending"
     }
   }
   ```
7. Frontend xử lý:
   - Hiển thị toast: "Hồ sơ đã được nộp thành công!"
   - **Redirect đến `/teacher/approval-pending`**

**Collections sử dụng:**

- `users` - Cập nhật profileCompleted, profileApprovalStatus
- `userProfiles` - Lưu thông tin chi tiết và CV URL
- Cloudinary - Upload file CV

**UI Components:**

**Trang `/teacher/complete-profile`:**

- Form với các input fields
- File input cho CV (chỉ accept .pdf)
- Validation messages
- Submit button

**Trang `/teacher/approval-pending`:**

- Icon clock
- Thông báo: "Hồ sơ đang được xét duyệt"
- Message: "Quá trình này có thể mất từ 24-48 giờ"
- Button: "Về trang chủ"

**Error Handling:**

- 403 nếu không phải teacher
- 400 nếu profile đã completed trước đó
- 400 nếu thiếu thông tin required
- 500 nếu upload CV thất bại

**Note:**

- Teacher KHÔNG thể truy cập dashboard cho đến khi admin approve
- Admin sẽ review và approve/reject trong vòng 48h

---

### 1.4. Workflow Đăng Xuất

**Mô tả:** Teacher đăng xuất khỏi hệ thống.

**API Endpoint:** `POST /api/auth/logout`

**Quy trình:**

1. Teacher click nút "Đăng xuất"
2. Gửi request POST đến `/api/auth/logout` kèm JWT token trong header
3. Hệ thống xác thực token
4. Xóa refresh token khỏi database hoặc đánh dấu token đã hết hạn
5. Client xóa token khỏi localStorage/cookie
6. Redirect về trang đăng nhập
7. Trả về response thành công

**Collections sử dụng:**

- Có thể sử dụng collection `tokens` hoặc `sessions` nếu lưu refresh token
- Hoặc chỉ xử lý ở client-side (xóa token)

---

### 1.5. Workflow Làm Mới Access Token

**Mô tả:** Làm mới access token khi token cũ sắp hết hạn hoặc đã hết hạn.

**API Endpoint:** `POST /api/auth/refresh-token`

**Quy trình:**

1. Client phát hiện access token sắp hết hạn hoặc nhận 401 Unauthorized
2. Gửi request POST đến `/api/auth/refresh-token` với refresh token
3. Hệ thống validate refresh token
4. Kiểm tra refresh token trong database (nếu lưu)
5. Verify refresh token chưa hết hạn và còn hợp lệ
6. Tạo access token mới
7. Tùy chọn: tạo refresh token mới (rotation)
8. Trả về access token mới (và refresh token mới nếu có)

**Collections sử dụng:**

- `users` - Đọc thông tin user
- Có thể dùng collection `tokens` để lưu refresh tokens

---

### 1.6. Workflow Xem Thông Tin Profile Cá Nhân

**Mô tả:** Teacher xem thông tin profile của chính mình.

**API Endpoint:** `GET /api/users/profile`

**Quy trình:**

1. Teacher truy cập trang profile
2. Gửi request GET đến `/api/users/profile` kèm JWT token
3. Hệ thống xác thực token và lấy userId từ token
4. Tìm user trong collection **users** theo userId
5. Populate thông tin từ collection **userProfiles** nếu có
6. Trả về thông tin user: fullName, email, role, avatar, phone, address, isEmailVerified, createdAt, etc.

**Collections sử dụng:**

- `users` - Đọc thông tin user
- `userProfiles` - Đọc thông tin profile chi tiết

---

### 1.7. Workflow Cập Nhật Thông Tin Profile

**Mô tả:** Teacher cập nhật thông tin cá nhân như tên, số điện thoại, địa chỉ.

**API Endpoint:** `PUT /api/users/profile`

**Quy trình:**

1. Teacher truy cập trang chỉnh sửa profile
2. Cập nhật các thông tin: name, phone, address
3. Gửi request PUT đến `/api/users/profile` kèm JWT token và dữ liệu cập nhật
4. Hệ thống xác thực token
5. Validate dữ liệu đầu vào
6. Cập nhật document trong collection **users** (field `fullName`) nếu có
7. Cập nhật document trong collection **userProfiles** (fields: phone, address, bio, etc.)
8. Trả về thông tin user đã được cập nhật

**Collections sử dụng:**

- `users` - Cập nhật fullName
- `userProfiles` - Cập nhật phone, address, bio

---

### 1.8. Workflow Upload Avatar

**Mô tả:** Teacher upload ảnh đại diện.

**API Endpoint:** `POST /api/users/avatar`

**Quy trình:**

1. Teacher chọn file ảnh từ máy tính
2. Gửi request POST đến `/api/users/avatar` kèm JWT token và file ảnh (multipart/form-data)
3. Hệ thống xác thực token
4. Validate file (định dạng ảnh, kích thước)
5. Upload ảnh lên Cloudinary service
6. Nhận URL của ảnh từ Cloudinary
7. Cập nhật field `avatar` trong collection **users** với URL mới
8. Nếu có avatar cũ, xóa ảnh cũ trên Cloudinary
9. Trả về URL của avatar mới

**Collections sử dụng:**

- `users` - Cập nhật field avatar
- Cloudinary service để lưu trữ ảnh

---

## 2. QUẢN LÝ KHÓA HỌC (COURSES)

### 2.1. Workflow Tạo Khóa Học Mới

**Mô tả:** Teacher tạo một khóa học mới trên hệ thống.

**API Endpoint:** `POST /api/courses`

**Quy trình:**

1. Teacher truy cập trang tạo khóa học
2. Điền form với thông tin: title, description, category, level, price
3. Gửi request POST đến `/api/courses` kèm JWT token
4. Hệ thống xác thực token và kiểm tra role='teacher' hoặc 'admin'
5. Validate dữ liệu đầu vào (title required, category valid, level valid, price >= 0)
6. Tạo document mới trong collection **courses** với:
   - title, description, category, level, price
   - instructor (userId của teacher)
   - isPublished=false (mặc định chưa publish)
   - enrollmentCount=0
   - averageRating=0
   - createdAt, updatedAt
7. Trả về thông tin khóa học vừa tạo với courseId

**Collections sử dụng:**

- `courses` - Tạo document mới

---

### 2.2. Workflow Upload Thumbnail Cho Khóa Học

**Mô tả:** Teacher upload ảnh thumbnail cho khóa học.

**API Endpoint:** `POST /api/courses/:id/thumbnail`

**Quy trình:**

1. Teacher vào trang chỉnh sửa khóa học
2. Chọn file ảnh thumbnail từ máy tính
3. Gửi request POST đến `/api/courses/:id/thumbnail` kèm JWT token và file ảnh
4. Hệ thống xác thực token và kiểm tra teacher là owner của khóa học
5. Validate courseId và file ảnh (định dạng, kích thước)
6. Upload ảnh lên Cloudinary
7. Nhận URL từ Cloudinary
8. Cập nhật field `thumbnail` trong document của collection **courses**
9. Nếu có thumbnail cũ, xóa khỏi Cloudinary
10. Trả về URL thumbnail mới

**Collections sử dụng:**

- `courses` - Cập nhật field thumbnail
- Cloudinary service

---

### 2.3. Workflow Xem Danh Sách Tất Cả Khóa Học (Public)

**Mô tả:** Teacher xem danh sách tất cả khóa học trên hệ thống (cả của mình và người khác).

**API Endpoint:** `GET /api/courses`

**Quy trình:**

1. Teacher truy cập trang danh sách khóa học
2. Có thể áp dụng filter: category, level, search keyword, sort
3. Gửi request GET đến `/api/courses` với query params (page, limit, category, level, search, sort)
4. Hệ thống không yêu cầu authentication (public endpoint)
5. Truy vấn collection **courses** với các điều kiện filter
6. Chỉ lấy các khóa học có `isPublished=true` (hoặc tất cả nếu teacher là owner)
7. Populate thông tin instructor từ collection **users**
8. Áp dụng pagination
9. Trả về danh sách courses với metadata (total, page, limit, totalPages)

**Collections sử dụng:**

- `courses` - Đọc danh sách courses
- `users` - Populate thông tin instructor

---

### 2.4. Workflow Xem Chi Tiết Khóa Học

**Mô tả:** Teacher xem chi tiết một khóa học cụ thể.

**API Endpoint:** `GET /api/courses/:id`

**Quy trình:**

1. Teacher click vào một khóa học để xem chi tiết
2. Gửi request GET đến `/api/courses/:id`
3. Hệ thống không bắt buộc authentication (optionalAuthenticate)
4. Validate courseId
5. Tìm course trong collection **courses** theo courseId
6. Kiểm tra quyền xem: nếu isPublished=false, chỉ owner mới xem được
7. Populate thông tin instructor từ collection **users**
8. Lấy danh sách chapters từ collection **chapters** (filter by courseId, sort by order)
9. Với mỗi chapter, lấy danh sách lessons từ collection **lessons** (filter by chapterId, sort by order)
10. Nếu user đã authenticate, kiểm tra đã enroll chưa
11. Lấy reviews/ratings nếu có
12. Trả về thông tin chi tiết course với chapters, lessons, instructor, enrollment status

**Collections sử dụng:**

- `courses` - Đọc thông tin course
- `users` - Populate instructor
- `chapters` - Đọc danh sách chapters
- `lessons` - Đọc danh sách lessons
- `progress` - Kiểm tra enrollment (nếu authenticated)

---

### 2.5. Workflow Xem Danh Sách Khóa Học Của Teacher (My Courses)

**Mô tả:** Teacher xem danh sách các khóa học do chính mình tạo.

**API Endpoint:** `GET /api/courses/my-courses`

**Quy trình:**

1. Teacher truy cập trang "Khóa học của tôi"
2. Gửi request GET đến `/api/courses/my-courses` kèm JWT token
3. Hệ thống xác thực token và lấy userId
4. Kiểm tra role='teacher' hoặc 'admin'
5. Truy vấn collection **courses** với điều kiện `instructor=userId`
6. Lấy tất cả courses (cả published và unpublished)
7. Có thể áp dụng pagination và sorting
8. Trả về danh sách courses của teacher với thông tin: title, thumbnail, enrollmentCount, isPublished, averageRating, createdAt

**Collections sử dụng:**

- `courses` - Đọc courses với filter instructor=userId

---

### 2.6. Workflow Cập Nhật Thông Tin Khóa Học

**Mô tả:** Teacher cập nhật thông tin của khóa học đã tạo.

**API Endpoint:** `PUT /api/courses/:id`

**Quy trình:**

1. Teacher vào trang chỉnh sửa khóa học
2. Cập nhật các thông tin: title, description, price, category, level
3. Gửi request PUT đến `/api/courses/:id` kèm JWT token và dữ liệu cập nhật
4. Hệ thống xác thực token
5. Validate courseId và dữ liệu
6. Tìm course trong collection **courses**
7. Kiểm tra teacher là owner của course (instructor=userId)
8. Cập nhật các fields được gửi lên
9. Cập nhật field `updatedAt`
10. Trả về thông tin course đã cập nhật

**Collections sử dụng:**

- `courses` - Cập nhật document

---

### 2.7. Workflow Publish/Unpublish Khóa Học

**Mô tả:** Teacher publish khóa học để công khai hoặc unpublish để ẩn khỏi danh sách public.

**API Endpoint:** `PUT /api/courses/:id/publish`

**Quy trình:**

1. Teacher click nút "Publish" hoặc "Unpublish" trên trang quản lý khóa học
2. Gửi request PUT đến `/api/courses/:id/publish` kèm JWT token
3. Hệ thống xác thực token
4. Validate courseId
5. Tìm course trong collection **courses**
6. Kiểm tra teacher là owner
7. Kiểm tra khóa học có đủ điều kiện publish không (có ít nhất 1 chapter, 1 lesson, có thumbnail, etc.)
8. Toggle field `isPublished` (true ↔ false)
9. Cập nhật field `updatedAt`
10. Nếu publish, có thể gửi notification cho followers
11. Trả về status mới của course

**Collections sử dụng:**

- `courses` - Cập nhật field isPublished
- `notifications` - Tạo thông báo (nếu có)

---

### 2.8. Workflow Xóa Khóa Học

**Mô tả:** Teacher xóa khóa học đã tạo.

**API Endpoint:** `DELETE /api/courses/:id`

**Quy trình:**

1. Teacher click nút "Xóa khóa học" với xác nhận
2. Gửi request DELETE đến `/api/courses/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate courseId
5. Tìm course trong collection **courses**
6. Kiểm tra teacher là owner hoặc admin
7. Kiểm tra khóa học có học viên đang enroll không (có thể không cho xóa nếu có student)
8. Xóa tất cả chapters liên quan từ collection **chapters**
9. Xóa tất cả lessons liên quan từ collection **lessons**
10. Xóa tất cả quizzes liên quan từ collection **quizzes**
11. Xóa tất cả media files trên Cloudinary
12. Xóa discussions liên quan từ collection **discussions**
13. Xóa progress records từ collection **progress**
14. Xóa document course từ collection **courses**
15. Trả về response thành công

**Collections sử dụng:**

- `courses` - Xóa document
- `chapters` - Xóa các chapters của course
- `lessons` - Xóa các lessons
- `quizzes` - Xóa các quizzes
- `discussions` - Xóa discussions
- `progress` - Xóa progress records
- `media` - Xóa media files
- Cloudinary service

---

### 2.9. Workflow Xem Danh Sách Học Viên Đã Enroll Khóa Học

**Mô tả:** Teacher xem danh sách các học viên đã đăng ký khóa học của mình.

**API Endpoint:** `GET /api/courses/:id/students`

**Quy trình:**

1. Teacher vào trang quản lý khóa học và chọn tab "Học viên"
2. Gửi request GET đến `/api/courses/:id/students` kèm JWT token
3. Hệ thống xác thực token
4. Validate courseId
5. Kiểm tra teacher là owner của course hoặc admin
6. Truy vấn collection **progress** với điều kiện courseId và lấy distinct studentIds
7. Hoặc truy vấn collection **courses** và lấy array `enrolledStudents`
8. Populate thông tin students từ collection **users**
9. Lấy thêm thông tin tiến độ từ collection **progress**
10. Áp dụng pagination
11. Trả về danh sách students với thông tin: name, email, avatar, enrollmentDate, progress percentage

**Collections sử dụng:**

- `courses` - Verify ownership
- `progress` - Lấy danh sách enrolled students và tiến độ
- `users` - Populate thông tin students

---

## 3. QUẢN LÝ CHƯƠNG (CHAPTERS)

### 3.1. Workflow Tạo Chapter Mới Cho Khóa Học

**Mô tả:** Teacher tạo chapter (chương) mới trong khóa học.

**API Endpoint:** `POST /api/chapters`

**Quy trình:**

1. Teacher vào trang quản lý khóa học và click "Thêm chương"
2. Nhập title cho chapter
3. Gửi request POST đến `/api/chapters` kèm JWT token và dữ liệu: courseId, title, order
4. Hệ thống xác thực token
5. Kiểm tra teacher là owner của course (từ courseId)
6. Validate courseId và title
7. Tự động tính toán order (lấy max order hiện tại + 1) nếu không được cung cấp
8. Tạo document mới trong collection **chapters** với:
   - courseId
   - title
   - order
   - createdAt, updatedAt
9. Cập nhật field `updatedAt` trong collection **courses**
10. Trả về thông tin chapter vừa tạo với chapterId

**Collections sử dụng:**

- `chapters` - Tạo document mới
- `courses` - Verify ownership và cập nhật updatedAt

---

### 3.2. Workflow Cập Nhật Thông Tin Chapter

**Mô tả:** Teacher cập nhật title của chapter.

**API Endpoint:** `PUT /api/chapters/:id`

**Quy trình:**

1. Teacher click vào chapter và chỉnh sửa title
2. Gửi request PUT đến `/api/chapters/:id` kèm JWT token và dữ liệu mới (title)
3. Hệ thống xác thực token
4. Validate chapterId
5. Tìm chapter trong collection **chapters**
6. Lấy courseId từ chapter và kiểm tra teacher là owner của course
7. Cập nhật field `title` trong document chapter
8. Cập nhật field `updatedAt`
9. Cập nhật field `updatedAt` trong collection **courses**
10. Trả về thông tin chapter đã cập nhật

**Collections sử dụng:**

- `chapters` - Cập nhật document
- `courses` - Verify ownership và cập nhật updatedAt

---

### 3.3. Workflow Sắp Xếp Lại Thứ Tự Các Chapters

**Mô tả:** Teacher thay đổi thứ tự hiển thị của các chapters trong khóa học.

**API Endpoint:** `PUT /api/chapters/reorder`

**Quy trình:**

1. Teacher kéo thả (drag & drop) để sắp xếp lại chapters
2. Gửi request PUT đến `/api/chapters/reorder` kèm JWT token và dữ liệu: courseId, chapterIds (array theo thứ tự mới)
3. Hệ thống xác thực token
4. Validate courseId và chapterIds
5. Kiểm tra teacher là owner của course
6. Kiểm tra tất cả chapterIds có thuộc về courseId không
7. Duyệt qua array chapterIds và cập nhật field `order` cho từng chapter trong collection **chapters**
8. Cập nhật field `updatedAt` cho các chapters
9. Cập nhật field `updatedAt` trong collection **courses**
10. Trả về danh sách chapters với thứ tự mới

**Collections sử dụng:**

- `chapters` - Cập nhật field order cho nhiều documents
- `courses` - Verify ownership và cập nhật updatedAt

---

### 3.4. Workflow Xóa Chapter

**Mô tả:** Teacher xóa một chapter khỏi khóa học.

**API Endpoint:** `DELETE /api/chapters/:id`

**Quy trình:**

1. Teacher click nút "Xóa chương" với xác nhận
2. Gửi request DELETE đến `/api/chapters/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate chapterId
5. Tìm chapter trong collection **chapters**
6. Lấy courseId và kiểm tra teacher là owner
7. Tìm tất cả lessons thuộc chapter này trong collection **lessons**
8. Xóa tất cả media files của lessons khỏi Cloudinary
9. Xóa tất cả lessons từ collection **lessons**
10. Xóa tất cả quizzes liên quan (nếu quiz thuộc chapter) từ collection **quizzes**
11. Xóa chapter từ collection **chapters**
12. Cập nhật lại order của các chapters còn lại
13. Cập nhật field `updatedAt` trong collection **courses**
14. Trả về response thành công

**Collections sử dụng:**

- `chapters` - Xóa document và cập nhật order
- `lessons` - Xóa tất cả lessons của chapter
- `quizzes` - Xóa quizzes liên quan
- `media` - Xóa media records
- `courses` - Cập nhật updatedAt
- Cloudinary service

---

## 📝 Tổng Kết Phần 1

**Phần 1** đã mô tả chi tiết các workflow sau:

- ✅ 10 workflows về Quản lý Tài khoản & Xác thực
- ✅ 9 workflows về Quản lý Khóa học (Courses)
- ✅ 4 workflows về Quản lý Chương (Chapters)

**Collections chính được sử dụng trong Phần 1:**

- `users` - Lưu thông tin user/teacher
- `userProfiles` - Lưu thông tin profile chi tiết
- `courses` - Lưu thông tin khóa học
- `chapters` - Lưu thông tin chương học
- `lessons` - Reference khi xóa chapter
- `quizzes` - Reference khi xóa chapter
- `progress` - Tracking enrollment và tiến độ
- `discussions` - Reference khi xóa course
- `media` - Lưu thông tin media files
- `notifications` - Gửi thông báo

**External Services:**

- SendGrid - Gửi email
- Cloudinary - Lưu trữ ảnh và video
- JWT - Authentication tokens

---

> **Tiếp theo:** [TEACHER_WORKFLOWS_PART2.md](./TEACHER_WORKFLOWS_PART2.md) - Quản lý Lessons, Quiz & Questions, Discussions & Comments
