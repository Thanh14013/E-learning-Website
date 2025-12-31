import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "../auth/auth.module.css";

const AdminLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState("admin@admin.com");
    const [password, setPassword] = useState("Admin123");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await login(email, password);

            if (res.success && res.user?.role === "admin") {
                const redirectTo = location.state?.from?.pathname || "/admin/dashboard";
                navigate(redirectTo, { replace: true });
            } else {
                setError("Only admin accounts can sign in here.");
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h1 className={styles.title}>Admin Login</h1>
                <p className={styles.subtitle}>Sign in with your admin credentials.</p>

                {error && <p className={styles.error}>{error}</p>}

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input
                            type="email"
                            name="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={styles.button} disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className={styles.helper} style={{ marginTop: "12px" }}>
                    Need the student/teacher login? <Link to="/login">Go to user login</Link>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
