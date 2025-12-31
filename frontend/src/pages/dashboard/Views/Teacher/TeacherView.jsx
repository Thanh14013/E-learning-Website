
import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
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
// Course Card Component
const CourseCard = ({ course, analytics, user }) => {
  const completionRate = analytics?.completionRate || 0;
  const avgScore = analytics?.avgScore || analytics?.rating || 0;
  const studentCount = analytics?.students || analytics?.studentCount || 0;

  const isPublished = course.isPublished;
  const canEdit = !isPublished || user?.role === 'admin';

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
          {isPublished ? (
            <>
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
            </>
          ) : (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--color-gray-500)', fontStyle: 'italic', padding: '10px 0' }}>
              Pending Approval
            </div>
          )}
        </div>
        <div className={styles.courseActions}>
          {canEdit && (
            <Link
              to={`/teacher/courses/${course._id || course.id}/edit`}
              className={styles.manageBtn}
            >
              Edit
            </Link>
          )}
          {course.isPublished && (
            <Link
              to={`/teacher/courses/${course._id || course.id}/analytics`}
              className={styles.analyticsBtn}
            >
              Analytics
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Course Carousel Component
const CourseCarousel = ({ courses, analyticsMap, user }) => {
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
            user={user}
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
              user={user}
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
      label: 'Total chapters',
      value: stats.totalChapters || 0,
      icon: '📑',
      color: '#8b5cf6', // Violet
    },
    {
      label: 'Total lessons',
      value: stats.totalLessons || 0,
      icon: '🎬',
      color: '#10b981', // Emerald
    },
    {
      label: 'Total students',
      value: stats.totalStudents || 0,
      icon: '👥',
      color: 'var(--color-info)',
    },
    {
      label: 'Published courses',
      value: stats.publishedCourses || 0,
      icon: '✅',
      color: 'var(--color-success)',
    },
    {
      label: 'Avg Rating',
      value: stats.averageRating || 0,
      icon: '⭐',
      color: 'var(--color-warning)',
    },
    {
      label: 'New discussions',
      value: stats.newDiscussions || 0,
      icon: '💬',
      color: 'var(--color-success)',
    },
  ];

  const renderCard = (item, index) => (
    <div key={index} className={styles.statCard}>
      <div className={styles.statIcon} style={{ color: item.color }}>
        {item.icon}
      </div>
      <div className={styles.statContent}>
        <div className={styles.statValue}>{item.value}</div>
        <div className={styles.statLabel}>{item.label}</div>
      </div>
    </div>
  );

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsRowTop}>
        {statItems.slice(0, 4).map((item, index) => renderCard(item, `top-${index}`))}
      </div>
      <div className={styles.statsRowBottom}>
        {statItems.slice(4).map((item, index) => renderCard(item, `bottom-${index}`))}
      </div>
    </div>
  );
};

// --- Aggregate Charts Component ---
const AggregateCharts = ({ trend }) => {
  const trendData = useMemo(() => {
    const dates = trend?.dates || [];
    return dates.map((d, idx) => ({
      date: new Date(d).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
      totalStudents: trend.totalStudents?.[idx] ?? 0,
      activeStudents: trend.activeStudents?.[idx] ?? 0,
      completionRate: trend.completionRate?.[idx] ?? 0,
    }));
  }, [trend]);

  if (!trend || !trend.dates || trend.dates.length === 0) return null;

  return (
    <div className={styles.chartsRow}>
      <div className={styles.chartCard}>
        <h3>Enrollment & Engagement (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="totalStudents" name="Total students" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="activeStudents" name="Active students" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.chartCard}>
        <h3>Overall Completion Rate</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="completion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => [`${value}%`, 'Completion']}
            />
            <Area type="monotone" dataKey="completionRate" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#completion)" name="Completion %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};



// NewDiscussions component removed

// Main Teacher View Component
const TeacherView = () => {
  const { user } = useAuth();
  const { myCourses, loading: coursesLoading } = useCourses();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    publishedCourses: 0,
    newDiscussions: 0,
    trend: {},
  });
  const [analyticsMap, setAnalyticsMap] = useState({});
  const [newDiscussions, setNewDiscussions] = useState([]);
  const navigate = useNavigate();

  // trendData removed (unused)

  useEffect(() => {
    fetchDashboardData();
  }, [user, myCourses]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard data from backend
      const dashboardRes = await api.get('/teacher/dashboard');
      const dashboardData = dashboardRes.data?.data || dashboardRes.data; // Handle potentially unwrapped response safely

      // Set stats from dashboard data
      // Set stats from dashboard data
      setStats({
        totalCourses: dashboardData.totalCourses || myCourses?.length || 0,
        totalChapters: dashboardData.totalChapters || 0,
        totalLessons: dashboardData.totalLessons || 0,
        totalStudents: dashboardData.totalStudents || 0,
        publishedCourses: dashboardData.publishedCourses || 0, // Use backend count
        averageRating: dashboardData.averageRating || 0,
        newDiscussions: dashboardData.newDiscussions || 0,
        trend: dashboardData.trend || {}, // pass trend data
      });

      // Process analytics if available
      if (dashboardData.courseAnalytics) {
        const map = {};
        dashboardData.courseAnalytics.forEach(item => {
          map[item.courseId] = item;
        });
        setAnalyticsMap(map);
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
        publishedCourses: 0,
        newDiscussions: 0,
      });

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

      {/* Aggregate Charts Section */}
      <section className={styles.section}>
        <AggregateCharts trend={stats.trend} />
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
          user={user}
        />
      </section>



      {/* New Discussions Section */}

    </div>
  );
};

export default TeacherView;
