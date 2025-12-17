import React from 'react';
import styles from './Testimonials.module.css';

const testimonialsData = [
    {
        id: 1,
        name: 'Denis Peter',
        role: 'Student',
        avatar: '👨‍🎓',
        rating: 5,
        comment: 'I improved my coding skills significantly with MasterDev. The interactive lessons and instant feedback helped me a lot!',
        course: 'Coding Mastery Bootcamp'
    },
    {
        id: 2,
        name: 'Michaela Smith',
        role: 'Student',
        avatar: '👩‍🎓',
        rating: 5,
        comment: 'The AI-powered feedback is amazing! It helped me identify my weaknesses and improve quickly. Highly recommend this platform to anyone looking to enhance their coding abilities.',
        course: 'Full-Stack Developer Program'
    },
    {
        id: 3,
        name: 'John Doe',
        role: 'Office Worker',
        avatar: '👨‍💼',
        rating: 5,
        comment: 'Online learning is very flexible, suitable for my work schedule. Live sessions with teachers have greatly boosted my confidence.',
        course: 'Professional Development Program'
    },
    {
        id: 4,
        name: 'Linda Lee',
        role: 'Onboarding Student',
        avatar: '👩‍🎓',
        rating: 5,
        comment: 'Completing the onboarding course was a breeze with MasterDev. The structured lessons and supportive community made it easy to get started and stay motivated.',
        course: 'Onboarding Success Course'
    }
];

export default function Testimonials() {
    return (
        <section className={styles.testimonialsSection}>
            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>What Our Students Say</h2>
                <p className={styles.sectionSubtitle}>
                    Over 10,000+ students have trusted and achieved results with MasterDev
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
                        <p className={styles.statLabel}>Students</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3 className={styles.statNumber}>500+</h3>
                        <p className={styles.statLabel}>Courses</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3 className={styles.statNumber}>98%</h3>
                        <p className={styles.statLabel}>Satisfaction</p>
                    </div>
                    <div className={styles.statItem}>
                        <h3 className={styles.statNumber}>4.9/5</h3>
                        <p className={styles.statLabel}>Rating</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
