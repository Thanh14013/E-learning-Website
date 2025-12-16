import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./auth.module.css";

const EmailVerificationRequired = () => {
    const navigate = useNavigate();

    const handleBackToLogin = () => {
        navigate("/login");
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
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </div>
                <h1 className={styles.title}>Email Verification Required</h1>
                <p className={styles.message}>
                    Bạn cần xác nhận email của mình trước khi có thể tiếp tục.
                </p>
                <p className={styles.subMessage}>
                    Vui lòng kiểm tra hộp thư đến (hoặc thư mục spam) và nhấp vào liên kết xác nhận trong email chúng tôi đã gửi cho bạn.
                </p>
                <button onClick={handleBackToLogin} className={styles.button}>
                    Quay lại đăng nhập
                </button>
            </div>
        </div>
    );
};

export default EmailVerificationRequired;
