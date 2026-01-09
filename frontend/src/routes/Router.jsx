import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import RoleBlocker from "../components/RoleBlocker.jsx";
import HomePage from "../pages/homepage/Home.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import CompleteTeacherProfile from "../pages/auth/CompleteTeacherProfile.jsx";
import TeacherApprovalPending from "../pages/auth/TeacherApprovalPending.jsx";
import Courses from "../pages/courses/Course.jsx";
import CourseDetailPage from "../pages/courses/CourseDetail.jsx";
import CreateCourse from "../pages/courses/CreateCourse.jsx";
import Dashboard from "../pages/dashboard/DashboardOverview.jsx";
import QuizDemo from "../pages/quizz/QuizDemo.jsx";
import QuizReview from "../pages/quizz/QuizReview.jsx";
import QuizzList from "../components/quizz/QuizzList.jsx";
import QuizDetail from "../components/quizz/QuizDetail.jsx";
import ProtectedRoute from "../components/ProtectedRoutes.jsx";
import LessonPlayer from "../pages/lesson/LessonPlayer.jsx";
import LessonDetail from "../pages/lesson/LessonDetail.jsx";
import DiscussionDetailPage from "../pages/courses/DiscussionDetailPage.jsx";
import QuizBuilder from "../components/quiz/QuizBuilder.jsx";
import CourseManagement from "../pages/courses/CourseManagement.jsx";
import CourseEditor from "../pages/courses/CourseEditor.jsx";
import StudentAnalytics from "../pages/teacher/StudentAnalytics.jsx";
import SessionScheduler from "../pages/teacher/SessionScheduler.jsx";
import CourseAnalytics from "../pages/teacher/CourseAnalytics.jsx";
import TeacherDashboard from "../pages/dashboard/Views/Teacher/TeacherView.jsx";
import VideoRoom from "../components/video-call/VideoRoom.jsx";
import UserManagement from "../pages/admin/UserManagement.jsx";
import ContentModeration from "../pages/admin/ContentModeration.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import SystemSettings from "../pages/admin/SystemSettings.jsx";
import AdminCourseDetail from "../pages/admin/AdminCourseDetail.jsx";
import AdminAnalytics from "../pages/admin/AdminAnalytics.jsx";
import CourseApproval from "../pages/admin/CourseApproval.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import AdminRoute from "../components/AdminRoute.jsx";
import TeacherRoute from "../components/TeacherRoute.jsx";
import AdminLogin from "../pages/admin/AdminLogin.jsx";
import ApiDocs from "../pages/ApiDocs.jsx";
import Profile from "../pages/profile/Profile.jsx";
import StudentRoute from "../components/StudentRoute.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RoleBlocker>
        <Layout />
      </RoleBlocker>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "admin/login", element: <AdminLogin /> },

      { path: "teacher/complete-profile", element: <CompleteTeacherProfile /> },
      { path: "teacher/approval-pending", element: <TeacherApprovalPending /> },
      { path: "api-docs", element: <ApiDocs /> },

      { path: "courses", element: <Courses /> },
      { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "courses/:courseId/lessons/:lessonId", element: <LessonDetail /> },

      // Discussions
      { path: "discussions/:discussionId", element: <DiscussionDetailPage /> },

      // Quiz routes
      { path: "quiz-demo", element: <QuizDemo /> },
      { path: "quizzes", element: <QuizzList courseId="demo-course" /> },
      { path: "quiz/:quizId", element: <QuizDetail /> },
      { path: "quiz/:quizId/attempt/:attemptId", element: <QuizReview /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "profile", element: <Profile /> },
          // Live Video Session (Shared)
          { path: "session/:sessionId", element: <VideoRoom /> },
        ],
      },

      // Student Only Routes
      {
        element: <StudentRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
        ]
      },
    ],
  },

  // Teacher routes grouped under /teacher
  {
    path: "/teacher",
    element: (
      <TeacherRoute>
        <Layout />
      </TeacherRoute>
    ),
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: "dashboard", element: <TeacherDashboard /> },
      { path: "courses", element: <CourseManagement /> },
      { path: "courses/create", element: <CreateCourse /> },
      { path: "courses/:courseId/edit", element: <CourseEditor /> },
      { path: "courses/:courseId/analytics", element: <CourseAnalytics /> },
      {
        path: "courses/:courseId/students/:studentId/analytics",
        element: <StudentAnalytics />,
      },
      { path: "quiz-builder", element: <QuizBuilder /> },
      { path: "quiz-builder/:quizId", element: <QuizBuilder /> },
      { path: "sessions", element: <SessionScheduler /> },
      { path: "sessions/:sessionId", element: <VideoRoom /> },
    ],
  },

  // Admin Routes with AdminLayout
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "moderation", element: <ContentModeration /> },
      { path: "courses", element: <CourseApproval /> },
      { path: "courses/:id", element: <AdminCourseDetail /> },
      { path: "analytics", element: <AdminAnalytics /> },
      { path: "settings", element: <SystemSettings /> },
    ],
  },
]);

export default router;