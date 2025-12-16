# 📚 TEACHER WORKFLOWS - PHẦN 2/3

> **Phần 2:** Quản lý Bài học, Quản lý Quiz & Questions, Quản lý Discussions & Comments

---

## 4. QUẢN LÝ BÀI HỌC (LESSONS)

### 4.1. Workflow Tạo Lesson Mới Trong Chapter

**Mô tả:** Teacher tạo bài học (lesson) mới trong một chapter.

**API Endpoint:** `POST /api/lessons`

**Quy trình:**

1. Teacher vào trang quản lý chapter và click "Thêm bài học"
2. Điền form với thông tin: chapterId, title, content, type (video/text/quiz), duration, order
3. Gửi request POST đến `/api/lessons` kèm JWT token và dữ liệu lesson
4. Hệ thống xác thực token
5. Validate chapterId và dữ liệu đầu vào
6. Tìm chapter trong collection **chapters** để lấy courseId
7. Kiểm tra teacher là owner của course
8. Tự động tính toán order (lấy max order trong chapter + 1) nếu không được cung cấp
9. Tạo document mới trong collection **lessons** với:
   - chapterId
   - title, content, type, duration, order
   - videoUrl (null ban đầu)
   - resources (array rỗng)
   - createdAt, updatedAt
10. Cập nhật field `updatedAt` trong collections **chapters** và **courses**
11. Trả về thông tin lesson vừa tạo với lessonId

**Collections sử dụng:**

- `lessons` - Tạo document mới
- `chapters` - Verify và cập nhật updatedAt
- `courses` - Verify ownership và cập nhật updatedAt

---

### 4.2. Workflow Xem Chi Tiết Lesson

**Mô tả:** Teacher hoặc student xem chi tiết một bài học.

**API Endpoint:** `GET /api/lessons/:id`

**Quy trình:**

1. User click vào lesson để xem chi tiết
2. Gửi request GET đến `/api/lessons/:id`
3. Không bắt buộc authentication nhưng khuyến nghị có
4. Validate lessonId
5. Tìm lesson trong collection **lessons**
6. Populate thông tin chapter từ collection **chapters**
7. Từ chapter lấy courseId và populate thông tin course từ collection **courses**
8. Kiểm tra quyền xem:
   - Nếu course chưa published, chỉ owner xem được
   - Nếu course published, kiểm tra user đã enroll chưa (nếu course có phí)
9. Lấy thông tin video URL, resources
10. Nếu user đã authenticate, lấy progress từ collection **progress**
11. Trả về thông tin lesson đầy đủ: title, content, type, videoUrl, duration, resources, progress

**Collections sử dụng:**

- `lessons` - Đọc thông tin lesson
- `chapters` - Populate chapter info
- `courses` - Verify ownership và enrollment
- `progress` - Lấy tiến độ học (nếu authenticated)

---

### 4.3. Workflow Cập Nhật Thông Tin Lesson

**Mô tả:** Teacher cập nhật nội dung và thông tin của lesson.

**API Endpoint:** `PUT /api/lessons/:id`

**Quy trình:**

1. Teacher vào trang chỉnh sửa lesson
2. Cập nhật các thông tin: title, content, duration, type
3. Gửi request PUT đến `/api/lessons/:id` kèm JWT token và dữ liệu cập nhật
4. Hệ thống xác thực token
5. Validate lessonId và dữ liệu
6. Tìm lesson trong collection **lessons**
7. Lấy chapterId và courseId để kiểm tra teacher là owner
8. Cập nhật các fields được gửi lên trong document lesson
9. Cập nhật field `updatedAt`
10. Cập nhật field `updatedAt` trong collections **chapters** và **courses**
11. Trả về thông tin lesson đã cập nhật

**Collections sử dụng:**

- `lessons` - Cập nhật document
- `chapters` - Cập nhật updatedAt
- `courses` - Verify ownership và cập nhật updatedAt

---

### 4.4. Workflow Upload Video Cho Lesson

**Mô tả:** Teacher upload video bài giảng cho lesson.

**API Endpoint:** `POST /api/lessons/:id/video`

**Quy trình:**

1. Teacher chọn file video từ máy tính
2. Gửi request POST đến `/api/lessons/:id/video` kèm JWT token và file video (multipart/form-data)
3. Hệ thống xác thực token
4. Validate lessonId và file video (định dạng, kích thước)
5. Tìm lesson và kiểm tra teacher là owner của course
6. Upload video lên Cloudinary với resource_type='video'
7. Nhận URL và public_id từ Cloudinary
8. Tạo hoặc cập nhật document trong collection **media** với:
   - lessonId
   - type='video'
   - url (URL từ Cloudinary)
   - publicId (để xóa sau này)
   - size, format
   - createdAt
9. Cập nhật field `videoUrl` trong collection **lessons** với URL mới
10. Nếu có video cũ, xóa khỏi Cloudinary và collection **media**
11. Cập nhật field `updatedAt` trong **lessons**, **chapters**, **courses**
12. Trả về URL video mới

**Collections sử dụng:**

- `lessons` - Cập nhật field videoUrl
- `media` - Tạo/cập nhật document lưu thông tin media
- `chapters` - Cập nhật updatedAt
- `courses` - Cập nhật updatedAt
- Cloudinary service

---

### 4.5. Workflow Upload Tài Nguyên/Resources Cho Lesson

**Mô tả:** Teacher upload tài liệu học tập (PDF, Word, slides, etc.) cho lesson.

**API Endpoint:** `POST /api/lessons/:id/resource`

**Quy trình:**

1. Teacher chọn một hoặc nhiều file tài liệu từ máy tính
2. Gửi request POST đến `/api/lessons/:id/resource` kèm JWT token và files (multipart/form-data, array)
3. Hệ thống xác thực token
4. Validate lessonId và files (định dạng cho phép: pdf, doc, docx, ppt, pptx, zip, etc.)
5. Tìm lesson và kiểm tra teacher là owner
6. Duyệt qua từng file:
   - Upload file lên Cloudinary với resource_type='raw' hoặc 'auto'
   - Nhận URL và public_id từ Cloudinary
   - Tạo document trong collection **media** với:
     - lessonId
     - type='resource'
     - fileName (tên file gốc)
     - url, publicId
     - size, format
     - createdAt
7. Thêm thông tin resources vào field `resources` (array) trong collection **lessons**:
   - resourceId (mediaId)
   - fileName
   - url
   - size
   - uploadedAt
8. Cập nhật field `updatedAt` trong **lessons**, **chapters**, **courses**
9. Trả về danh sách resources đã upload với URLs

**Collections sử dụng:**

- `lessons` - Cập nhật array resources
- `media` - Tạo documents cho mỗi file
- `chapters` - Cập nhật updatedAt
- `courses` - Cập nhật updatedAt
- Cloudinary service

---

### 4.6. Workflow Xóa Resource Của Lesson

**Mô tả:** Teacher xóa một tài liệu đã upload trước đó.

**API Endpoint:** `DELETE /api/lessons/:id/resource/:resId`

**Quy trình:**

1. Teacher click nút xóa trên một resource
2. Gửi request DELETE đến `/api/lessons/:id/resource/:resId` kèm JWT token
3. Hệ thống xác thực token
4. Validate lessonId và resId (resourceId/mediaId)
5. Tìm lesson và kiểm tra teacher là owner
6. Tìm media trong collection **media** theo resId
7. Lấy publicId từ media document
8. Xóa file khỏi Cloudinary bằng publicId
9. Xóa document khỏi collection **media**
10. Xóa resource khỏi array `resources` trong collection **lessons**
11. Cập nhật field `updatedAt` trong **lessons**, **chapters**, **courses**
12. Trả về response thành công

**Collections sử dụng:**

- `lessons` - Xóa item khỏi array resources
- `media` - Xóa document
- `chapters` - Cập nhật updatedAt
- `courses` - Cập nhật updatedAt
- Cloudinary service

---

### 4.7. Workflow Xóa Lesson

**Mô tả:** Teacher xóa một bài học khỏi chapter.

**API Endpoint:** `DELETE /api/lessons/:id`

**Quy trình:**

1. Teacher click nút "Xóa bài học" với xác nhận
2. Gửi request DELETE đến `/api/lessons/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate lessonId
5. Tìm lesson trong collection **lessons**
6. Lấy chapterId và courseId, kiểm tra teacher là owner
7. Tìm tất cả media files liên quan trong collection **media** (filter by lessonId)
8. Duyệt qua từng media và xóa khỏi Cloudinary bằng publicId
9. Xóa tất cả media documents từ collection **media**
10. Xóa các progress records liên quan từ collection **progress** (lessonId)
11. Xóa document lesson từ collection **lessons**
12. Cập nhật lại order của các lessons còn lại trong chapter
13. Cập nhật field `updatedAt` trong **chapters** và **courses**
14. Trả về response thành công

**Collections sử dụng:**

- `lessons` - Xóa document và cập nhật order
- `media` - Xóa tất cả media files của lesson
- `progress` - Xóa progress records
- `chapters` - Cập nhật updatedAt
- `courses` - Cập nhật updatedAt
- Cloudinary service

---

## 5. QUẢN LÝ QUIZ & QUESTIONS

### 5.1. Workflow Tạo Quiz Cho Khóa Học

**Mô tả:** Teacher tạo bài quiz/kiểm tra cho khóa học hoặc chapter.

**API Endpoint:** `POST /api/quizzes`

**Quy trình:**

1. Teacher vào trang tạo quiz
2. Điền form với thông tin:
   - courseId (bắt buộc)
   - chapterId (optional, nếu quiz thuộc chapter cụ thể)
   - title, description
   - passingScore (điểm tối thiểu để pass, 0-100)
   - timeLimit (thời gian làm bài, phút)
   - maxAttempts (số lần làm tối đa)
   - questions (array các câu hỏi)
3. Gửi request POST đến `/api/quizzes` kèm JWT token và dữ liệu quiz
4. Hệ thống xác thực token
5. Kiểm tra teacher là owner của course
6. Validate dữ liệu (passingScore 0-100, timeLimit > 0, maxAttempts > 0)
7. Tạo document mới trong collection **quizzes** với:
   - courseId, chapterId
   - title, description
   - passingScore, timeLimit, maxAttempts
   - totalQuestions (đếm từ array questions)
   - totalPoints (tổng điểm của tất cả questions)
   - createdAt, updatedAt
8. Nếu có questions trong request, tạo documents trong collection **questions** cho mỗi câu hỏi:
   - quizId
   - questionText
   - questionType (multiple-choice, true-false, short-answer)
   - options (array)
   - correctAnswer
   - points
   - order
   - createdAt
9. Cập nhật field `updatedAt` trong **courses**
10. Trả về thông tin quiz với quizId và danh sách questions

**Collections sử dụng:**

- `quizzes` - Tạo document mới
- `questions` - Tạo documents cho các câu hỏi
- `courses` - Verify ownership và cập nhật updatedAt
- `chapters` - Verify nếu có chapterId

---

### 5.2. Workflow Xem Chi Tiết Quiz

**Mô tả:** Teacher hoặc student xem thông tin chi tiết của quiz.

**API Endpoint:** `GET /api/quizzes/:id`

**Quy trình:**

1. User truy cập trang quiz
2. Gửi request GET đến `/api/quizzes/:id`
3. Validate quizId
4. Tìm quiz trong collection **quizzes**
5. Kiểm tra quyền xem:
   - Public nếu course đã published
   - Chỉ owner nếu course chưa published
6. Lấy danh sách questions từ collection **questions** (filter by quizId, sort by order)
7. Nếu user là student và đang xem để làm bài:
   - Không trả về correctAnswer
   - Chỉ trả về questionText, options, points
8. Nếu user là teacher/owner:
   - Trả về đầy đủ bao gồm correctAnswer
9. Nếu student đã làm bài, lấy attempts từ collection **quizAttempts**
10. Trả về thông tin quiz: title, description, passingScore, timeLimit, maxAttempts, questions, userAttempts

**Collections sử dụng:**

- `quizzes` - Đọc thông tin quiz
- `questions` - Đọc danh sách câu hỏi
- `courses` - Verify permissions
- `quizAttempts` - Lấy attempts của student (nếu có)

---

### 5.3. Workflow Cập Nhật Thông Tin Quiz

**Mô tả:** Teacher cập nhật thông tin của quiz.

**API Endpoint:** `PUT /api/quizzes/:id`

**Quy trình:**

1. Teacher vào trang chỉnh sửa quiz
2. Cập nhật các thông tin: title, description, passingScore, timeLimit, maxAttempts
3. Gửi request PUT đến `/api/quizzes/:id` kèm JWT token và dữ liệu cập nhật
4. Hệ thống xác thực token
5. Validate quizId và dữ liệu
6. Tìm quiz trong collection **quizzes**
7. Lấy courseId và kiểm tra teacher là owner
8. Validate giá trị mới (passingScore 0-100, timeLimit > 0, etc.)
9. Cập nhật các fields được gửi lên
10. Cập nhật field `updatedAt`
11. Cập nhật field `updatedAt` trong **courses**
12. Trả về thông tin quiz đã cập nhật

**Collections sử dụng:**

- `quizzes` - Cập nhật document
- `courses` - Verify ownership và cập nhật updatedAt

---

### 5.4. Workflow Xóa Quiz

**Mô tả:** Teacher xóa quiz khỏi khóa học.

**API Endpoint:** `DELETE /api/quizzes/:id`

**Quy trình:**

1. Teacher click nút "Xóa quiz" với xác nhận
2. Gửi request DELETE đến `/api/quizzes/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate quizId
5. Tìm quiz trong collection **quizzes**
6. Lấy courseId và kiểm tra teacher là owner
7. Kiểm tra có students đã làm quiz chưa (có thể cảnh báo hoặc không cho xóa)
8. Xóa tất cả questions từ collection **questions** (filter by quizId)
9. Xóa tất cả quiz attempts từ collection **quizAttempts** (filter by quizId)
10. Xóa document quiz từ collection **quizzes**
11. Cập nhật field `updatedAt` trong **courses**
12. Trả về response thành công

**Collections sử dụng:**

- `quizzes` - Xóa document
- `questions` - Xóa tất cả questions của quiz
- `quizAttempts` - Xóa tất cả attempts
- `courses` - Cập nhật updatedAt

---

### 5.5. Workflow Tạo Câu Hỏi (Question) Cho Quiz

**Mô tả:** Teacher thêm câu hỏi mới vào quiz đã tạo.

**API Endpoint:** `POST /api/questions/quiz/:quizId`

**Quy trình:**

1. Teacher vào trang quản lý quiz và click "Thêm câu hỏi"
2. Điền form với thông tin:
   - questionText (nội dung câu hỏi)
   - questionType (multiple-choice, true-false, short-answer)
   - options (array các lựa chọn, nếu là multiple-choice hoặc true-false)
   - correctAnswer (đáp án đúng: string hoặc array)
   - points (điểm cho câu hỏi, mặc định 1)
3. Gửi request POST đến `/api/questions/quiz/:quizId` kèm JWT token và dữ liệu
4. Hệ thống xác thực token
5. Validate quizId và dữ liệu
6. Tìm quiz trong collection **quizzes**
7. Lấy courseId từ quiz và kiểm tra teacher là owner
8. Validate:
   - questionType hợp lệ
   - Nếu multiple-choice: options phải có ít nhất 2 phần tử
   - correctAnswer phải nằm trong options (nếu multiple-choice)
9. Tự động tính order (max order hiện tại + 1)
10. Tạo document mới trong collection **questions** với:
    - quizId
    - questionText, questionType
    - options, correctAnswer
    - points, order
    - createdAt, updatedAt
11. Cập nhật totalQuestions và totalPoints trong collection **quizzes**
12. Cập nhật field `updatedAt` trong **quizzes** và **courses**
13. Trả về thông tin question vừa tạo với questionId

**Collections sử dụng:**

- `questions` - Tạo document mới
- `quizzes` - Cập nhật totalQuestions, totalPoints, updatedAt
- `courses` - Verify ownership và cập nhật updatedAt

---

### 5.6. Workflow Cập Nhật Câu Hỏi

**Mô tả:** Teacher chỉnh sửa nội dung câu hỏi đã tạo.

**API Endpoint:** `PUT /api/questions/:id`

**Quy trình:**

1. Teacher click vào câu hỏi để chỉnh sửa
2. Cập nhật các thông tin: questionText, questionType, options, correctAnswer, points
3. Gửi request PUT đến `/api/questions/:id` kèm JWT token và dữ liệu cập nhật
4. Hệ thống xác thực token
5. Validate questionId và dữ liệu
6. Tìm question trong collection **questions**
7. Lấy quizId từ question
8. Tìm quiz và courseId, kiểm tra teacher là owner
9. Validate dữ liệu mới (tương tự workflow 5.5)
10. Cập nhật các fields trong document question
11. Cập nhật field `updatedAt`
12. Nếu thay đổi points, cập nhật lại totalPoints trong collection **quizzes**
13. Cập nhật field `updatedAt` trong **quizzes** và **courses**
14. Trả về thông tin question đã cập nhật

**Collections sử dụng:**

- `questions` - Cập nhật document
- `quizzes` - Cập nhật totalPoints (nếu thay đổi), updatedAt
- `courses` - Cập nhật updatedAt

---

### 5.7. Workflow Xóa Câu Hỏi

**Mô tả:** Teacher xóa một câu hỏi khỏi quiz.

**API Endpoint:** `DELETE /api/questions/:id`

**Quy trình:**

1. Teacher click nút "Xóa câu hỏi" với xác nhận
2. Gửi request DELETE đến `/api/questions/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate questionId
5. Tìm question trong collection **questions**
6. Lấy quizId và points của question
7. Tìm quiz và courseId, kiểm tra teacher là owner
8. Xóa document question từ collection **questions**
9. Giảm totalQuestions và totalPoints trong collection **quizzes**
10. Cập nhật lại order của các questions còn lại
11. Cập nhật field `updatedAt` trong **quizzes** và **courses**
12. Trả về response thành công

**Collections sử dụng:**

- `questions` - Xóa document và cập nhật order
- `quizzes` - Cập nhật totalQuestions, totalPoints, updatedAt
- `courses` - Cập nhật updatedAt

---

## 6. QUẢN LÝ DISCUSSIONS & COMMENTS

### 6.1. Workflow Tạo Discussion Trong Khóa Học

**Mô tả:** Teacher tạo discussion/chủ đề thảo luận mới trong khóa học.

**API Endpoint:** `POST /api/discussions`

**Quy trình:**

1. Teacher vào tab "Thảo luận" của khóa học và click "Tạo thảo luận mới"
2. Điền form với: courseId, title, content
3. Gửi request POST đến `/api/discussions` kèm JWT token và dữ liệu
4. Hệ thống xác thực token
5. Kiểm tra user là student hoặc teacher (không cho guest)
6. Validate courseId, title, content
7. Tìm course trong collection **courses** để verify tồn tại
8. Kiểm tra user đã enroll course hoặc là owner (teacher của course)
9. Tạo document mới trong collection **discussions** với:
   - courseId
   - author (userId và populate fullName, avatar)
   - title, content
   - isPinned=false (mặc định)
   - likeCount=0
   - commentCount=0
   - createdAt, updatedAt
10. Gửi notification cho enrolled students về discussion mới (optional)
11. Trả về thông tin discussion với discussionId

**Collections sử dụng:**

- `discussions` - Tạo document mới
- `courses` - Verify enrollment hoặc ownership
- `users` - Populate author info
- `notifications` - Gửi thông báo (optional)

---

### 6.2. Workflow Xem Danh Sách Discussions Của Khóa Học

**Mô tả:** Teacher hoặc student xem tất cả discussions trong một khóa học.

**API Endpoint:** `GET /api/discussions/course/:courseId`

**Quy trình:**

1. User truy cập tab "Thảo luận" của khóa học
2. Gửi request GET đến `/api/discussions/course/:courseId` với query params (page, limit, search, sortBy, order)
3. Không bắt buộc authentication (public)
4. Validate courseId
5. Truy vấn collection **discussions** với filter courseId
6. Áp dụng search (nếu có) trên title và content
7. Áp dụng sorting:
   - Pinned discussions luôn ở đầu (isPinned=true)
   - Sau đó sort theo: newest, popular (likeCount), mostCommented (commentCount)
8. Populate author info từ collection **users**
9. Áp dụng pagination
10. Trả về danh sách discussions với metadata (total, page, limit)

**Collections sử dụng:**

- `discussions` - Đọc danh sách discussions
- `users` - Populate author info
- `courses` - Verify course exists

---

### 6.3. Workflow Xem Chi Tiết Discussion

**Mô tả:** User xem chi tiết một discussion và tất cả comments.

**API Endpoint:** `GET /api/discussions/:id`

**Quy trình:**

1. User click vào discussion để xem chi tiết
2. Gửi request GET đến `/api/discussions/:id`
3. Không bắt buộc authentication (public)
4. Validate discussionId
5. Tìm discussion trong collection **discussions**
6. Populate author info từ collection **users**
7. Lấy tất cả comments từ collection **comments** (filter by discussionId)
8. Populate author info cho từng comment
9. Sắp xếp comments theo cấu trúc tree (parent-child) nếu có nested comments
10. Sort comments theo: oldest first hoặc newest first, hoặc most liked
11. Nếu user đã authenticate, kiểm tra user đã like discussion/comments chưa
12. Trả về discussion detail với danh sách comments đầy đủ

**Collections sử dụng:**

- `discussions` - Đọc thông tin discussion
- `comments` - Đọc tất cả comments
- `users` - Populate author info cho discussion và comments

---

### 6.4. Workflow Cập Nhật Discussion

**Mô tả:** Teacher hoặc author cập nhật nội dung discussion.

**API Endpoint:** `PUT /api/discussions/:id`

**Quy trình:**

1. Author của discussion click nút "Chỉnh sửa"
2. Cập nhật title và/hoặc content
3. Gửi request PUT đến `/api/discussions/:id` kèm JWT token và dữ liệu
4. Hệ thống xác thực token
5. Validate discussionId và dữ liệu
6. Tìm discussion trong collection **discussions**
7. Kiểm tra quyền:
   - User phải là author của discussion
   - Hoặc là teacher/admin của course
8. Cập nhật fields: title, content
9. Cập nhật field `updatedAt`
10. Trả về discussion đã cập nhật

**Collections sử dụng:**

- `discussions` - Cập nhật document
- `courses` - Verify ownership nếu cần

---

### 6.5. Workflow Xóa Discussion

**Mô tả:** Teacher hoặc author xóa discussion.

**API Endpoint:** `DELETE /api/discussions/:id`

**Quy trình:**

1. User click nút "Xóa thảo luận" với xác nhận
2. Gửi request DELETE đến `/api/discussions/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate discussionId
5. Tìm discussion trong collection **discussions**
6. Kiểm tra quyền:
   - User phải là author
   - Hoặc teacher/admin của course
7. Xóa tất cả comments từ collection **comments** (filter by discussionId)
8. Xóa document discussion từ collection **discussions**
9. Trả về response thành công

**Collections sử dụng:**

- `discussions` - Xóa document
- `comments` - Xóa tất cả comments
- `courses` - Verify ownership

---

### 6.6. Workflow Like/Unlike Discussion

**Mô tả:** User like hoặc unlike một discussion.

**API Endpoint:** `PUT /api/discussions/:id/like`

**Quy trình:**

1. User click nút "Like" trên discussion
2. Gửi request PUT đến `/api/discussions/:id/like` kèm JWT token
3. Hệ thống xác thực token
4. Validate discussionId
5. Tìm discussion trong collection **discussions**
6. Kiểm tra user đã like chưa:
   - Nếu chưa: thêm userId vào array `likes` và tăng `likeCount`
   - Nếu rồi: xóa userId khỏi array `likes` và giảm `likeCount`
7. Cập nhật field `updatedAt`
8. Nếu like (không phải unlike), gửi notification cho author
9. Trả về status mới (liked: true/false) và likeCount

**Collections sử dụng:**

- `discussions` - Cập nhật array likes và likeCount
- `notifications` - Gửi thông báo cho author (nếu like)

---

### 6.7. Workflow Pin/Unpin Discussion (Teacher Only)

**Mô tả:** Teacher pin discussion quan trọng lên đầu danh sách.

**API Endpoint:** `PUT /api/discussions/:id/pin` (có thể có thêm endpoint riêng)

**Quy trình:**

1. Teacher click nút "Ghim" trên discussion
2. Gửi request PUT đến endpoint pin với JWT token
3. Hệ thống xác thực token
4. Validate discussionId
5. Tìm discussion và lấy courseId
6. Kiểm tra user là teacher/admin của course
7. Toggle field `isPinned` (true ↔ false)
8. Cập nhật field `updatedAt`
9. Trả về status mới

**Collections sử dụng:**

- `discussions` - Cập nhật field isPinned
- `courses` - Verify teacher ownership

---

### 6.8. Workflow Comment Vào Discussion

**Mô tả:** User comment vào discussion hoặc reply comment khác.

**API Endpoint:** `POST /api/discussions/:id/comment`

**Quy trình:**

1. User nhập comment và click "Gửi"
2. Gửi request POST đến `/api/discussions/:id/comment` kèm JWT token và dữ liệu:
   - content
   - parentId (null nếu comment gốc, hoặc commentId nếu reply)
3. Hệ thống xác thực token
4. Validate discussionId và content
5. Tìm discussion trong collection **discussions**
6. Nếu có parentId, validate parentId tồn tại trong collection **comments**
7. Tạo document mới trong collection **comments** với:
   - discussionId
   - author (userId)
   - content
   - parentId (null hoặc commentId)
   - likeCount=0
   - createdAt, updatedAt
8. Tăng `commentCount` trong collection **discussions**
9. Gửi notification cho:
   - Author của discussion (nếu là comment gốc)
   - Author của parent comment (nếu là reply)
10. Trả về comment vừa tạo với commentId

**Collections sử dụng:**

- `comments` - Tạo document mới
- `discussions` - Cập nhật commentCount
- `notifications` - Gửi thông báo

---

### 6.9. Workflow Cập Nhật Comment

**Mô tả:** User chỉnh sửa comment của mình.

**API Endpoint:** `PUT /api/comments/:id`

**Quy trình:**

1. User click "Chỉnh sửa" trên comment của mình
2. Cập nhật content
3. Gửi request PUT đến `/api/comments/:id` kèm JWT token và content mới
4. Hệ thống xác thực token
5. Validate commentId và content
6. Tìm comment trong collection **comments**
7. Kiểm tra user là author của comment
8. Cập nhật field `content`
9. Đánh dấu comment đã được edit (optional: thêm flag `isEdited=true`, `editedAt`)
10. Cập nhật field `updatedAt`
11. Trả về comment đã cập nhật

**Collections sử dụng:**

- `comments` - Cập nhật document

---

### 6.10. Workflow Xóa Comment

**Mô tả:** User xóa comment của mình.

**API Endpoint:** `DELETE /api/comments/:id`

**Quy trình:**

1. User click "Xóa" trên comment với xác nhận
2. Gửi request DELETE đến `/api/comments/:id` kèm JWT token
3. Hệ thống xác thực token
4. Validate commentId
5. Tìm comment trong collection **comments**
6. Kiểm tra quyền:
   - User là author của comment
   - Hoặc teacher/admin của course
7. Lấy discussionId từ comment
8. Kiểm tra comment có replies không (có parentId trỏ đến commentId này):
   - Nếu có: có thể soft delete (đánh dấu deleted) hoặc replace content bằng "[Đã xóa]"
   - Nếu không: xóa hoàn toàn
9. Xóa document từ collection **comments**
10. Giảm `commentCount` trong collection **discussions**
11. Trả về response thành công

**Collections sử dụng:**

- `comments` - Xóa document (hoặc soft delete)
- `discussions` - Giảm commentCount

---

### 6.11. Workflow Like/Unlike Comment

**Mô tả:** User like hoặc unlike một comment.

**API Endpoint:** `PUT /api/comments/:id/like`

**Quy trình:**

1. User click nút "Like" trên comment
2. Gửi request PUT đến `/api/comments/:id/like` kèm JWT token
3. Hệ thống xác thực token
4. Validate commentId
5. Tìm comment trong collection **comments**
6. Kiểm tra user đã like chưa:
   - Nếu chưa: thêm userId vào array `likes` và tăng `likeCount`
   - Nếu rồi: xóa userId khỏi array `likes` và giảm `likeCount`
7. Cập nhật field `updatedAt`
8. Nếu like (không phải unlike), gửi notification cho author của comment
9. Trả về status mới (liked: true/false) và likeCount

**Collections sử dụng:**

- `comments` - Cập nhật array likes và likeCount
- `notifications` - Gửi thông báo cho author (nếu like)

---

## 📝 Tổng Kết Phần 2

**Phần 2** đã mô tả chi tiết các workflow sau:

- ✅ 7 workflows về Quản lý Bài học (Lessons)
- ✅ 7 workflows về Quản lý Quiz & Questions
- ✅ 11 workflows về Quản lý Discussions & Comments

**Tổng cộng: 25 workflows trong Phần 2**

**Collections chính được sử dụng trong Phần 2:**

- `lessons` - Lưu thông tin bài học
- `media` - Lưu thông tin video và resources
- `quizzes` - Lưu thông tin quiz/kiểm tra
- `questions` - Lưu câu hỏi của quiz
- `quizAttempts` - Lưu lần làm bài của students
- `discussions` - Lưu chủ đề thảo luận
- `comments` - Lưu comments và replies
- `progress` - Tracking tiến độ học
- `notifications` - Gửi thông báo
- `users` - Populate author info
- `courses` - Verify ownership
- `chapters` - Reference cho lessons

**External Services:**

- Cloudinary - Lưu video và resource files
- SendGrid/Email - Notification emails (optional)

---

> **Tiếp theo:** [TEACHER_WORKFLOWS_PART3.md](./TEACHER_WORKFLOWS_PART3.md) - Quản lý Live Sessions, Notifications, Analytics & Progress Tracking
