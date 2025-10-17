import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./login.module.css";

const Login = () => {
  //đưa đến trang trước đó sau khi login thành công
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleLogin = (e) => {
    e.preventDefault();

    // Fake login
    const userData = { email: "user@example.com", name: "John Doe" };
    login(userData);

    navigate(from, { replace: true });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Login Page</h1>
      <form onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
          <input type="email" className={styles.input} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input type="password" className={styles.input} required />
        </div>

        <button type="submit" className={styles.button}>
          Login
        </button>
      </form>
            <p className={styles.switchText}>
              Don't have an account?{" "}
              <a href="/register" className={styles.link}>
                Sign up!
              </a>
            </p>
    </div>
  );
};

export default Login;
