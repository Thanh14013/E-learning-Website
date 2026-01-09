import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import toastService from '../../services/toastService';
import styles from './AdminLayout.module.css';

/**
 * Admin Layout Component
 * Special layout with admin sidebar navigation
 */
const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (user?.role !== 'admin') {
            toastService.error('You do not have access to the admin panel');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const adminNavigation = [
        {
            section: '', // No section title for unified view
            items: [
                { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
                { icon: '📈', label: 'Analytics', path: '/admin/analytics' },
                { icon: '👥', label: 'All Users', path: '/admin/users' },
                { icon: '📚', label: 'All Courses', path: '/admin/courses' }
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
                        <button
                            className={styles.toggleBtn}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            aria-label="Toggle Sidebar"
                        >
                            ☰
                        </button>
                        <span className={styles.logoIcon}>🎓</span>
                        <span className={styles.logoText}>MasterDev Admin</span>
                    </div>

                    <div className={styles.headerRight}>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>Admin</span>
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

            <div className={`${styles.container} ${!isSidebarOpen ? styles.containerCollapsed : ''}`}>
                {/* Admin Sidebar */}
                <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
                    <nav className={styles.nav}>
                        {adminNavigation.map((section, idx) => (
                            <div key={idx} className={styles.navSection}>
                                {section.section && <div className={styles.sectionTitle}>{section.section}</div>}
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
