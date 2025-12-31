import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Prevent admin/teacher from accessing public root pages
const RoleBlocker = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();

    const isPrivileged = user && (user.role === "admin" || user.role === "teacher");
    const isAuthPath =
        location.pathname.startsWith("/login") ||
        location.pathname.startsWith("/admin/login") ||
        location.pathname.startsWith("/teacher/complete-profile") ||
        location.pathname.startsWith("/teacher/complete-profile") ||
        location.pathname.startsWith("/teacher/approval-pending");

    const isSharedPath =
        location.pathname.startsWith("/profile") ||
        location.pathname.startsWith("/settings");

    if (isPrivileged && !isAuthPath && !isSharedPath) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children ? children : <Outlet />;
};

export default RoleBlocker;
