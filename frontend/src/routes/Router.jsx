import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import HomePage from "../pages/homepage/Home.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import Courses from "../pages/courses/Course.jsx";
// import Discussion from "../pages/discussion/Discussion.jsx";
// import NotFound from "../pages/notFound/NotFound.jsx";
import CourseDetailPage from "../pages/courses/CourseDetail.jsx";
import CreateCourse from "../pages/courses/CreateCourse.jsx";
import Dashboard from "../pages/dashboard/DashboardOverview.jsx";
import Profile from "../pages/profile/Profile.jsx";
import QuizDemo from "../pages/quizz/QuizDemo.jsx";
import QuizReview from "../pages/quizz/QuizReview.jsx";
import QuizzList from "../components/quizz/QuizzList.jsx";
import QuizDetail from "../components/quizz/QuizDetail.jsx";
import ProtectedRoute from "../components/ProtectedRoutes.jsx";
import LessonPlayer from "../pages/lesson/LessonPlayer.jsx";
import NotificationSettings from "../pages/settings/NotificationSettings.jsx";
import CourseManagement from "../pages/courses/CourseManagement.jsx";
import CourseEditor from "../pages/courses/CourseEditor.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    // errorElement: <NotFound />,

    children: [
      // Public routes
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password/:token", element: <ResetPasswordPage /> },
      // Course & Lesson routes
      { path: "courses", element: <Courses /> },
      // { path: "courses/:courseId", element: <CourseDetailPage /> },
      { path: "courses/:courseId/lessons/:lessonId", element: <LessonPlayer /> },

      // Quiz routes
      { path: "quiz-demo", element: <QuizDemo /> },
      { path: "quizzes", element: <QuizzList courseId="demo-course" /> },
      { path: "quiz/:quizId", element: <QuizDetail /> },
      { path: "quiz/:quizId/attempt/:attemptId", element: <QuizReview /> },

      // Discussion routes
      // { path: "discussion", element: <Discussion /> },

      // Protected routes (require authentication)
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "profile", element: <Profile /> },
          { path: "settings/notifications", element: <NotificationSettings /> },
          { path: "teacher/courses", element: <CourseManagement /> },
          { path: "courses/create", element: <CreateCourse /> },
          { path: "courses/:courseId/edit", element: <CourseEditor /> },
        ],
      },
    ],
  },
]);

export default router;
