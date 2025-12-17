import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import toastService from "../services/toastService";
import { handleApiError } from "../utils/errorHandler";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [loading, setLoading] = useState(true);

  // Kiểm tra login khi load lại trang
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = localStorage.getItem("accessToken");

    if (storedUser && storedAccessToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedAccessToken);
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
      }
    }
    setLoading(false);
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { user, tokens } = res.data;

      const userData = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
        profileApprovalStatus: user.profileApprovalStatus,
        profile: user.profile
      };

      setUser(userData);
      setToken(tokens.accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accessToken", tokens.accessToken);

      toastService.success(`Chào mừng ${userData.fullName}!`);
      return { success: true, user: userData };
    } catch (err) {
      const parsedError = handleApiError(err, "Login");

      // Show specific error toast based on status code
      if (parsedError.statusCode === 401) {
        toastService.error("Email hoặc mật khẩu không đúng!");
      } else if (parsedError.statusCode === 404) {
        toastService.error("Tài khoản không tồn tại!");
      } else if (parsedError.type !== 'NETWORK') {
        toastService.error(parsedError.message || "Đăng nhập thất bại!");
      }

      return { success: false, message: parsedError.message };
    }
  };

  // Đăng ký
  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);

      // Return response to caller (no auto-login)
      return { success: true, data: res.data };
    } catch (err) {
      const parsedError = handleApiError(err, "Register");

      // Return structured error for the UI to display (do not show generic toasts here)
      return {
        success: false,
        message: parsedError.message,
        validationErrors: parsedError.validationErrors || err.response?.data?.errors || null,
        statusCode: parsedError.statusCode || null,
      };
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      toastService.info("Đã đăng xuất thành công");
    }
  };
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    setUser, // Add setUser to context value
  };

  // Không render khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <p>Đang kiểm tra đăng nhập...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
