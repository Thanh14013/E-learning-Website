import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./login.module.css";

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

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className={styles.divider}>
        <span></span>
        <p>Or continue with</p>
        <span></span>
      </div>

      <div className={styles.googleContainer}>
        {googleClientId ? (
          <div ref={googleButtonRef} className={styles.googleButton} />
        ) : (
          <p className={styles.helper}>
            Google login is not configured. Please set VITE_GOOGLE_CLIENT_ID.
          </p>
        )}
      </div>

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