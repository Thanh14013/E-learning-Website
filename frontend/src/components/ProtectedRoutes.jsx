import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();

  const accessToken = localStorage.getItem("accessToken");

  if (!user || !accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role === 'teacher' && user.profileApprovalStatus === 'pending') {
    return <Navigate to="/teacher/approval-pending" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;