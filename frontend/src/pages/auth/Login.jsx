import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Login.module.css";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const from = location.state?.from?.pathname || "/dashboard";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);

  /* Refactored Google Login (GSI v2) */
  useEffect(() => {
    if (!googleClientId) return;

    // 1. Load the GSI script if not present
    const loadScript = () => {
      if (document.getElementById("google-gsi-script")) {
        setGoogleReady(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client?hl=en";
      script.async = true;
      script.defer = true;
      script.id = "google-gsi-script";
      script.onload = () => setGoogleReady(true);
      script.onerror = () => setError("Failed to load Google Sign-In");
      document.body.appendChild(script);
    };

    loadScript();
  }, [googleClientId]);

  /* Handlers */
  const handlePostLogin = (user) => {
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

      const teacherTarget = from.startsWith("/teacher") ? from : "/teacher/dashboard";
      navigate(teacherTarget, { replace: true });
      return;
    }

    navigate(from, { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password, ['student', 'teacher']);

      if (res.success) {
        handlePostLogin(res.user);
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err) {
      setError("A system error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response) => {
    if (!response?.credential) {
      setError("Google login failed. Please try again.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await loginWithGoogle(response.credential);

      if (res.success) {
        handlePostLogin(res.user);
      } else {
        setError(res.message || "Google login failed");
      }
    } catch (err) {
      setError("A system error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 2. Initialize and Render Button when script & ID are ready
    if (!googleReady || !googleClientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        // ux_mode: "popup", // Default
      });

      // Render the standard Google button
      // This is required for "Sign In with Google" (ID Token) flow
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "filled_blue",
          size: "large",
          type: "standard",
          shape: "pill",
          text: "signin_with",
          logo_alignment: "left"
        });
      }
    } catch (err) {
      console.error("GSI Init Error:", err);
    }
  }, [googleReady, googleClientId]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue your learning journey</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
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
              placeholder="Enter your password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.loginBtn} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.divider}>or</div>

        {/* Standard Google Button Container */}
        <div className={styles.googleContainer} style={{ display: 'flex', justifyContent: 'center' }}>
          <div ref={googleButtonRef} />
        </div>

        <p className={styles.registerText}>
          Don't have an account?
          <Link to="/register" className={styles.registerLink}>
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );


};

export default Login;