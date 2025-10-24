import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout.jsx";
import HomePage from "../pages/homepage/Home.jsx";
import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
// import Courses from "../pages/courses/Courses.jsx";
// import Discussion from "../pages/discussion/Discussion.jsx";
// import NotFound from "../pages/notFound/NotFound.jsx";
// import Dashboard from "../pages/dashboard/Dashboard.jsx";
import Profile from "../pages/profile/Profile.jsx";
// import QuizDemo from "../pages/QuizDemo.jsx";
// import QuizzList from "../components/quizz/QuizzList.jsx";
import QuizDetail from "../components/quizz/QuizDetail.jsx";
import ProtectedRoute from "../components/ProtectedRoutes.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    // errorElement: <NotFound />,

    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      // { path: "courses", element: <Courses /> },
      // { path: "discussion", element: <Discussion /> },
      // { path: "quiz-demo", element: <QuizDemo /> },
      // { path: "quizzes", element: <QuizzList courseId="demo-course" /> },
      { path: "quiz/:quizId", element: <QuizDetail /> },
      {
        element: <ProtectedRoute />,
        children: [
          // { path: "dashboard", element: <Dashboard /> },
          { path: "profile", element: <Profile /> },
        ],   
      },   
    ],
  },
]);

export default router;
