import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import styles from './auth.module.css';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Passwords do not match.");
        if (password.length < 6) return setError("Password must be at least 6 characters long.");
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await api.put(`/auth/reset-password/${token}`, { password });
            setMessage('Password reset successfully! Logging you in...');
            
            // Tự động đăng nhập bằng dữ liệu trả về từ backend
            setAuthData(res.data);

            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <h1 className={styles.title}>Reset Your Password</h1>
                
                {message ? (
                    <p className={styles.successMessage}>{message}</p>
                ) : error ? (
                    <p className={styles.errorMessage}>{error}</p>
                ) : (
                    <p className={styles.subtitle}>Enter your new password below.</p>
                )}
                
                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password" value={password} className="form-input"
                                onChange={(e) => setPassword(e.target.value)} required
                            />
                        </div>
                        <div className="form-group" style={{marginTop: '1rem'}}>
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password" value={confirmPassword} className="form-input"
                                onChange={(e) => setConfirmPassword(e.target.value)} required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary-student" disabled={loading} style={{width: '100%', marginTop: '1.5rem'}}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
                <div className={styles.footerLinks}>
                    <Link to="/login">← Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;