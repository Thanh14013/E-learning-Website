import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./login.module.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);

      if (res.success) {
        const { user } = res;

        // Check for teacher profile completion
          if (user.role === "teacher") {
          if (!user.profileCompleted) {
            navigate("/teacher/complete-profile");
            return;
          }
          if (user.profileApprovalStatus === "pending") {
            navigate("/teacher/approval-pending");
            return;
          }
          if (user.profileApprovalStatus === "rejected") {
            setError("Your profile has been rejected. Please contact the administrator.");
            return;
          }
        }

        // Redirect to dashboard if all checks pass
        navigate(from, { replace: true });
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err) {
      setError("A system error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Login Page</h1>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
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
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            name="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className={styles.forgotPasswordContainer}>
          <Link to="/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className={styles.switchText}>
        Don't have an account?{" "}
        { }
        <Link to="/register" className={styles.link}>
          Register now!
        </Link>
      </p>
    </div>
  );
};

export default Login;