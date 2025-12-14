import React from 'react';
import styles from './Testimonials.module.css';

const testimonialsData = [
    {
        id: 1,
        name: 'Nguyễn Văn A',
        role: 'Học viên IELTS',
        avatar: '👨‍🎓',
        rating: 5,
        comment: 'Khóa học rất tuyệt vời! Tôi đã cải thiện được 1.5 band điểm chỉ sau 3 tháng học. Giáo viên nhiệt tình, bài giảng dễ hiểu.',
        course: 'IELTS Speaking Master'
    },
    {
        id: 2,
        name: 'Trần Thị B',
        role: 'Sinh viên',
        avatar: '👩‍🎓',
        rating: 5,
        comment: 'Platform rất tiện lợi với video lessons, quizzes và feedback từ AI. Tôi đã đạt 7.5 IELTS Writing nhờ các bài tập và phản hồi chi tiết.',
        course: 'IELTS Writing Band 7+'
    },
    {
        id: 3,
        name: 'Lê Văn C',
        role: 'Nhân viên văn phòng',
        avatar: '👨‍💼',
        rating: 5,
        comment: 'Học online rất linh hoạt, phù hợp với lịch làm việc của tôi. Live sessions với giáo viên giúp tôi tự tin hơn rất nhiều.',
        course: 'IELTS Complete Package'
    },
    {
        id: 4,
        name: 'Phạm Thị D',
        role: 'Du học sinh',
        avatar: '👩‍🎓',
        rating: 5,
        comment: 'Cảm ơn các thầy cô! Tôi đã đạt band 8.0 và được nhận vào trường mơ ước. Discussion forum cũng rất hữu ích để trao đổi kinh nghiệm.',
        course: 'IELTS Band 8.0 Intensive'
    }
];

export default function Testimonials() {
    return (
        <section className={styles.testimonialsSection}>
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>Học viên nói gì về chúng tôi</h2>
                <p className={styles.sectionSubtitle}>
                    Hơn 10,000+ học viên đã tin tưởng và đạt kết quả với IELTS Hub
                </p>

                <div className={styles.testimonialsGrid}>
                    {testimonialsData.map((testimonial) => (
                        <div key={testimonial.id} className={styles.testimonialCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.avatarSection}>
                                    <div className={styles.avatar}>{testimonial.avatar}</div>
                                    <div className={styles.userInfo}>
                                        <h4 className={styles.userName}>{testimonial.name}</h4>
                                        <p className={styles.userRole}>{testimonial.role}</p>
                                    </div>
                                </div>
                                <div className={styles.rating}>
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <span key={i} className={styles.star}>⭐</span>
                                    ))}
                                </div>
                            </div>

                            <p className={styles.comment}>"{testimonial.comment}"</p>

                            <div className={styles.courseTag}>
                                <span>📚 {testimonial.course}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Section */}
                <div className={styles.statsSection}>
                    <div className={styles.statItem}>
                        <h3 className={styles.statNumber}>10,000+</h3>
                        <p className={styles.statLabel}>Học viên</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3 className={styles.statNumber}>500+</h3>
                        <p className={styles.statLabel}>Khóa học</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3 className={styles.statNumber}>98%</h3>
                        <p className={styles.statLabel}>Hài lòng</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3 className={styles.statNumber}>4.9/5</h3>
                        <p className={styles.statLabel}>Đánh giá</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
