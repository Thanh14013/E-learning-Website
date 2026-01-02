
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



// Quick Stats Component
const QuickStats = ({ stats, courses }) => {
  // Safe Trend Calculation
  const calculateTrend = (dataArray) => {
    if (!dataArray || dataArray.length < 2) return null;
    const current = dataArray[dataArray.length - 1] || 0;
    const previous = dataArray[dataArray.length - 2] || 0;

    if (previous === 0) {
      return current > 0 ? { value: 100, isNew: true } : { value: 0 };
    }

    const change = ((current - previous) / previous) * 100;
    return { value: change.toFixed(1) };
  };

  const studentTrend = calculateTrend(stats.trend?.activeStudents); // Using active students history or total? Usually total for growth.
  // stats.trend.totalStudents is likely available
  const totalStudentsTrend = calculateTrend(stats.trend?.totalStudents);

  const kpis = [
    {
      label: 'Total Students',
      value: stats.totalStudents?.toLocaleString() || 0,
      icon: '👥',
      color: '#3b82f6', // blue
      bg: '#eff6ff',
      trendData: totalStudentsTrend,
      trendLabel: 'vs last period'
    },
    {
      label: 'Published Courses',
      value: stats.publishedCourses || 0,
      icon: '📘',
      color: '#10b981', // green
      bg: '#ecfdf5',
      // No fake trend for courses
    },
    {
      label: 'Avg Rating',
      value: stats.averageRating?.toFixed(1) || '0.0',
      icon: '⭐',
      color: '#f59e0b', // amber
      bg: '#fffbeb',
      trendData: { value: 0 }, // Placeholder or calculate if data available
      trendLabel: 'vs last mo'
    }
  ];

  const renderTrend = (trendObj, label) => {
    if (!trendObj) return null;
    if (trendObj.isNew) return <span className={`${styles.statTrend} ${styles.trendUp}`}>New</span>;

    const num = parseFloat(trendObj.value);
    if (isNaN(num)) return null;

    const isPositive = num > 0;
    const isNeutral = num === 0;

    return (
      <span className={`${styles.statTrend} ${isPositive ? styles.trendUp : isNeutral ? styles.trendNeutral : styles.trendDown}`}>
      </span>
    );
  };

  return (
    <>
      <div className={styles.kpiRow}>
        {kpis.map((item, index) => (
          <div key={index} className={styles.statCard} style={{ borderTop: `4px solid ${item.color}` }}>
            <div className={styles.statHeader}>
              <div className={styles.statIconBox} style={{ color: item.color, backgroundColor: item.bg }}>
                {item.icon}
              </div>
              {renderTrend(item.trendData, item.trendLabel)}
            </div>

            <div>
              <div className={styles.statValue}>{item.value}</div>
              <div className={styles.statLabel}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.secondaryStatsRow}>
        {/* Content Breakdown */}
        <div className={styles.groupedCard}>
          <div className={styles.groupedHeader}>
            <span style={{ fontSize: '1.2rem' }}>📂</span>
            <h4 className={styles.groupedTitle}>Content Breakdown</h4>
          </div>
          <div className={styles.groupedList}>
            <div className={styles.groupedItem}>
              <div className={styles.groupedLabel}>📘 Courses</div>
              <div className={styles.groupedValue}>{stats.totalCourses || 0}</div>
            </div>
            <div className={styles.groupedItem}>
              <div className={styles.groupedLabel}>📑 Chapters</div>
              <div className={styles.groupedValue}>{stats.totalChapters || 0}</div>
            </div>
            <div className={styles.groupedItem}>
              <div className={styles.groupedLabel}>🎥 Lessons</div>
              <div className={styles.groupedValue}>{stats.totalLessons || 0}</div>
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className={styles.groupedCard}>
          <div className={styles.groupedHeader}>
            <span style={{ fontSize: '1.2rem' }}>💬</span>
            <h4 className={styles.groupedTitle}>Engagement</h4>
          </div>
          <div className={styles.groupedList}>
            <div className={styles.groupedItem}>
              <div className={styles.groupedLabel}>🔥 New Discussions</div>
              <div className={styles.groupedValue}>{stats.newDiscussions || 0}</div>
            </div>
            <div className={styles.groupedItem}>
              <div className={styles.groupedLabel}>⚡ Active Students</div>
              <div className={styles.groupedValue}>{stats.activeStudents || 0}</div>
            </div>
            <div className={styles.groupedItem}>
              <div className={styles.groupedLabel}>⏱️ Avg Completion</div>
              <div className={styles.groupedValue}>
                {stats.trend?.completionRate?.[stats.trend.completionRate.length - 1] || 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
        <br />
        <QuickStats stats={stats} courses={myCourses} />
      </section>

      {/* Aggregate Charts Section */}
      <section className={styles.section}>
        <AggregateCharts trend={stats.trend} />
      </section>





      {/* New Discussions Section */}

    </div>
  );
};

export default TeacherView;
