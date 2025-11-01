import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext.jsx';
import api from '../services/api.js';

const CourseContext = createContext(null);

export const CourseProvider = ({ children }) => {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log("CONTEXT: Bắt đầu fetch dữ liệu...");

      try {
        // Luôn luôn fetch tất cả các khóa học bằng `api` instance
        const allCoursesRes = await api.get('/courses');
        console.log("CONTEXT: Response từ /api/courses:", allCoursesRes);
        setAllCourses(allCoursesRes.data || []); // Dữ liệu nằm trong res.data

        // Nếu người dùng đã đăng nhập, fetch thêm các khóa học của họ
        if (user) {
          console.log("CONTEXT: User đã đăng nhập, fetching my-courses...");
          const myCoursesEndpoint = user.role === 'student' 
            ? '/courses/my-courses' 
            : '/courses/my-teaching-courses';
          const myCoursesRes = await api.get(myCoursesEndpoint);
          console.log("CONTEXT: Response từ my-courses:", myCoursesRes);
          setMyCourses(myCoursesRes.data || []);
        } else {
          // Nếu không đăng nhập, đảm bảo myCourses là mảng rỗng
          setMyCourses([]);
          console.log("CONTEXT: User là khách, myCourses được set thành mảng rỗng.");
        }
      } catch (error) {
        console.error('CONTEXT: Lỗi trong quá trình fetch dữ liệu:', error);
        // Trong trường hợp lỗi, reset state về mảng rỗng để tránh crash UI
        setAllCourses([]);
        setMyCourses([]);
      } finally {
        setLoading(false);
        console.log("CONTEXT: Fetch dữ liệu hoàn tất.");
      }
    };

    fetchData();
  }, [user]); // useEffect chỉ cần chạy lại khi user thay đổi

  const addCourse = async (courseData) => {};
  const enrollCourse = async (courseId) => {};

  const value = { allCourses, myCourses, loading, addCourse, enrollCourse };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = () => {
    const context = useContext(CourseContext);
    if (context === null) {
        throw new Error('useCourses() must be used within a CourseProvider');
    }
    return context;
};