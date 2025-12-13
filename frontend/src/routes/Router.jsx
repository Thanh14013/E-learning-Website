import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import HomePage from "../pages/homepage/Home.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import Courses from "../pages/courses/Course.jsx";
import CourseDetailPage from "../pages/courses/CourseDetail.jsx";
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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password/:token", element: <ResetPasswordPage /> },
      
      { path: "courses", element: <Courses /> },
      { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "courses/:courseId/lessons/:lessonId", element: <LessonPlayer /> },
      
      // 1. Danh sách thảo luận
      { path: "courses/:courseId/discussions", element: <DiscussionsPage /> },
      // 2. Chi tiết thảo luận
      { path: "discussions/:discussionId", element: <DiscussionDetailPage /> },      
      //quizz routes
      { path: "quiz-demo", element: <QuizDemo /> },
      { path: "quizzes", element: <QuizzList courseId="demo-course" /> },
      { path: "quiz/:quizId", element: <QuizDetail /> },
      { path: "quiz/:quizId/attempt/:attemptId", element: <QuizReview /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "profile", element: <Profile /> },
        ],
      },
    ],
  },
]);

export default router;