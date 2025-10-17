import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (!user) {
    // Chuyển hướng người dùng đến trang /login nếu họ chưa đăng nhập
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Nếu người dùng đã đăng nhập, cho phép hiển thị các trang con (Dashboard, Profile)
  return <Outlet />;
};

export default ProtectedRoute;