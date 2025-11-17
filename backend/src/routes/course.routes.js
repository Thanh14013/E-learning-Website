import express from "express";
import upload from "../middleware/upload.js";
import {
  validateCourseCreation,
  validateCourseUpdate,
  validateObjectId,
  validatePagination,
  validateSearch,
} from "../middleware/validator.js";
import {
  createCourse,
  uploadCourseThumbnail,
  getAllCourses,
  getCourseDetail,
  updateCourse,
  togglePublishCourse,
  deleteCourse,
} from "../controllers/course.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.js";
import { isTeacherOrAdmin } from "../middleware/authorize.js";

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

// GET /api/courses/:id  → Public detail (with optional auth)
router.get("/:id", validateObjectId, optionalAuthenticate, getCourseDetail);

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

export default router;
