import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const accessToken = localStorage.getItem("accessToken");

    if (!user || !accessToken) {
        return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }

    if (user.role !== "admin") {
        return <Navigate to="/login" replace />;
    }

    return children ? children : <Outlet />;
};

export default AdminRoute;
