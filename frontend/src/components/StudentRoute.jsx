import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StudentRoute = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const accessToken = localStorage.getItem("accessToken");

    if (!user || !accessToken) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Strictly allow only students
    if (user.role !== 'student') {
        // Redirect authorized but wrong-role users to their respective dashboards
        if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};

export default StudentRoute;
