import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../services/api';
import styles from './CourseAnalytics.module.css';

const StudentAnalyticsModal = ({ courseId, student, onClose, days = 30 }) => {
    const [trend, setTrend] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentTrend = async () => {
            try {
                // Fetch daily trend
                // Endpoint: /api/analytics/course/:courseId/student/:studentId?days=30
                const res = await api.get(`/analytics/course/${courseId}/student/${student.id}`, {
                    params: { days }
                });
                if (res.data.success) {
                    const data = res.data.data;
                    const chartData = data.dates.map((d, i) => ({
                        date: new Date(d).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
                        completionRate: data.completionRate[i]
                    }));
                    setTrend(chartData);
                }
            } catch (error) {
                console.error("Fetch student trend error", error);
            } finally {
                setLoading(false);
            }
        };

        if (student && courseId) {
            fetchStudentTrend();
        }
    }, [courseId, student, days]);

    if (!student) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.studentInfo}>
                        {student.avatar ? (
                            <img src={student.avatar} alt="" className={styles.avatar} />
                        ) : (
                            <div className={styles.avatar}>
                                {student.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h3>{student.name}</h3>
                            <span className={styles.email}>{student.email}</span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <h4>Completion Rate (Last {days} days)</h4>
                    {loading ? (
                        <div className={styles.loading}>Loading chart...</div>
                    ) : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={trend} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="studentCompletion" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        formatter={(value) => [`${value}%`, 'Completion']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="completionRate"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#studentCompletion)"
                                        name="Completion %"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAnalyticsModal;
