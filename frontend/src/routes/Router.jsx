import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import HomePage from "../pages/homepage/Home.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import EmailVerificationRequired from "../pages/auth/EmailVerificationRequired.jsx";
import CompleteTeacherProfile from "../pages/auth/CompleteTeacherProfile.jsx";
import TeacherApprovalPending from "../pages/auth/TeacherApprovalPending.jsx";
import Courses from "../pages/courses/Course.jsx";
import CourseDetailPage from "../pages/courses/CourseDetail.jsx";
import CreateCourse from "../pages/courses/CreateCourse.jsx";
import Dashboard from "../pages/dashboard/DashboardOverview.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPassword.jsx";
import ResetPasswordPage from "../pages/auth/ResetPassword.jsx";
import Profile from "../pages/profile/Profile.jsx";
import QuizDemo from "../pages/quizz/QuizDemo.jsx";
import QuizReview from "../pages/quizz/QuizReview.jsx";
import QuizzList from "../components/quizz/QuizzList.jsx";
import QuizDetail from "../components/quizz/QuizDetail.jsx";
import ProtectedRoute from "../components/ProtectedRoutes.jsx";
import LessonPlayer from "../pages/lesson/LessonPlayer.jsx";
import DiscussionsPage from "../pages/courses/DiscussionPage.jsx";
import DiscussionDetailPage from "../pages/courses/DiscussionDetailPage.jsx";
import QuizBuilder from "../components/quiz/QuizBuilder.jsx";
import StudentAnalytics from "../pages/teacher/StudentAnalytics.jsx";
import SessionScheduler from "../pages/teacher/SessionScheduler.jsx";
import VideoRoom from "../components/video-call/VideoRoom.jsx";
import NotificationSettings from "../pages/settings/NotificationSettings.jsx";
import UserManagement from "../pages/admin/UserManagement.jsx";
import ContentModeration from "../pages/admin/ContentModeration.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import SystemSettings from "../pages/admin/SystemSettings.jsx";
import CourseApproval from "../pages/admin/CourseApproval.jsx";
import NotificationPreferences from "../pages/settings/NotificationPreferences.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import ApiDocs from "../pages/ApiDocs.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "email-verification-required", element: <EmailVerificationRequired /> },
      { path: "teacher/complete-profile", element: <CompleteTeacherProfile /> },
      { path: "teacher/approval-pending", element: <TeacherApprovalPending /> },
      { path: "api-docs", element: <ApiDocs /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password/:token", element: <ResetPasswordPage /> },

      { path: "courses", element: <Courses /> },
      { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "courses/:courseId/lessons/:lessonId", element: <LessonPlayer /> },

      // Discussions
      { path: "courses/:courseId/discussions", element: <DiscussionsPage /> },
      { path: "discussions/:discussionId", element: <DiscussionDetailPage /> },

      // Quiz routes
      { path: "quiz-demo", element: <QuizDemo /> },
      { path: "quizzes", element: <QuizzList courseId="demo-course" /> },
      { path: "quiz/:quizId", element: <QuizDetail /> },
      { path: "quiz/:quizId/attempt/:attemptId", element: <QuizReview /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "profile", element: <Profile /> },
          { path: "courses/create", element: <CreateCourse /> },

          // Settings
          { path: "settings/notifications", element: <NotificationSettings /> },
          { path: "settings/notification-preferences", element: <NotificationPreferences /> },

          // Live Video Session
          { path: "session/:sessionId", element: <VideoRoom /> },

          // Teacher routes
          { path: "teacher/quiz-builder", element: <QuizBuilder /> },
          { path: "teacher/quiz-builder/:quizId", element: <QuizBuilder /> },
          { path: "teacher/students/:studentId/analytics", element: <StudentAnalytics /> },
          { path: "teacher/sessions", element: <SessionScheduler /> },
        ],
      },
    ],
  },

  // Admin Routes with AdminLayout
  {
    path: "/admin",
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <UserManagement /> },
      { path: "moderation", element: <ContentModeration /> },
      { path: "courses/approval", element: <CourseApproval /> },
      { path: "settings", element: <SystemSettings /> },
    ],
  },
]);

export default router;