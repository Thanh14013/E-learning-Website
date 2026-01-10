import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toastService from '../../services/toastService';
import styles from './SessionHistoryModal.module.css';

export default function SessionHistoryModal({ sessionId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        if (sessionId) {
            fetchSessionDetail();
        }
    }, [sessionId]);

    const fetchSessionDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/sessions/${sessionId}`);
            if (response.data.success) {
                setSession(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching session detail:', error);
            toastService.error('Unable to load session details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading session history...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2>Session History: {session.title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    <div className={styles.discussionInfo}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Host:</span>
                            <span>{session.hostId?.fullName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Date:</span>
                            <span>{new Date(session.scheduledAt).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Participants:</span>
                            <span>{session.participants?.length || 0}</span>
                        </div>
                    </div>

                    <div className={styles.chatSection}>
                        <h3 className={styles.chatTitle}>Chat History ({session.messages?.length || 0})</h3>
                        <div className={styles.chatContainer}>
                            {session.messages?.length === 0 ? (
                                <p className={styles.emptyState}>No messages in this session.</p>
                            ) : (
                                session.messages.map((msg, index) => (
                                    <div key={index} className={styles.messageItem}>
                                        <div className={styles.messageHeader}>
                                            <span className={styles.senderName}>{msg.userName}</span>
                                            <span className={styles.timestamp}>
                                                {new Date(msg.timestamp).toLocaleString('en-GB')}
                                            </span>
                                        </div>
                                        <div className={styles.messageBubble}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
