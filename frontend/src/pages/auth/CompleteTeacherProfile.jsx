import React, { useState } from "react";
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
    const [cvFile, setCvFile] = useState(null);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (file.type !== "application/pdf") {
                setError("Chỉ chấp nhận file PDF");
                setCvFile(null);
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError("File không được vượt quá 5MB");
                setCvFile(null);
                return;
            }
            setCvFile(file);
            setError("");
        }
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
            setError("Vui lòng điền đầy đủ thông tin");
            return;
        }

        if (!cvFile) {
            setError("Vui lòng upload CV của bạn");
            return;
        }

        setLoading(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("phone", formData.phone);
            formDataToSend.append("address", formData.address);
            formDataToSend.append("bio", formData.bio);
            formDataToSend.append("expertise", formData.expertise);
            formDataToSend.append("qualifications", formData.qualifications);
            formDataToSend.append("cv", cvFile);

            const response = await api.post(
                "/users/complete-teacher-profile",
                formDataToSend,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.success) {
                toastService.success(response.data.message);
                navigate("/teacher/approval-pending");
            }
        } catch (err) {
            console.error("Error completing profile:", err);
            setError(
                err.response?.data?.message ||
                "Có lỗi xảy ra khi gửi thông tin. Vui lòng thử lại."
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
                    Vui lòng điền đầy đủ thông tin để hoàn tất đăng ký giáo viên
                </p>

                {error && <p className={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Số điện thoại *</label>
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
                            placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Giới thiệu bản thân *</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className={styles.textarea}
                            placeholder="Giới thiệu ngắn về bản thân..."
                            rows="4"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Chuyên môn *</label>
                        <textarea
                            name="expertise"
                            value={formData.expertise}
                            onChange={handleChange}
                            className={styles.textarea}
                            placeholder="Lĩnh vực chuyên môn của bạn (ví dụ: Lập trình Web, Machine Learning...)"
                            rows="3"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Bằng cấp & Chứng chỉ *</label>
                        <textarea
                            name="qualifications"
                            value={formData.qualifications}
                            onChange={handleChange}
                            className={styles.textarea}
                            placeholder="Liệt kê các bằng cấp, chứng chỉ có liên quan..."
                            rows="3"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Upload CV (PDF) *</label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                            required
                        />
                        {cvFile && (
                            <p className={styles.fileName}>File đã chọn: {cvFile.name}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? "Đang gửi..." : "Nộp hồ sơ"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteTeacherProfile;
