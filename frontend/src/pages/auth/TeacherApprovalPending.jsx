import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./auth.module.css";

const TeacherApprovalPending = () => {
    const navigate = useNavigate();

    const handleBackToHome = () => {
        navigate("/login", { replace: true });
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
                <h1 className={styles.title}>Profile Under Review</h1>
                <p className={styles.message}>
                    Thank you for submitting your teacher application!
                </p>
                <p className={styles.subMessage}>
                    Your profile is being reviewed by our admin team. This may take <strong>24-48 hours</strong>.
                </p>
                <p className={styles.subMessage}>
                    No email notifications are sent. Please come back and sign in to check your status.
                </p>
                <button onClick={handleBackToHome} className={styles.button}>
                    Back to home
                </button>
            </div>
        </div>
    );
};

export default TeacherApprovalPending;
