import { useState } from 'react';
import { useAuth } from "../../contexts/AuthContext";
import StudentView from "./Views/Student/StudentView";
import TeacherView from "./Views/Teacher/TeacherView";
import AdminView from "./Views/Admin/AdminView";
import styles from "./dashboard.module.css";

// --- COMPONENT SIDEBAR TRÁI (NÂNG CẤP VỚI LOGIC THU GỌN) ---
const NavigationSidebar = () => {
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
          <li><a href="#" className={styles.navLinkActive}>Dashboard</a></li>
          <li><a href="#" className={styles.navLink}>Site home</a></li>
          <li>
            <div className={styles.navLink} onClick={toggleCourses}>
              <span>My courses</span>
              <svg className={`${styles.navIcon} ${isCoursesExpanded ? styles.expanded : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
            </div>
            <ul className={`${styles.courseSublist} ${isCoursesExpanded ? styles.expanded : ''}`}>
              <li><a href="#">› Kỹ năng mềm</a></li>
              <li><a href="#">› Tâm lý học ứng dụng</a></li>
              <li><a href="#">› Quản trị học đại cương</a></li>
              <li><a href="#">› Cơ sở dữ liệu</a></li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
};


// --- COMPONENT SIDEBAR PHẢI ---
const CalendarSidebar = ({ user }) => (
  <>
    <div className={styles.block}>
      <h3>October 2025</h3>
      <div className={styles.calendarGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayInitial, index) => (
          <span key={`${dayInitial}-${index}`} className={styles.dayHeader}>
            {dayInitial}
          </span>
        ))}
        <span></span><span></span><span></span>
        {[...Array(31).keys()].map(i => {
          const day = i + 1;
          let className = styles.day;
          if (day === 22) className += ` ${styles.today}`;
          if (day === 26) className += ` ${styles.eventDue}`;
          return <span key={day} className={className}>{day}</span>;
        })}
      </div>
    </div>
    <div className={styles.block}>
      <h3>Upcoming events</h3>
      <div className={styles.eventItem}>
        <a href="#">Bài tập lý thuyết chương 2 is due</a>
        <p>Sunday, 26 October, 11:59 PM</p>
      </div>
      {user.role === 'teacher' && (
        <button className={styles.addEventButton}>+ Add new event</button>
      )}
    </div>
  </>
);


export default function Dashboard() {
  const { user } = useAuth();
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
      <aside className={styles.navSidebar}><NavigationSidebar /></aside>

      <main className={styles.mainContent}>
        <h1 className={styles.mainTitle}>Dashboard</h1>
        <p className={styles.mainSubtitle}>Welcome back, {user.fullName}!</p>
        <RoleView user={user} />
      </main>

      <aside className={styles.calendarSidebar}><CalendarSidebar user={user} /></aside>
    </div>
  );
}