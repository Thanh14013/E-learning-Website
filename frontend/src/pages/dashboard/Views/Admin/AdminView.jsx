import { useState, useEffect } from 'react';
import api from '../../../../services/api';
import toastService from '../../../../services/toastService';
import styles from './AdminView.module.css';

const AdminView = ({ user }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeToday: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch platform statistics using analytics dashboard
        const dashboardRes = await api.get('/analytics/dashboard');
        const dashboardData = dashboardRes.data;

        // Also fetch users list for recent users display
        const usersRes = await api.get('/users/list', { params: { page: 1, limit: 5, sortBy: 'createdAt', order: 'desc' } });

        const users = usersRes.data.users || [];
        const totalUsers = usersRes.data.pagination?.total || users.length;
        const totalCourses = dashboardData.totalCourses || 0;
        const totalEnrollments = dashboardData.totalEnrollments || 0;

        // Set stats from dashboard
        setStats({
          totalUsers: totalUsers,
          totalCourses: totalCourses,
          totalEnrollments: totalEnrollments,
          activeToday: dashboardData.activeToday || 0,
        });

        // Recent users (already sorted from API)
        setRecentUsers(users);
      } catch (error) {
        console.error('[AdminView] Error fetching data:', error);
        toastService.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.adminView}>
      <h2 className={styles.welcome}>🛠 Welcome Admin, {user.fullName}</h2>

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <h3>{stats.totalCourses}</h3>
            <p>Total Enrollments</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎓</div>
          <div className={styles.statContent}>
            <h3>{stats.totalEnrollments}</h3>
            <p>Total Enrollments</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <h3>{stats.activeToday}</h3>
            <p>Active Today</p>
          </div>
        </div>
      </div>

      {/* Admin Panel Link */}
      <div className={styles.adminPanelBanner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerIcon}>🎛️</div>
          <div>
            <h3>Admin Control Panel</h3>
            <p>Access full admin dashboard with advanced features</p>
          </div>
        </div>
        <button
          className={styles.adminPanelBtn}
          onClick={() => window.location.href = '/admin/dashboard'}
        >
          Go to Admin Panel →
        </button>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <button
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/users'}
          >
            👥 Manage Users
          </button>
          <button
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/courses/approval'}
          >
            ✅ Course Approval
          </button>
          <button
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/moderation'}
          >
            🛡️ Content Moderation
          </button>
          <button
            className={styles.actionButton}
            onClick={() => window.location.href = '/admin/settings'}
          >
            ⚙️ System Settings
          </button>
        </div>
      </div>

      {/* Recent Users */}
      <div className={styles.recentUsers}>
        <h3>Recent Registrations</h3>
        <div className={styles.usersList}>
          {recentUsers.length === 0 ? (
            <p className={styles.emptyState}>No recent users</p>
          ) : (
            recentUsers.map((user) => (
              <div key={user._id} className={styles.userCard}>
                <div className={styles.userAvatar}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <h4>{user.fullName}</h4>
                  <p>{user.email}</p>
                  <span className={styles.role}>{user.role}</span>
                </div>
                <div className={styles.userDate}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminView;
