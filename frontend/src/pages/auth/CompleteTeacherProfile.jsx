import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import toastService from "../../services/toastService";
import styles from "./auth.module.css";

const CompleteTeacherProfile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: "",
        address: "",
        bio: "",
        expertise: "",
        qualifications: "",
    });
    const [error, setError] = useState("");

    // Redirect if profile is already completed
    useEffect(() => {
        if (user?.profileCompleted) {
            navigate("/teacher/dashboard");
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validate all fields
        if (
            !formData.phone ||
            !formData.address ||
            !formData.bio ||
            !formData.expertise ||
            !formData.qualifications
        ) {
            setError("Please fill in all required fields");
            return;
        }

        setLoading(true);

        try {
            // No need for FormData anymore since we aren't uploading files
            // But detailed implementation suggests backend still expects json body or we can keep FormData logic but without file
            // The backend uses req.body for fields, so we can send JSON or FormData (multer handles text fields too)
            // To be safe and minimal change, we can switch to JSON or keep FormData. 
            // The backend controller receives req.body. Let's send a simple JSON object to clean it up.

            // Wait, previous backend code used multer which expects multipart/form-data for text fields too if configured that way.
            // Let's stick to JSON since we removed the file upload logic in backend controller?
            // Actually, backend controller extracts fields from req.body. Express body-parser (or express.json()) handles JSON. 
            // Multer also populates req.body for multipart forms.
            // Let's toggle to JSON for cleaner code since no file is sent.

            const response = await api.post(
                "/users/complete-teacher-profile",
                formData
            );

            if (response.data.success) {
                toastService.success(response.data.message);
                navigate("/teacher/approval-pending");
            }
        } catch (err) {
            console.error("Error completing profile:", err);
            setError(
                err.response?.data?.message ||
                "An error occurred while submitting. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h1 className={styles.title}>Complete Your Teacher Profile</h1>
                <p className={styles.subtitle}>
                    Please complete all information to finish teacher registration
                </p>

                {error && <p className={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Phone *</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="0123456789"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Địa chỉ *</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="123 Example St, City, Country"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Short Bio *</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className={styles.textarea}
                            placeholder="Briefly introduce yourself..."
                            rows="4"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Expertise *</label>
                        <textarea
                            name="expertise"
                            value={formData.expertise}
                            onChange={handleChange}
                            className={styles.textarea}
                            placeholder="Your areas of expertise (e.g., Web Development, Machine Learning...)"
                            rows="3"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Qualifications & Certificates *</label>
                        <textarea
                            name="qualifications"
                            value={formData.qualifications}
                            onChange={handleChange}
                            className={styles.textarea}
                            placeholder="List relevant degrees and certificates..."
                            rows="3"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit profile"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteTeacherProfile;
