import express from "express";
import { authenticate } from "../middleware/auth.js";
import { isAdmin } from "../middleware/authorize.js";
import {
  getUserList,
  updateUserRole,
  banUser,
  deleteUser,
  updateTeacherApprovalStatus,
} from "../controllers/user.controller.js";
import {
  getAdminCourses,
  approveCourse,
  rejectCourse,
} from "../controllers/course.controller.js";
import {
  getReports,
  approveReport,
  rejectReport,
} from "../controllers/report.controller.js";
import { getDashboardAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

// User management
router.get("/users", getUserList);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/ban", banUser);
router.put("/users/teachers/:id/approval", updateTeacherApprovalStatus);
router.delete("/users/:id", deleteUser);

// Course approval
router.get("/courses", getAdminCourses);
router.put("/courses/:id/approve", approveCourse);
router.put("/courses/:id/reject", rejectCourse);

// Content moderation
router.get("/reports", getReports);
router.put("/reports/:id/approve", approveReport);
router.put("/reports/:id/reject", rejectReport);

// Analytics
router.get("/analytics/dashboard", getDashboardAnalytics);

export default router;
