import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import styles from "./Register.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
    cv: null,
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
      // Call API Register (using FormData if CV is present or just to be consistent)
      const registerData = new FormData();
      registerData.append("fullName", formData.name);
      registerData.append("email", formData.email);
      registerData.append("password", formData.password);
      registerData.append("role", formData.role);
      if (dobString) registerData.append("dateOfBirth", dobString);

      if (formData.role === "teacher" && formData.cv) {
        registerData.append("cv", formData.cv);
      }

      // api.post handles Content-Type automatically when data is FormData
      const res = await register(registerData);

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
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>Join Us</h1>
        <p className={styles.subtitle}>Create your account to start learning</p>

        {error && <div className={styles.fieldError} style={{ textAlign: "center", marginBottom: "12px" }}>{error}</div>}

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
            {(fieldErrors.fullName || fieldErrors.name) && (
              <p className={styles.fieldError}>{fieldErrors.fullName || fieldErrors.name}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="name@example.com"
              required
            />
            {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>I am a:</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={formData.role === "student"}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                Student
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
                Teacher
              </label>
            </div>
          </div>

          {formData.role === "teacher" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Upload CV (PDF) <span style={{ fontSize: "0.8em", color: "#666" }}>(Recommended)</span>
              </label>
              <input
                type="file"
                name="cv"
                accept=".pdf"
                onChange={(e) => setFormData({ ...formData, cv: e.target.files[0] })}
                className={styles.input}
              />
              <p style={{ fontSize: "0.8rem", color: "#888", marginTop: "4px" }}>
                Only PDF files are accepted. Max size 5MB.
              </p>
            </div>
          )}

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
                className={`${styles.input} ${styles.dobInput}`}
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
                className={`${styles.input} ${styles.dobInput}`}
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
                className={`${styles.input} ${styles.dobInput}`}
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
                placeholder="Min. 8 characters"
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
                placeholder="Repeat password"
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?
          <Link to="/login" className={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;