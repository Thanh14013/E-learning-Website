import express from "express";
import upload from "../middleware/upload.js";
import {
  validateCourseCreation,
  validateCourseUpdate,
  validateObjectId,
  validatePagination,
  validateSearch,
  validateReview,
} from "../middleware/validator.js";
import {
  createCourse,
  uploadCourseThumbnail,
  getAllCourses,
  getCourseDetail,
  updateCourse,
  togglePublishCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  getEnrolledCourses,
  getMyCourses,
  getCourseStudents,
  reviewCourse,
} from "../controllers/course.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { isTeacherOrAdmin, isStudent } from "../middleware/authorize.js";

const router = express.Router();

// POST /api/courses  → Create Course (Teacher/Admin)
router.post(
  "/",
  authenticate,
  isTeacherOrAdmin,
  validateCourseCreation,
  createCourse
);

// POST /api/courses/:id/thumbnail  → Upload Thumbnail (Teacher/Admin)
router.post(
  "/:id/thumbnail",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  upload.single("thumbnail"),
  uploadCourseThumbnail
);

// GET /api/courses  → Public list with filters/pagination
router.get("/", validatePagination, validateSearch, getAllCourses);

// GET /api/courses/enrolled  → Get enrolled courses for current user (Student)
router.get("/enrolled", authenticate, getEnrolledCourses);

// GET /api/courses/my-courses  → Get courses created by current teacher
router.get("/my-courses", authenticate, isTeacherOrAdmin, getMyCourses);

// GET /api/courses/:id  → Public detail (with optional auth)
router.get("/:id", validateObjectId, optionalAuthenticate, getCourseDetail);

// GET /api/courses/:id/students  → Get enrolled students (Teacher/Admin)
router.get(
  "/:id/students",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  getCourseStudents
);

// PUT /api/courses/:id  → Update course
router.put(
  "/:id",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  validateCourseUpdate,
  updateCourse
);

// PUT /api/courses/:id/publish  → Publish/Unpublish a course
router.put(
  "/:id/publish",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  togglePublishCourse
);

// DELETE /api/courses/:id  → Delete course
router.delete(
  "/:id",
  authenticate,
  isTeacherOrAdmin,
  validateObjectId,
  deleteCourse
);

// POST /api/courses/:id/enroll  → Enroll in a course (Student)
router.post("/:id/enroll", authenticate, validateObjectId, enrollCourse);

// DELETE /api/courses/:id/unenroll  → Unenroll from a course (Student)
router.delete("/:id/unenroll", authenticate, validateObjectId, unenrollCourse);

// POST /api/courses/:id/review -> Review course (Student)
router.post(
  "/:id/review",
  authenticate,
  isStudent,
  validateObjectId,
  validateReview,
  reviewCourse
);

export default router;
