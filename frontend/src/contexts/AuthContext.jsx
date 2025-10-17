import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; // import axios instance sau này sẽ dùng

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
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    try {
      // const res = await api.post("/auth/login", { email, password });
      // const { user, token } = res.data;

      // Mock login tạm
      const userData = { name: "Student", email };
      const fakeToken = "mockToken123";

      setUser(userData);
      setToken(fakeToken);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", fakeToken);

      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    }
  };

  // Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  // Không render khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
