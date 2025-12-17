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
      toastService.error("Session expired. Please log in again.");

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
      // Log full server response body in dev for easier debugging
      if (import.meta.env.DEV) {
        console.debug("Server error response:", error.response?.data);
      }
      // Do not show generic server toast here — let UI components decide how to surface errors
    }

    // Handle network errors
    if (!error.response) {
      // Log network errors in dev, avoid spamming toasts globally
      if (import.meta.env.DEV) {
        console.debug("Network error:", error);
      }
    }

    // Return the parsed error for component-level handling
    return Promise.reject(parsedError);
  }
);

export default api;
