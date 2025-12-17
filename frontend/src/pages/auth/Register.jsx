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
  const [fieldErrors, setFieldErrors] = useState({});
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
      setError("Password confirmation does not match.");
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    const dobString = (formData.year && formData.month && formData.day)
      ? `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`
      : null;

    try {
      // Call API Register
      const res = await register({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        dateOfBirth: dobString,
      });

      if (res.success) {
        // Successful registration: redirect to login (no auto-login)
        // Show a single, clear success toast
        import("../../services/toastService").then(({ default: toast }) => {
          toast.success("Registration successful! Please log in.");
        });
        navigate("/login");
      } else {
        // Show validation errors or a single message
        if (res.validationErrors) {
          // res.validationErrors can be array [{field,message}] or object {field: messages}
          const fieldErrs = {};
          if (Array.isArray(res.validationErrors)) {
            res.validationErrors.forEach((e) => {
              const f = e.field || e.param || "_general";
              fieldErrs[f] = e.message || "Invalid";
            });
          } else if (typeof res.validationErrors === "object") {
            Object.entries(res.validationErrors).forEach(([k, v]) => {
              fieldErrs[k] = Array.isArray(v) ? v.join(", ") : String(v);
            });
          }
          setFieldErrors(fieldErrs);
          setError(res.message || "Please check the fields.");
        } else {
          setError(res.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred. Please try again later.");
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
          {fieldErrors.fullName && <p className={styles.fieldError}>{fieldErrors.fullName}</p>}
          {fieldErrors.name && <p className={styles.fieldError}>{fieldErrors.name}</p>}
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
          {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
        </div>

        {/* Phân Role gv và hs */}
        <div className={styles.formGroup}>
          <div className={styles.radioGroup}>
            <label className={styles.label}>I am a:</label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="role"
                value="student"
                checked={formData.role === "student"}
                onChange={handleChange}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>Student</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="role"
                value="teacher"
                checked={formData.role === "teacher"}
                onChange={handleChange}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>Teacher</span>
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Date Of Birth</label>
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
            {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
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
        Already have an account?{" "}
        <Link to="/login" className={styles.link}>
          Login now!
        </Link>
      </p>
    </div>
  );
}

export default Register;