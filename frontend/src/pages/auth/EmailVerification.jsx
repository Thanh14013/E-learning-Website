import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Loading } from '../../components/common/Loading';
import toastService from '../../services/toastService';
import './auth.module.css';

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
    const [message, setMessage] = useState('Đang xác thực email của bạn...');
    const [resending, setResending] = useState(false);

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Liên kết xác thực không hợp lệ.');
            return;
        }

        verifyEmail(token);
    }, [token]);

    const verifyEmail = async (verificationToken) => {
        try {
            const response = await api.post('/auth/verify-email', {
                token: verificationToken,
            });

            setStatus('success');
            setMessage('Email đã được xác thực thành công!');
            toastService.success('Email đã được xác thực thành công!');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            if (error.response?.status === 400) {
                setStatus('expired');
                setMessage('Liên kết xác thực đã hết hạn hoặc không hợp lệ.');
            } else {
                setStatus('error');
                setMessage(error.message || 'Có lỗi xảy ra khi xác thực email.');
            }
        }
    };

    const handleResendVerification = async () => {
        setResending(true);
        try {
            await api.post('/auth/resend-verification');
            toastService.success('Email xác thực mới đã được gửi!');
            setMessage('Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
        } catch (error) {
            toastService.error(error.message || 'Không thể gửi lại email xác thực.');
        } finally {
            setResending(false);
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <div className="verification-container">
                        <Loading size="large" text={message} />
                    </div>
                );

            case 'success':
                return (
                    <div className="verification-container">
                        <div className="verification-icon verification-icon--success">✓</div>
                        <h2 className="verification-title">Xác thực thành công!</h2>
                        <p className="verification-message">{message}</p>
                        <p className="verification-redirect">Đang chuyển hướng đến trang đăng nhập...</p>
                    </div>
                );

            case 'expired':
                return (
                    <div className="verification-container">
                        <div className="verification-icon verification-icon--error">⚠</div>
                        <h2 className="verification-title">Liên kết đã hết hạn</h2>
                        <p className="verification-message">{message}</p>
                        <button
                            onClick={handleResendVerification}
                            disabled={resending}
                            className="btn btn-primary-student"
                        >
                            {resending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-secondary"
                            style={{ marginTop: '1rem' }}
                        >
                            Quay lại đăng nhập
                        </button>
                    </div>
                );

            case 'error':
                return (
                    <div className="verification-container">
                        <div className="verification-icon verification-icon--error">✕</div>
                        <h2 className="verification-title">Xác thực thất bại</h2>
                        <p className="verification-message">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-primary-student"
                        >
                            Quay lại đăng nhập
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {renderContent()}
            </div>
        </div>
    );
};

export default EmailVerification;
