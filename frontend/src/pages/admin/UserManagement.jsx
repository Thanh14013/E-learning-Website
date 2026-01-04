import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { debounce } from '../../utils/performance';
import { useConfirm } from '../../contexts/ConfirmDialogContext';
import styles from './UserManagement.module.css';

export default function UserManagement() {
    const { confirm } = useConfirm();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [actionLoading, setActionLoading] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [brokenAvatars, setBrokenAvatars] = useState({});

    // Fetch users with filters
    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: pagination.limit,
                sort: '-createdAt'
            };

            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.isVerified = statusFilter === 'verified';

            const response = await api.get('/admin/users', { params });
            const data = response.data;

            setUsers(data.users || []);
            setPagination({
                page: data.page,
                limit: data.limit,
                total: data.total,
                totalPages: data.totalPages
            });
        } catch (error) {
            console.error('[UserManagement] Error fetching users:', error);
            toastService.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, [roleFilter, statusFilter]);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((term) => {
            if (term.trim()) {
                const filtered = users.filter(user =>
                    user.fullName?.toLowerCase().includes(term.toLowerCase()) ||
                    user.email?.toLowerCase().includes(term.toLowerCase())
                );
                setUsers(filtered);
            } else {
                fetchUsers(pagination.page);
            }
        }, 500),
        [users, pagination.page]
    );

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Change user role
    const handleRoleChange = async (userId, newRole) => {
        const isConfirmed = await confirm(`Are you sure you want to change this user's role to ${newRole}?`, { type: 'warning', title: 'Change Role' });
        if (!isConfirmed) {
            return;
        }

        try {
            setActionLoading({ ...actionLoading, [userId]: 'role' });
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            toastService.success(`User role updated to ${newRole}`);
            await fetchUsers(pagination.page);
        } catch (error) {
            console.error('[UserManagement] Error changing role:', error);
            toastService.error(error.response?.data?.message || 'Failed to update role');
        } finally {
            setActionLoading({ ...actionLoading, [userId]: null });
        }
    };

    // Ban/Unban user
    const handleBanToggle = async (userId, currentStatus) => {
        const action = currentStatus ? 'unban' : 'ban';
        const isConfirmed = await confirm(`Are you sure you want to ${action} this user?`, { type: action === 'ban' ? 'danger' : 'info', title: `${action === 'ban' ? 'Ban' : 'Unban'} User` });
        if (!isConfirmed) {
            return;
        }

        try {
            setActionLoading({ ...actionLoading, [userId]: 'ban' });
            await api.put(`/admin/users/${userId}/ban`, { isBanned: !currentStatus });
            toastService.success(`User ${action}ned successfully`);
            await fetchUsers(pagination.page);
        } catch (error) {
            console.error('[UserManagement] Error toggling ban:', error);
            toastService.error(error.response?.data?.message || `Failed to ${action} user`);
        } finally {
            setActionLoading({ ...actionLoading, [userId]: null });
        }
    };

    // Delete user
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        try {
            setActionLoading({ ...actionLoading, [userToDelete._id]: 'delete' });
            await api.delete(`/admin/users/${userToDelete._id}`);
            toastService.success('User deleted successfully');
            setShowDeleteModal(false);
            setUserToDelete(null);
            await fetchUsers(pagination.page);
        } catch (error) {
            console.error('[UserManagement] Error deleting user:', error);
            toastService.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setActionLoading({ ...actionLoading, [userToDelete._id]: null });
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUsers(newPage);
        }
    };

    const getStatusBadge = (user) => {
        if (user.isBanned) return <span className={styles.statusBanned}>Banned</span>;
        if (user.isVerified) return <span className={styles.statusActive}>Active</span>;
        return <span className={styles.statusPending}>Pending</span>;
    };

    const getTeacherApprovalBadge = (user) => {
        if (user.role !== 'teacher') return <span className={styles.statusMuted}>N/A</span>;
        const status = user.profileApprovalStatus || 'pending';
        if (status === 'approved') return <span className={styles.statusActive}>Approved</span>;
        if (status === 'rejected') return <span className={styles.statusBanned}>Rejected</span>;
        return <span className={styles.statusPending}>Pending</span>;
    };

    const handleTeacherApproval = async (userId, status) => {
        const isConfirmed = await confirm(`Mark this teacher as ${status}?`, { type: 'warning', title: 'Update Status' });
        if (!isConfirmed) return;
        try {
            setActionLoading({ ...actionLoading, [userId]: 'approval' });
            await api.put(`/admin/users/teachers/${userId}/approval`, { status });
            toastService.success(`Teacher ${status}`);
            await fetchUsers(pagination.page);
        } catch (error) {
            console.error('[UserManagement] Error approving teacher:', error);
            toastService.error(error.response?.data?.message || 'Failed to update teacher status');
        } finally {
            setActionLoading({ ...actionLoading, [userId]: null });
        }
    };

    const handleAvatarError = (id) => {
        setBrokenAvatars((prev) => ({ ...prev, [id]: true }));
    };

    if (loading && users.length === 0) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading users...</p>
            </div>
        );
    }

    return (
        <div className={styles.userManagement}>
            <div className={styles.header}>
                <h1>👥 User Management</h1>
                <button
                    className={styles.backButton}
                    onClick={() => navigate('/dashboard')}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>Role:</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Status</option>
                        <option value="verified">Active</option>
                        <option value="unverified">Pending</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className={styles.tableWrapper}>
                {users.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No users found matching your criteria</p>
                    </div>
                ) : (
                    <table className={styles.usersTable}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Teacher Approval</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.userAvatar}>
                                                {user.avatar && !brokenAvatars[user._id] ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.fullName}
                                                        onError={() => handleAvatarError(user._id)}
                                                    />
                                                ) : (
                                                    <div className={styles.avatarPlaceholder}>
                                                        {user.fullName?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={styles.userName}>{user.fullName}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={user.role || 'student'}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            className={styles.roleSelect}
                                            disabled={actionLoading[user._id] === 'role'}
                                        >
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>{getStatusBadge(user)}</td>
                                    <td>
                                        <div className={styles.approvalCell}>
                                            {getTeacherApprovalBadge(user)}
                                            {user.role === 'teacher' && (user.profileApprovalStatus || 'pending') === 'pending' && (
                                                <div className={styles.approvalActions}>
                                                    <button
                                                        className={styles.btnSmall}
                                                        onClick={() => handleTeacherApproval(user._id, 'approved')}
                                                        disabled={actionLoading[user._id] === 'approval'}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className={styles.btnSmallSecondary}
                                                        onClick={() => handleTeacherApproval(user._id, 'rejected')}
                                                        disabled={actionLoading[user._id] === 'approval'}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={user.isBanned ? styles.btnUnban : styles.btnBan}
                                                onClick={() => handleBanToggle(user._id, user.isBanned)}
                                                disabled={actionLoading[user._id] === 'ban'}
                                            >
                                                {user.isBanned ? '✓ Unban' : '🚫 Ban'}
                                            </button>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => handleDeleteClick(user)}
                                                disabled={actionLoading[user._id] === 'delete'}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className={styles.pageButton}
                    >
                        ← Previous
                    </button>
                    <span className={styles.pageInfo}>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className={styles.pageButton}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h3>⚠️ Confirm Deletion</h3>
                        <p>
                            Are you sure you want to delete <strong>{userToDelete?.fullName}</strong>?
                            <br />
                            This action cannot be undone and will delete all user data.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.btnCancel}
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.btnConfirmDelete}
                                onClick={confirmDelete}
                                disabled={actionLoading[userToDelete?._id] === 'delete'}
                            >
                                {actionLoading[userToDelete?._id] === 'delete' ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

