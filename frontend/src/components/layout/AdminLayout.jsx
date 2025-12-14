import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import toastService from '../../services/toastService';
import styles from './AdminLayout.module.css';

/**
 * Admin Layout Component
 * Special layout with admin sidebar navigation
 */
const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('Bạn không có quyền truy cập admin panel');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const adminNavigation = [
        {
            section: 'Overview',
            items: [
                { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
                { icon: '📈', label: 'Analytics', path: '/admin/analytics' }
            ]
        },
        {
            section: 'User Management',
            items: [
                { icon: '👥', label: 'All Users', path: '/admin/users' },
                { icon: '🔑', label: 'Roles & Permissions', path: '/admin/roles' }
            ]
        },
        {
            section: 'Content Management',
            items: [
                { icon: '📚', label: 'All Courses', path: '/courses' },
                { icon: '✅', label: 'Course Approval', path: '/admin/courses/approval' },
                { icon: '🚨', label: 'Content Moderation', path: '/admin/moderation' }
            ]
        },
        {
            section: 'System',
            items: [
                { icon: '⚙️', label: 'System Settings', path: '/admin/settings' },
                { icon: '🔒', label: 'Security', path: '/admin/security' },
                { icon: '📋', label: 'Audit Logs', path: '/admin/logs' }
            ]
        }
    ];

    if (user?.role !== 'admin') {
        return null;
    }

    return (
        <div className={styles.adminLayout}>
            {/* Admin Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.logo}>
                        <span className={styles.logoIcon}>🎓</span>
                        <span className={styles.logoText}>IELTS Hub Admin</span>
                    </div>

                    <div className={styles.headerRight}>
                        <button
                            className={styles.backBtn}
                            onClick={() => navigate('/dashboard')}
                        >
                            ← Back to Dashboard
                        </button>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.fullName || user?.name}</span>
                            <span className={styles.userRole}>Administrator</span>
                        </div>
                        <button
                            className={styles.logoutBtn}
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className={styles.container}>
                {/* Admin Sidebar */}
                <aside className={styles.sidebar}>
                    <nav className={styles.nav}>
                        {adminNavigation.map((section, idx) => (
                            <div key={idx} className={styles.navSection}>
                                <div className={styles.sectionTitle}>{section.section}</div>
                                <div className={styles.navItems}>
                                    {section.items.map((item, itemIdx) => (
                                        <NavLink
                                            key={itemIdx}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                                            }
                                        >
                                            <span className={styles.navIcon}>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
