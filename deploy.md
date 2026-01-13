# Hướng Dẫn Deploy Dự Án Lên Render

Tài liệu này sẽ hướng dẫn bạn (User) từng bước để deploy **Backend** và **Frontend** của dự án E-learning lên nền tảng Render.com.

## Lưu ý quan trọng
- Chúng ta sẽ deploy **Backend trước**, sau đó mới nhận được URL của Backend để cấu hình cho **Frontend**.
- Hãy chuẩn bị sẵn các tài khoản: Render, GitHub, MongoDB Atlas, Cloudinary, SendGrid (nếu dùng email), Google Cloud Console (cho Login GG).

---

## Phần 1: Deploy Backend

### 1. Chuẩn bị trước khi deploy
Đảm bảo file `backend/package.json` của bạn không bị lỗi. Render sẽ dùng lệnh `npm install` để cài thư viện.
Vì file `package.json` của bạn chưa có lệnh `start` chính thức (chỉ có `dev` dùng nodemon), bạn nên cấu hình lệnh Start trên Render là `node server.js`.

### 2. Tạo Web Service trên Render
1.  Truy cập [Render Dashboard](https://dashboard.render.com/).
2.  Nhấn **New +** -> chọn **Web Service**.
3.  Kết nối với GitHub repository chứa code của bạn.
4.  Điền các thông tin sau:
    -   **Name**: Đặt tên (ví dụ: `elearning-backend`).
    -   **Region**: Singapore (cho gần Việt Nam) hoặc mặc định.
    -   **Branch**: `main` (hoặc nhánh bạn đang code).
    -   **Root Directory**: `backend` (Rất quan trọng: vì code backend nằm trong thư mục này).
    -   **Runtime**: `Node`.
    -   **Build Command**: `npm install`.
    -   **Start Command**: `node server.js` (Lưu ý: không dùng `npm run dev` vì đó là mode development).

### 3. Cấu hình Environment Variables (Environment Tab)
Đây là bước quan trọng nhất. Bạn cần nhấn vào nút **"Add Environment Variable"** và điền đủ các biến sau:

| Key | Giá trị (Value) / Hướng dẫn lấy |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render thường tự quản lý, nhưng nên set để code nhận biết) |
| `MONGODB_URI` | Chuỗi kết nối MongoDB Atlas của bạn. <br>Ví dụ: `mongodb+srv://user:pass@cluster.mongodb.net/db_name` |
| `JWT_ACCESS_SECRET` | Tự nghĩ một chuỗi ngẫu nhiên dài và bảo mật. |
| `JWT_ACCESS_EXPIRY` | `3h` (hoặc tùy chỉnh) |
| `JWT_REFRESH_SECRET` | Tự nghĩ một chuỗi khác với Access Secret. |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `CLOUDINARY_NAME` | Lấy trong Dashboard Cloudinary. |
| `CLOUDINARY_API_KEY` | Lấy trong Dashboard Cloudinary. |
| `CLOUDINARY_API_SECRET` | Lấy trong Dashboard Cloudinary. |
| `SENDGRID_API_KEY` | Key từ SendGrid (nếu dùng tính năng gửi mail). |
| `FROM_EMAIL` | Email đã xác thực trên SendGrid. |
| `GOOGLE_CLIENT_ID` | Client ID từ Google Cloud Console (cho chức năng Login Google). |
| `ADMIN_ACC` | Username cho tài khoản admin khởi tạo (nếu code có seed). |
| `ADMIN_PASS` | Password cho tài khoản admin. |
| `FRONTEND_URL` | Tạm thời điền `*` (để cho phép mọi nơi gọi API) hoặc để trống. <br>**Lưu ý**: Sau khi deploy Frontend xong, bạn PHẢI quay lại đây sửa thành URL của Frontend (ví dụ: `https://elearning-fe.onrender.com`) để bảo mật CORS. |

5.  Nhấn **Create Web Service**.
6.  Chờ Render build và run. Khi thấy log báo "Server running on port..." là thành công.
7.  **Copy URL của Backend** (dạng `https://xyz.onrender.com`). Bạn sẽ cần nó cho phần Frontend.

---

## Phần 2: Deploy Frontend

### 1. Chuẩn bị trước khi deploy
Frontend của bạn dùng Vite. Khi build sẽ tạo ra thư mục `dist`.

### 2. Tạo Static Site trên Render
1.  Quay lại Dashboard, nhấn **New +** -> chọn **Static Site**.
2.  Kết nối với cùng repository GitHub đó.
3.  Điền thông tin:
    -   **Name**: Đặt tên (ví dụ: `elearning-frontend`).
    -   **Root Directory**: `frontend`.
    -   **Build Command**: `npm run build` (Render sẽ tự chạy `npm install` trước).
    -   **Publish Directory**: `dist` (Mặc định của Vite).

### 3. Cấu hình Environment Variables
Frontend cũng cần biến môi trường để biết gọi API tới đâu.

| Key | Giá trị (Value) |
| --- | --- |
| `VITE_API_BASE_URL` | Dán URL Backend bạn vừa có ở Phần 1.<br>Ví dụ: `https://elearning-backend.onrender.com/api` (Lưu ý code của bạn nối thêm `/api` hay không thì kiểm tra file `api.js`, thường là base url server).<br>*Kiểm tra code:* Code frontend mặc định dùng `import.meta.env.VITE_API_BASE_URL`. Nếu bạn không thêm `/api` vào biến này, hãy chắc chắn code nối thêm. Theo file `services/api.js` mặc định là `http://localhost:3000/api`, nên bạn hãy điền: `https://ten-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | Dán URL Backend (bỏ đuôi `/api`). Ví dụ: `https://elearning-backend.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Giống hệt bên Backend. |

4.  Nhấn **Create Static Site**.
5.  Render sẽ build và deploy. Sau khi xong, bạn sẽ có URL Frontend (ví dụ `https://elearning-frontend.onrender.com`).

---

## Phần 3: Cấu hình Sau Cùng (Quan trọng)

Sau khi cả 2 đã chạy:
1.  Quay lại **Backend Dashboard** trên Render.
2.  Vào mục **Environment**.
3.  Sửa biến `FRONTEND_URL` thành URL chính thức của Frontend (ví dụ: `https://elearning-frontend.onrender.com`).
4.  Lưu lại (Web Service sẽ tự restart).

### Các lỗi thường gặp
-   **Backend deploy failed (Build error)**: Kiểm tra lại `package.json` xem có thư viện nào bị thiếu trong `dependencies` không.
-   **Frontend không gọi được API (CORS Error)**: 
    -   Kiểm tra kỹ biến `FRONTEND_URL` bên Backend đã đúng URL Frontend chưa (không có dấu `/` ở cuối).
    -   Kiểm tra `VITE_API_BASE_URL` bên Frontend đã đúng chưa.
-   **Socket connection failed**: Kiểm tra `VITE_SOCKET_URL` phải là domain gốc của backend, không có `/api`.

Chúc bạn deploy thành công!
