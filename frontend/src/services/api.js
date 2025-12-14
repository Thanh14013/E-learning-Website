import axios from "axios";
import { handleApiError, isAuthenticationError } from "../utils/errorHandler";
import toastService from "./toastService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("Request Error:", error);
    }
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle errors centrally
api.interceptors.response.use(
  (response) => {
    // Return successful response
    return response;
  },
  (error) => {
    // Parse the error using centralized error handler
    const parsedError = handleApiError(error, error.config?.url);

    // Handle authentication errors (401)
    if (isAuthenticationError(error)) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Show toast notification
      toastService.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);

      return Promise.reject(parsedError);
    }

    // Handle authorization errors (403)
    if (error.response?.status === 403) {
      toastService.error(parsedError.message);
    }

    // Handle not found errors (404)
    if (error.response?.status === 404) {
      toastService.error(parsedError.message);
    }

    // Handle server errors (500+)
    if (error.response?.status >= 500) {
      toastService.error("Lỗi máy chủ. Vui lòng thử lại sau.");
    }

    // Handle network errors
    if (!error.response) {
      toastService.error(parsedError.message);
    }

    // Return the parsed error for component-level handling
    return Promise.reject(parsedError);
  }
);

// if (import.meta.env.VITE_USE_MOCK === "true") {
//   api.post = async (url, data) => {
//     if (url === "/auth/login") {
//       if (data.email === "test@gmail.com" && data.password === "123456") {
//         return {
//           data: {
//             token: "fake-jwt-token",
//             user: { id: 1, name: "Mock User", email: data.email },
//           },
//         };
//       }
//       throw { response: { status: 401, data: { message: "Sai thông tin" } } };
//     }
//     return { data: {} };
//   };
// }

export default api;
