import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toastService from '../../services/toastService';
import styles from './ContentModeration.module.css';

const ContentModeration = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    // Mock data - replace with real API when backend implements reports
    const mockReports = [
        {
            _id: '1',
            type: 'discussion',
            contentId: 'disc123',
            contentPreview: 'This is inappropriate content that violates...',
            reportedBy: { _id: 'u1', fullName: 'John Doe', email: 'john@example.com' },
            author: { _id: 'u2', fullName: 'Jane Smith', email: 'jane@example.com' },
            reason: 'Inappropriate content',
            status: 'pending',
            createdAt: new Date('2024-01-15'),
            description: 'This content contains offensive language and violates community guidelines.'
        },
        {
            _id: '2',
            type: 'comment',
            contentId: 'com456',
            contentPreview: 'Spam link to external website...',
            reportedBy: { _id: 'u3', fullName: 'Bob Wilson', email: 'bob@example.com' },
            author: { _id: 'u4', fullName: 'Alice Brown', email: 'alice@example.com' },
            reason: 'Spam',
            status: 'pending',
            createdAt: new Date('2024-01-16'),
            description: 'User is posting spam links repeatedly.'
        },
        {
            _id: '3',
            type: 'discussion',
            contentId: 'disc789',
            contentPreview: 'Harassment and bullying other students...',
            reportedBy: { _id: 'u5', fullName: 'Charlie Davis', email: 'charlie@example.com' },
            author: { _id: 'u6', fullName: 'David Lee', email: 'david@example.com' },
            reason: 'Harassment',
            status: 'approved',
            createdAt: new Date('2024-01-14'),
            description: 'This user is harassing other students in discussions.'
        }
    ];

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            // TODO: Replace with real API call when backend implements reports
            // const response = await api.get('/admin/reports');
            // setReports(response.data.reports || []);

            // Using mock data for now
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            setReports(mockReports);
        } catch (error) {
            console.error('[ContentModeration] Error fetching reports:', error);
            toastService.error('Failed to load reports');
            // Fallback to mock data on error
            setReports(mockReports);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(report => {
        if (activeTab === 'all') return true;
        return report.status === activeTab;
    });

    const handleApproveReport = async (reportId) => {
        if (!window.confirm('Approve this report? The content will be reviewed.')) {
            return;
        }

        try {
            setActionLoading({ ...actionLoading, [reportId]: 'approve' });
            // TODO: Replace with real API call
            // await api.put(`/admin/reports/${reportId}/approve`);

            // Mock success
            await new Promise(resolve => setTimeout(resolve, 500));
            setReports(reports.map(r =>
                r._id === reportId ? { ...r, status: 'approved' } : r
            ));
            toastService.success('Report approved successfully');
        } catch (error) {
            console.error('[ContentModeration] Error approving report:', error);
            toastService.error('Failed to approve report');
        } finally {
            setActionLoading({ ...actionLoading, [reportId]: null });
        }
    };

    const handleRejectReport = async (reportId) => {
        if (!window.confirm('Reject this report? No action will be taken.')) {
            return;
        }

        try {
            setActionLoading({ ...actionLoading, [reportId]: 'reject' });
            // TODO: Replace with real API call
            // await api.put(`/admin/reports/${reportId}/reject`);

            await new Promise(resolve => setTimeout(resolve, 500));
            setReports(reports.map(r =>
                r._id === reportId ? { ...r, status: 'rejected' } : r
            ));
            toastService.success('Report rejected successfully');
        } catch (error) {
            console.error('[ContentModeration] Error rejecting report:', error);
            toastService.error('Failed to reject report');
        } finally {
            setActionLoading({ ...actionLoading, [reportId]: null });
        }
    };

    const handleDeleteContent = async (report) => {
        if (!window.confirm('Delete this content permanently? This action cannot be undone.')) {
            return;
        }

        try {
            setActionLoading({ ...actionLoading, [report._id]: 'delete' });
            // TODO: Replace with real API call based on content type
            // if (report.type === 'discussion') {
            //   await api.delete(`/discussions/${report.contentId}`);
            // } else if (report.type === 'comment') {
            //   await api.delete(`/comments/${report.contentId}`);
            // }

            await new Promise(resolve => setTimeout(resolve, 500));
            setReports(reports.filter(r => r._id !== report._id));
            toastService.success('Content deleted successfully');
        } catch (error) {
            console.error('[ContentModeration] Error deleting content:', error);
            toastService.error('Failed to delete content');
        } finally {
            setActionLoading({ ...actionLoading, [report._id]: null });
        }
    };

    const handleBanAuthor = async (report) => {
        if (!window.confirm(`Ban user ${report.author.fullName}? They will no longer be able to access the platform.`)) {
            return;
        }

        try {
            setActionLoading({ ...actionLoading, [report._id]: 'ban' });
            // TODO: Replace with real API call
            // await api.put(`/users/${report.author._id}/ban`, { isBanned: true });

            await new Promise(resolve => setTimeout(resolve, 500));
            toastService.success(`User ${report.author.fullName} banned successfully`);
        } catch (error) {
            console.error('[ContentModeration] Error banning user:', error);
            toastService.error('Failed to ban user');
        } finally {
            setActionLoading({ ...actionLoading, [report._id]: null });
        }
    };

    const handleViewDetails = (report) => {
        setSelectedReport(report);
        setShowDetailModal(true);
    };

    const getReasonBadge = (reason) => {
        const reasonMap = {
            'Spam': styles.reasonSpam,
            'Harassment': styles.reasonHarassment,
            'Inappropriate content': styles.reasonInappropriate,
        };
        return reasonMap[reason] || styles.reasonOther;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { class: styles.statusPending, label: 'Pending' },
            'approved': { class: styles.statusApproved, label: 'Approved' },
            'rejected': { class: styles.statusRejected, label: 'Rejected' },
        };
        const config = statusMap[status] || statusMap['pending'];
        return <span className={config.class}>{config.label}</span>;
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading reports...</p>
            </div>
        );
    }

    return (
        <div className={styles.contentModeration}>
            <div className={styles.header}>
                <h1>🛡️ Content Moderation</h1>
                <button
                    className={styles.backButton}
                    onClick={() => navigate('/dashboard')}
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Info Banner */}
            <div className={styles.infoBanner}>
                <p>
                    <strong>Note:</strong> This is a UI-ready implementation. Backend report system needs to be implemented
                    with endpoints: GET /admin/reports, PUT /admin/reports/:id/approve, PUT /admin/reports/:id/reject
                </p>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={activeTab === 'all' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('all')}
                >
                    All Reports ({reports.length})
                </button>
                <button
                    className={activeTab === 'pending' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending ({reports.filter(r => r.status === 'pending').length})
                </button>
                <button
                    className={activeTab === 'approved' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('approved')}
                >
                    Approved ({reports.filter(r => r.status === 'approved').length})
                </button>
                <button
                    className={activeTab === 'rejected' ? styles.tabActive : styles.tab}
                    onClick={() => setActiveTab('rejected')}
                >
                    Rejected ({reports.filter(r => r.status === 'rejected').length})
                </button>
            </div>

            {/* Reports List */}
            <div className={styles.reportsList}>
                {filteredReports.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No reports in this category</p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <div key={report._id} className={styles.reportCard}>
                            <div className={styles.reportHeader}>
                                <div className={styles.reportMeta}>
                                    <span className={styles.reportType}>
                                        {report.type === 'discussion' ? '💬' : '📝'} {report.type}
                                    </span>
                                    <span className={getReasonBadge(report.reason)}>
                                        {report.reason}
                                    </span>
                                    {getStatusBadge(report.status)}
                                </div>
                                <span className={styles.reportDate}>
                                    {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className={styles.reportContent}>
                                <p className={styles.contentPreview}>
                                    "{report.contentPreview}"
                                </p>
                                <button
                                    className={styles.viewDetailsBtn}
                                    onClick={() => handleViewDetails(report)}
                                >
                                    View Full Content →
                                </button>
                            </div>

                            <div className={styles.reportInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Reported by:</span>
                                    <span>{report.reportedBy.fullName} ({report.reportedBy.email})</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>Author:</span>
                                    <span>{report.author.fullName} ({report.author.email})</span>
                                </div>
                            </div>

                            {report.status === 'pending' && (
                                <div className={styles.actions}>
                                    <button
                                        className={styles.btnApprove}
                                        onClick={() => handleApproveReport(report._id)}
                                        disabled={actionLoading[report._id] === 'approve'}
                                    >
                                        ✓ Approve Report
                                    </button>
                                    <button
                                        className={styles.btnReject}
                                        onClick={() => handleRejectReport(report._id)}
                                        disabled={actionLoading[report._id] === 'reject'}
                                    >
                                        ✕ Reject Report
                                    </button>
                                    <button
                                        className={styles.btnDelete}
                                        onClick={() => handleDeleteContent(report)}
                                        disabled={actionLoading[report._id] === 'delete'}
                                    >
                                        🗑️ Delete Content
                                    </button>
                                    <button
                                        className={styles.btnBan}
                                        onClick={() => handleBanAuthor(report)}
                                        disabled={actionLoading[report._id] === 'ban'}
                                    >
                                        🚫 Ban Author
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedReport && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Report Details</h3>
                            <button
                                className={styles.modalClose}
                                onClick={() => setShowDetailModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.detailRow}>
                                <strong>Type:</strong>
                                <span>{selectedReport.type}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>Reason:</strong>
                                <span>{selectedReport.reason}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>Description:</strong>
                                <p>{selectedReport.description}</p>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>Content:</strong>
                                <div className={styles.fullContent}>
                                    {selectedReport.contentPreview}
                                </div>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>Reported by:</strong>
                                <span>{selectedReport.reportedBy.fullName} ({selectedReport.reportedBy.email})</span>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>Author:</strong>
                                <span>{selectedReport.author.fullName} ({selectedReport.author.email})</span>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>Date:</strong>
                                <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <strong>Status:</strong>
                                {getStatusBadge(selectedReport.status)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentModeration;
