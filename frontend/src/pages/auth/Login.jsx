import React, { useState } from "react";
import { useNavigate, useLocation,Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./login.module.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";

  //thêm state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  day: "",
  month: "",
  year: "",
  role: "student",
});


const handleLogin = async (e) => {
  e.preventDefault();

  const email = e.target.email.value;
  const password = e.target.password.value;

  const res = await login(email, password);

if (res.success) {
  navigate("/"); // tất cả roles đều vào trang chủ web
} else {
  setError(res.message);
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
        Chưa có tài khoản?{" "}
        <a href="/register" className={styles.link}>
          Đăng ký ngay!
        </a>
      </p>
    </div>
  );
};

export default Login;
