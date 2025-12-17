import { useState } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import { useCourses } from "../../contexts/CoursesContext";
import StudentView from "./Views/Student/StudentView";
import TeacherView from "./Views/Teacher/TeacherView";
import AdminView from "./Views/Admin/AdminView";
import styles from "./dashboard.module.css";

// --- COMPONENT SIDEBAR TRÁI (NÂNG CẤP VỚI LOGIC THU GỌN) ---
const NavigationSidebar = ({ enrolledCourses = [] }) => {
  // State để quản lý trạng thái mở/đóng của "My courses"
  const [isCoursesExpanded, setIsCoursesExpanded] = useState(true);

  const toggleCourses = () => {
    setIsCoursesExpanded(prevState => !prevState);
  };

  return (
    <div className={styles.block}>
      <h3>Navigation</h3>
      <nav>
        <ul className={styles.navList}>
          <li><a href="/dashboard" className={styles.navLinkActive}>Dashboard</a></li>
          <li><a href="/" className={styles.navLink}>Site home</a></li>
          <li>
            <div className={styles.navLink} onClick={toggleCourses} style={{ cursor: 'pointer' }}>
              <span>My courses</span>
              <svg className={`${styles.navIcon} ${isCoursesExpanded ? styles.expanded : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </div>
            <ul className={`${styles.courseSublist} ${isCoursesExpanded ? styles.expanded : ''}`}>
              {enrolledCourses.length === 0 ? (
                <li className={styles.emptyMessage}>No courses enrolled yet</li>
              ) : (
                enrolledCourses.map(course => (
                  <li key={course._id}>
                    <a href={`/courses/${course._id}`} className={styles.courseLink}>
                      {course.title}
                    </a>
                  </li>
                ))
              )}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
};


// --- COMPONENT SIDEBAR PHẢI ---
const CalendarSidebar = ({ user }) => {
  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear();
  const today = now.getDate();

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDay = new Date(currentYear, now.getMonth(), 1).getDay();

  // Get total days in current month
  const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();

  return (
    <>
      <div className={styles.block}>
        <h3>{currentMonth} {currentYear}</h3>
        <div className={styles.calendarGrid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayInitial, index) => (
            <span key={`${dayInitial}-${index}`} className={styles.dayHeader}>
              {dayInitial}
            </span>
          ))}
          {/* Empty cells for days before month starts */}
          {[...Array(firstDay).keys()].map(i => (
            <span key={`empty-${i}`}></span>
          ))}
          {/* Actual days of the month */}
          {[...Array(daysInMonth).keys()].map(i => {
            const day = i + 1;
            let className = styles.day;
            if (day === today) className += ` ${styles.today}`;
            return <span key={day} className={className}>{day}</span>;
          })}
        </div>
      </div>
    </>
  );
};


export default function Dashboard() {
  const { user } = useAuth();
  const { myCourses } = useCourses();

  if (!user) return <p>Loading...</p>;

  const RoleView = {
    student: StudentView,
    teacher: TeacherView,
    admin: AdminView,
  }[user.role] || (() => <p>Unknown role</p>);

  if (user.role === 'admin') {
    return <AdminView user={user} />;
  }

  return (
    <div className={styles.dashboardLayout}>
      <aside className={styles.navSidebar}><NavigationSidebar enrolledCourses={myCourses} /></aside>

      <main className={styles.mainContent}>
        <h1 className={styles.mainTitle}>Dashboard</h1>
        <p className={styles.mainSubtitle}>Welcome back, {user.fullName}!</p>
        <RoleView user={user} />
      </main>

      <aside className={styles.calendarSidebar}><CalendarSidebar user={user} /></aside>
    </div>
  );
}