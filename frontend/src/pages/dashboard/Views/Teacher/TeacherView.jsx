import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCourses } from '../../../../contexts/CoursesContext';
import api from '../../../../services/api';
import styles from './teacherView.module.css';

/**
 * Teacher Dashboard Component
 * 
 * Features:
 * - Display teacher-specific dashboard
 * - Show my courses list
 * - Show course analytics (students, completion rate, avg score)
 * - Show recent student activity
 * - Show pending quizzes to grade
 * - Show new discussion posts
 * - Quick stats (total students, courses, etc.)
 */

// Course Card Component
const CourseCard = ({ course, analytics }) => {
  const completionRate = analytics?.completionRate || 0;
  const avgScore = analytics?.avgScore || 0;
  const studentCount = analytics?.studentCount || 0;

  return (
    <div className={styles.courseCard}>
      <div
        className={styles.courseCardImage}
        style={{ backgroundColor: course.color || '#ddd6fe' }}
      >
        {course.thumbnail && (
          <img src={course.thumbnail} alt={course.title} />
        )}
      </div>
      <div className={styles.courseCardContent}>
        <h4>
          <Link to={`/courses/${course._id || course.id}`}>
            {course.title || course.name}
          </Link>
        </h4>
        <div className={styles.courseStats}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statValue}>{studentCount}</span>
            <span className={styles.statLabel}>Students</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>✓</span>
            <span className={styles.statValue}>{completionRate}%</span>
            <span className={styles.statLabel}>Completion</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>⭐</span>
            <span className={styles.statValue}>{avgScore.toFixed(1)}</span>
            <span className={styles.statLabel}>Avg Score</span>
          </div>
        </div>
        <div className={styles.courseActions}>
          <Link
            to={`/teacher/courses/${course._id || course.id}/edit`}
            className={styles.manageBtn}
          >
            Manage
          </Link>
          <Link
            to={`/teacher/courses/${course._id || course.id}/analytics`}
            className={styles.analyticsBtn}
          >
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

// Course Carousel Component
const CourseCarousel = ({ courses, analyticsMap }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const CARD_WIDTH_PX = 280;
  const GAP_PX = 24;
  const SCROLL_PAGE_SIZE = 4;

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(isScrollable && el.scrollLeft < (el.scrollWidth - el.clientWidth));
    }
  };

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = (CARD_WIDTH_PX + GAP_PX) * SCROLL_PAGE_SIZE;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(checkScrollability);
    observer.observe(el);
    el.addEventListener('scroll', checkScrollability);
    checkScrollability();

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', checkScrollability);
    };
  }, [courses]);

  if (!Array.isArray(courses) || courses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>You have no courses. <Link to="/teacher/courses/create">Create a new course</Link></p>
      </div>
    );
  }

  if (courses.length <= 4) {
    return (
      <div className={styles.courseList}>
        {courses.map(course => (
          <CourseCard
            key={course._id || course.id}
            course={course}
            analytics={analyticsMap?.[course._id || course.id]}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.carouselContainer}>
      <button
        className={`${styles.navButton} ${styles.left}`}
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <div className={styles.scrollWrapper} ref={scrollContainerRef}>
        <div className={styles.courseList}>
          {courses.map(course => (
            <CourseCard
              key={course._id || course.id}
              course={course}
              analytics={analyticsMap?.[course._id || course.id]}
            />
          ))}
        </div>
      </div>
      <button
        className={`${styles.navButton} ${styles.right}`}
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        aria-label="Scroll right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
};

// Quick Stats Component
const QuickStats = ({ stats }) => {
  const statItems = [
    {
      label: 'Total courses',
      value: stats.totalCourses || 0,
      icon: '📚',
      color: 'var(--color-teacher-primary)',
    },
    {
      label: 'Total students',
      value: stats.totalStudents || 0,
      icon: '👥',
      color: 'var(--color-info)',
    },
    {
      label: 'Pending grading',
      value: stats.pendingQuizzes || 0,
      icon: '📝',
      color: 'var(--color-warning)',
    },
    {
      label: 'New discussions',
      value: stats.newDiscussions || 0,
      icon: '💬',
      color: 'var(--color-success)',
    },
  ];

  return (
    <div className={styles.quickStats}>
      {statItems.map((item, index) => (
        <div key={index} className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: item.color }}>
            {item.icon}
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{item.value}</div>
            <div className={styles.statLabel}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className={styles.activityList}>
      {activities.map((activity, index) => (
        <div key={index} className={styles.activityItem}>
          <div className={styles.activityIcon}>
            {activity.type === 'quiz' && '📝'}
            {activity.type === 'lesson' && '📹'}
            {activity.type === 'discussion' && '💬'}
            {activity.type === 'enrollment' && '➕'}
          </div>
          <div className={styles.activityContent}>
            <div className={styles.activityText}>
              <strong>{activity.studentName}</strong> {activity.action}
              {activity.courseName && (
                <span className={styles.activityCourse}> trong {activity.courseName}</span>
              )}
            </div>
            <div className={styles.activityTime}>
              {activity.timestamp}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Pending Quizzes Component
const PendingQuizzes = ({ quizzes }) => {
  if (!quizzes || quizzes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No quizzes to grade</p>
      </div>
    );
  }

  return (
    <div className={styles.pendingQuizzesList}>
      {quizzes.map((quiz, index) => (
        <div key={index} className={styles.pendingQuizItem}>
          <div className={styles.quizInfo}>
            <h4 className={styles.quizTitle}>{quiz.quizTitle}</h4>
            <p className={styles.quizCourse}>{quiz.courseName}</p>
            <p className={styles.quizStudent}>
              Student: <strong>{quiz.studentName}</strong>
            </p>
          </div>
          <div className={styles.quizActions}>
            <Link
              to={`/quiz/${quiz.quizId}/grade/${quiz.attemptId}`}
              className={styles.gradeBtn}
            >
              Grade
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

// New Discussions Component
const NewDiscussions = ({ discussions }) => {
  if (!discussions || discussions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No new discussions</p>
      </div>
    );
  }

  return (
    <div className={styles.discussionsList}>
      {discussions.map((discussion, index) => (
        <div key={index} className={styles.discussionItem}>
          <div className={styles.discussionIcon}>💬</div>
          <div className={styles.discussionContent}>
            <h4 className={styles.discussionTitle}>
              <Link to={`/discussion/${discussion.id}`}>
                {discussion.title}
              </Link>
            </h4>
            <p className={styles.discussionMeta}>
              {discussion.authorName} • {discussion.courseName} • {discussion.timestamp}
            </p>
            {discussion.commentCount > 0 && (
              <p className={styles.discussionComments}>
                {discussion.commentCount} new comments
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Teacher View Component
const TeacherView = () => {
  const { user } = useAuth();
  const { myCourses, loading: coursesLoading } = useCourses();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingQuizzes: 0,
    newDiscussions: 0,
  });
  const [analyticsMap, setAnalyticsMap] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [newDiscussions, setNewDiscussions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user, myCourses]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard data from backend
      const dashboardRes = await api.get('/teacher/dashboard');
      const dashboardData = dashboardRes.data;

      // Set stats from dashboard data
      setStats({
        totalCourses: dashboardData.totalCourses || myCourses?.length || 0,
        totalStudents: dashboardData.totalStudents || 0,
        pendingQuizzes: dashboardData.pendingQuizzes || 0,
        newDiscussions: dashboardData.newDiscussions || 0,
      });

      // Process analytics if available
      if (dashboardData.courseAnalytics) {
        const map = {};
        dashboardData.courseAnalytics.forEach(item => {
          map[item.courseId] = item;
        });
        setAnalyticsMap(map);
      }

      // Process activities if available
      if (dashboardData.recentActivities) {
        setRecentActivities(dashboardData.recentActivities.slice(0, 5));
      }

      // Process pending quizzes if available
      if (dashboardData.pendingQuizzes) {
        setPendingQuizzes(dashboardData.pendingQuizzes);
      }

      // Process discussions if available
      if (dashboardData.recentDiscussions) {
        setNewDiscussions(dashboardData.recentDiscussions);
      }

    } catch (error) {
      console.error('[TeacherView] Error fetching dashboard data:', error);
      // Set fallback data on error
      setStats({
        totalCourses: myCourses?.length || 0,
        totalStudents: 0,
        pendingQuizzes: 0,
        newDiscussions: 0,
      });
      setRecentActivities([]);
      setPendingQuizzes([]);
      setNewDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || coursesLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner}></div>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className={styles.teacherDashboard}>
      {/* Quick Stats Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Quick Stats</h3>
        <QuickStats stats={stats} />
      </section>

      {/* My Courses Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>My Courses ({myCourses?.length || 0})</h3>
          <Link to="/teacher/courses/create" className={styles.createCourseBtn}>
            + Create new course
          </Link>
        </div>
        <CourseCarousel
          courses={myCourses || []}
          analyticsMap={analyticsMap}
        />
      </section>

      {/* Two Column Layout for Activities and Quizzes */}
      <div className={styles.twoColumnLayout}>
        {/* Recent Student Activity */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Recent student activity</h3>
          <RecentActivity activities={recentActivities} />
        </section>

        {/* Pending Quizzes */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Bài kiểm tra cần chấm</h3>
            {pendingQuizzes.length > 0 && (
              <span className={styles.badge}>{pendingQuizzes.length}</span>
            )}
          </div>
          <PendingQuizzes quizzes={pendingQuizzes} />
        </section>
      </div>

      {/* New Discussions Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Thảo luận mới</h3>
          {newDiscussions.length > 0 && (
            <span className={styles.badge}>{newDiscussions.length}</span>
          )}
        </div>
        <NewDiscussions discussions={newDiscussions} />
      </section>
    </div>
  );
};

export default TeacherView;
