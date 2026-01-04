import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./login.module.css";
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

  useEffect(() => {
    if (!googleClientId) return;

    const existingScript = document.getElementById("google-identity-script");

    const handleLoad = () => {
      setGoogleReady(true);
    };

    if (existingScript) {
      if (existingScript.getAttribute("data-loaded") === "true") {
        setGoogleReady(true);
        return;
      }
      existingScript.addEventListener("load", handleLoad);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.id = "google-identity-script";
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      setGoogleReady(true);
    };
    script.onerror = () => {
      setError("Không thể tải Google SSO. Vui lòng thử lại sau.");
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [googleClientId]);

  useEffect(() => {
    if (!googleReady || !googleClientId || !googleButtonRef.current) return;
    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => handleGoogleCredential(response),
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      type: "standard",
      shape: "pill",
      text: "continue_with",
    });
  }, [googleReady, googleClientId]);

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
      const res = await login(email, password);

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

  const handleGoogleLogin = () => {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt();
    } else {
      setError("Google SSO is not ready. Please try again.");
    }
  };

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

        <div className={styles.googleContainer}>
          <button onClick={handleGoogleLogin} className={styles.googleBtn}>
            <FcGoogle className={styles.googleIcon} />
            Continue with Google
          </button>
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