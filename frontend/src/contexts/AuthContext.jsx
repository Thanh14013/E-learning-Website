import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import toastService from "../services/toastService";
import { handleApiError } from "../utils/errorHandler";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Kiểm tra login khi load lại trang
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      // Uncomment when backend is ready
      // const res = await api.post("/auth/login", { email, password });
      // const { user, token } = res.data;

      // Mock login tạm - Remove this when backend is ready
      const userData = {
        name: "Student",
        email,
        role: "student",
        id: "mock-user-id"
      };
      const fakeToken = "mockToken123";

      setUser(userData);
      setToken(fakeToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", fakeToken);

      toastService.success(`Chào mừng ${userData.name}!`);
      return true;
    } catch (err) {
      // Error is already handled by api interceptor
      // But we can add additional component-specific handling here
      const parsedError = handleApiError(err, "Login");

      // Show error toast if not already shown by interceptor
      if (parsedError.type !== 'NETWORK' && parsedError.statusCode !== 401) {
        toastService.error(parsedError.message);
      }

      return false;
    }
  };

  // Đăng ký
  const register = async (userData) => {
    try {
      // Uncomment when backend is ready
      // const res = await api.post("/auth/register", userData);
      // const { user, token } = res.data;

      // Mock register - Remove this when backend is ready
      const newUser = {
        name: userData.name,
        email: userData.email,
        role: "student",
        id: "mock-user-id",
      };
      const fakeToken = "mockToken123";

      setUser(newUser);
      setToken(fakeToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("token", fakeToken);

      toastService.success("Đăng ký thành công!");
      return true;
    } catch (err) {
      const parsedError = handleApiError(err, "Register");

      // Show error toast if not already shown
      if (parsedError.type !== 'NETWORK') {
        toastService.error(parsedError.message);
      }

      return false;
    }
  };

  // Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toastService.info("Đã đăng xuất thành công");
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
