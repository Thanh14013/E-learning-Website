import { useState, useEffect } from 'react';
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
          <li><a href="/dashboard" className={`${styles.navLink} ${styles.navLinkActive}`}> <span>Dashboard</span></a></li>
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
  const [sessions, setSessions] = useState([]);
  const [sessionsByDate, setSessionsByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const now = new Date();
  const currentMonth = now.toLocaleString('en-US', { month: 'long' });
  const currentYear = now.getFullYear();
  const today = now.getDate();

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDay = new Date(currentYear, now.getMonth(), 1).getDay();

  // Get total days in current month
  const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();

  // Fetch sessions for students
  useEffect(() => {
    const fetchSessions = async () => {
      if (user.role === 'student') {
        try {
          const startOfMonth = new Date(currentYear, now.getMonth(), 1);
          const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0);

          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
          const response = await fetch('/api/sessions/my-enrolled-sessions?' + new URLSearchParams({
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString()
          }), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await response.json();
              setSessions(data.data || []);
              setSessionsByDate(data.sessionsByDate || {});
            } else {
              const text = await response.text();
              console.error('Expected JSON but got:', text.slice(0, 300));
            }
          } else {
            const text = await response.text();
            console.error('Failed to fetch sessions:', response.status, text);
          }
        } catch (error) {
          console.error('Failed to fetch sessions:', error);
        }
      }
    };

    fetchSessions();
  }, [user.role, currentYear, now.getMonth()]);

  // Fetch dashboard stats for students
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (user.role === 'student') {
        try {
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
          const response = await fetch('/api/progress/dashboard-stats', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await response.json();
              setDashboardStats(data.data);
            } else {
              const text = await response.text();
              console.error('Expected JSON for dashboard stats but got:', text.slice(0, 300));
            }
          } else {
            const errText = await response.text();
            console.error('Failed to fetch dashboard stats:', response.status, errText);
          }
        } catch (error) {
          console.error('Failed to fetch dashboard stats:', error);
        }
      }
    };

    fetchDashboardStats();
  }, [user.role]);

  const getDayKey = (day) => {
    // Use local date to match backend's dateKey format
    const date = new Date(currentYear, now.getMonth(), day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`; // YYYY-MM-DD in local timezone
  };

  const handleDayClick = (day) => {
    const dayKey = getDayKey(day);
    if (sessionsByDate[dayKey]) {
      setSelectedDate({ day, sessions: sessionsByDate[dayKey] });
    }
  };

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
            const dayKey = getDayKey(day);
            const hasSessions = sessionsByDate[dayKey] && sessionsByDate[dayKey].length > 0;

            let className = styles.day;
            if (day === today) className += ` ${styles.today}`;
            if (hasSessions) className += ` ${styles.hasSession}`;

            return (
              <span
                key={day}
                className={className}
                onClick={() => hasSessions && handleDayClick(day)}
                style={{ cursor: hasSessions ? 'pointer' : 'default' }}
              >
                {day}
                {hasSessions && <span className={styles.sessionDot}></span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Session Popup */}
      {selectedDate && (
        <div className={styles.sessionPopup}>
          <div className={styles.popupOverlay} onClick={() => setSelectedDate(null)}></div>
          <div className={styles.popupContent}>
            <div className={styles.popupHeader}>
              <h4>Sessions on {selectedDate.day} {currentMonth}</h4>
              <button onClick={() => setSelectedDate(null)} className={styles.closeBtn}>×</button>
            </div>
            <div className={styles.sessionsList}>
              {selectedDate.sessions.map(session => (
                <div key={session._id} className={styles.sessionItem} onClick={() => {
                  window.location.href = `/courses/${session.courseId._id}`;
                }}>
                  <div className={styles.sessionTime}>
                    {new Date(session.scheduledAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className={styles.sessionDetails}>
                    <div className={styles.sessionTitle}>{session.title}</div>
                    <div className={styles.sessionCourse}>{session.courseId.title}</div>
                    <div className={styles.sessionHost}>Host: {session.hostId.fullName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats for Students */}
      {user.role === 'student' && dashboardStats && (
        <div className={styles.block}>
          <h3>My Progress</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{dashboardStats.coursePassed}</div>
              <div className={styles.statLabel}>Total courses passed</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{dashboardStats.courseFailed}</div>
              <div className={styles.statLabel}>Total courses incomplete</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{dashboardStats.totalLessonsCompleted}</div>
              <div className={styles.statLabel}>Total lessons completed</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{dashboardStats.averageProgress}%</div>
              <div className={styles.statLabel}>Average progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Course Statistics for Students */}
      {user.role === 'student' && dashboardStats && (
        <div className={styles.block}>
          <h3>📊 Course Statistics</h3>
          <div className={styles.compactStatsGrid}>
            <div className={styles.compactStatItem}>
              <div className={styles.compactStatValue}>
                {dashboardStats.coursePassed + dashboardStats.courseFailed}
              </div>
              <div className={styles.compactStatLabel}>Total Enrolled</div>
            </div>
            <div className={styles.compactStatItem}>
              <div className={styles.compactStatValue}>
                {dashboardStats.coursePassed} / {dashboardStats.coursePassed + dashboardStats.courseFailed}
              </div>
              <div className={styles.compactStatLabel}>Completed</div>
            </div>
            <div className={styles.compactStatItem}>
              <div className={styles.compactStatValue}>
                {dashboardStats.averageProgress}%
              </div>
              <div className={styles.compactStatLabel}>Avg Progress</div>
            </div>
          </div>
        </div>
      )}
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
        <div className={styles.pageHero}>
          <h1 className={styles.mainTitle}>Dashboard</h1>
          <p className={styles.mainSubtitle}>
            Welcome back, {user.fullName}!
          </p>
        </div>
        <RoleView user={user} />
      </main>

      <aside className={styles.calendarSidebar}><CalendarSidebar user={user} /></aside>
    </div>
  );
}