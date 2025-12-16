import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./auth.module.css";

const TeacherApprovalPending = () => {
    const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate("/");
    };

    return (
        <div className={styles.container}>
            <div className={styles.verificationBox}>
                <div className={styles.iconWrapper}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={styles.icon}
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <h1 className={styles.title}>Hồ Sơ Đang Được Xét Duyệt</h1>
                <p className={styles.message}>
                    Cảm ơn bạn đã nộp hồ sơ giáo viên!
                </p>
                <p className={styles.subMessage}>
                    Hồ sơ của bạn đang được xem xét bởi đội ngũ quản trị. Quá trình này có thể mất từ <strong>24-48 giờ</strong>.
                </p>
                <p className={styles.subMessage}>
                    Chúng tôi sẽ gửi email thông báo cho bạn ngay khi hồ sơ được phê duyệt hoặc từ chối.
                </p>
                <button onClick={handleBackToHome} className={styles.button}>
                    Về trang chủ
                </button>
            </div>
        </div>
    );
};

export default TeacherApprovalPending;
