import express from 'express';
import { authorize } from '../middleware/authorize.js';
import * as courseController from '../controllers/course.controller.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import * as sessionController from '../controllers/session.controller.js';
import * as chapterController from '../controllers/chapter.controller.js';
import * as lessonController from '../controllers/lesson.controller.js';
import * as quizController from '../controllers/quiz.controller.js';
import * as questionController from '../controllers/question.controller.js';

import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Apply teacher authorization to all routes in this router
router.use(authenticate);
router.use(authorize('teacher', 'admin'));

// ==========================================
// Dashboard & Analytics
// ==========================================
router.get('/dashboard', analyticsController.getDashboardAnalytics);
router.get('/analytics/course/:courseId', analyticsController.getCourseAnalytics);
router.get('/analytics/student/:userId', analyticsController.getStudentAnalytics);
router.get('/analytics/export', analyticsController.exportCourseAnalytics);
router.get('/analytics/student-report/:userId', analyticsController.generateStudentReport);

// ==========================================
// Course Management
// ==========================================
router.get('/courses', courseController.getMyCourses); // List courses created by teacher
router.post('/courses', courseController.createCourse);
router.get('/courses/:id', courseController.getTeacherCourseById);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);
router.put('/courses/:id/publish', courseController.togglePublishCourse);
router.put('/courses/:id/submit', courseController.submitCourse);
router.post('/courses/:id/thumbnail', upload.single('thumbnail'), courseController.uploadCourseThumbnail);
router.get('/courses/:id/students', courseController.getCourseStudents);

// ==========================================
// Chapter Management
// ==========================================
router.post('/chapters', chapterController.createChapter);
router.put('/chapters/reorder', chapterController.reorderChapters); // Specific route before :id
router.put('/chapters/:id', chapterController.updateChapter);
router.delete('/chapters/:id', chapterController.deleteChapter);

// ==========================================
// Lesson Management
// ==========================================
router.post('/lessons', lessonController.createLesson);
router.put('/lessons/:id', lessonController.updateLesson);
router.delete('/lessons/:id', lessonController.deleteLesson);
router.post('/lessons/:id/video', lessonController.uploadLessonVideo);
router.post('/lessons/:id/resource', lessonController.uploadLessonResource);
router.delete('/lessons/:id/resource/:resId', lessonController.deleteLessonResource);

// ==========================================
// Quiz Management
// ==========================================
router.post('/quizzes', quizController.createQuiz);
router.get('/quizzes/course/:courseId', quizController.getQuizzesByCourse);
router.get('/quizzes/:id', quizController.getQuizDetail);
router.put('/quizzes/:id', quizController.updateQuiz);
router.delete('/quizzes/:id', quizController.deleteQuiz);
router.put('/quizzes/:id/publish', quizController.togglePublishQuiz);

// Questions (usually nested in quiz builder)
router.post('/questions/quiz/:quizId', questionController.createQuestion);
router.put('/questions/:id', questionController.updateQuestion);
router.delete('/questions/:id', questionController.deleteQuestion);

// ==========================================
// Session Management (Live Classes)
// ==========================================
router.get('/sessions', sessionController.getMySessions);
router.post('/sessions', sessionController.createSession);
router.put('/sessions/:id', sessionController.updateSession);
router.delete('/sessions/:id', sessionController.deleteSession);
router.put('/sessions/:id/start', sessionController.startSession);
router.put('/sessions/:id/end', sessionController.endSession);

export default router;
