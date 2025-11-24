import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './auth.module.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');
        try {
            // kết nối api quên mật khẩu ở đây
            await api.post('/auth/forgot-password', { email });
            setMessage('If an account with that email exists, a password reset link has been sent.');
            setEmail('');
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <h1 className={styles.title}>Forgot Password</h1>
                <p className={styles.subtitle}>Enter your email and we'll send you a link to reset it.</p>
                {message && <p className={styles.successMessage}>{message}</p>}
                {error && <p className={styles.errorMessage}>{error}</p>}
                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input
                                type="email" id="email" className="form-input" value={email}
                                onChange={(e) => setEmail(e.target.value)} required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary-student" disabled={loading} style={{width: '100%', marginTop: '1rem'}}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
                <div className={styles.footerLinks}>
                    <Link to="/login">← Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;