import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import styles from "./Register.module.css";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    const dobString = (formData.year && formData.month && formData.day) 
      ? `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`
      : null;

    try {
      //Gọi API Register
      const res = await register({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        dateOfBirth: dobString,
      });

      if (res.success) {
        //Đăng ký thành công -> Chuyển hướng sang trang Login
        navigate("/login");
      } else {
        setError(res.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      setError("Lỗi kết nối server. Vui lòng kiểm tra lại mạng.");
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
            className={styles.input}
            placeholder="Nguyen Van A"
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
            placeholder="example@email.com"
            required
          />
        </div>

        {/* Phân Role gv và hs */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Ngày sinh</label>
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
        Đã có tài khoản?{" "}
        <Link to="/login" className={styles.link}>
          Đăng nhập ngay!
        </Link>
      </p>
    </div>
  );
}

export default Register;