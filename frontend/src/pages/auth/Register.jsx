import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import styles from "./register.module.css";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    day: "",
    month: "",
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Ghép lại thành ISO (backend dễ hiểu)
    const dob = `${formData.year}-${formData.month.padStart(2, "0")}-${formData.day.padStart(2, "0")}`;

    try {
      setLoading(true);
      // Gửi formData kèm ngày sinh
      const payload = { ...formData, dob };
      delete payload.day;
      delete payload.month;
      delete payload.year;


      // 🚀 Giả lập gọi API backend
      // const res = await api.post("/auth/register", formData);
      // const { user, token } = res.data;

      const user = { name: formData.name, email: formData.email, dob};
      const token = "fakeToken123";

      login(user, token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create Your Account</h1>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={styles.input } 
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        {/* ✅ Ngày/tháng/năm sinh */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Date of Birth</label>
          <div className={styles.dobGroup}>
            <input
              type="number"
              name="day"
              placeholder="DD"
              min="1"
              max="31"
              value={formData.day}
              onChange={handleChange}
              className={styles.dobInput}
              required
            />
            <input
              type="number"
              name="month"
              placeholder="MM"
              min="1"
              max="12"
              value={formData.month}
              onChange={handleChange}
              className={styles.dobInput}
              required
            />
            <input
              type="number"
              name="year"
              placeholder="YYYY"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.year}
              onChange={handleChange}
              className={styles.dobInput}
              required
            />
          </div>
        </div>

        {/* 🔐 Password */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* 🔐 Confirm Password */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Confirm Password</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Registering..." : "Sign Up"}
        </button>
      </form>

      <p className={styles.switchText}>
        Already have an account?{" "}
        <a href="/login" className={styles.link}>
          Login
        </a>
      </p>
    </div>
  );
};

export default Register;
