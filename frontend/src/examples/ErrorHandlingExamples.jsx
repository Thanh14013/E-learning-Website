/**
 * Example Usage of Error Handling System
 * This file demonstrates how to use the error handling utilities
 */

import { useState } from 'react';
import toastService from '../services/toastService';
import { validateEmail, validatePassword, validatePasswordConfirmation } from '../utils/validators';
import api from '../services/api';

/**
 * Example: Login Form with Error Handling
 */
export const LoginExample = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setErrors({});

        // Validate fields
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password, { minLength: 6 });

        if (!emailValidation.isValid || !passwordValidation.isValid) {
            setErrors({
                email: emailValidation.error,
                password: passwordValidation.error,
            });
            toastService.error('Vui lòng kiểm tra lại thông tin đăng nhập');
            return;
        }

        // Submit form
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            toastService.success('Đăng nhập thành công!');
            console.log('User data:', response.data);
        } catch (error) {
            // Error is already handled by api interceptor
            // Additional component-specific handling can be done here
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
                {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
        </form>
    );
};

/**
 * Example: Register Form with Error Handling
 */
export const RegisterExample = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate email
        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.error;
        }

        // Validate password
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.error;
        }

        // Validate password confirmation
        const confirmValidation = validatePasswordConfirmation(
            formData.password,
            formData.confirmPassword
        );
        if (!confirmValidation.isValid) {
            newErrors.confirmPassword = confirmValidation.error;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toastService.error('Vui lòng kiểm tra lại thông tin đăng ký');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            toastService.success('Đăng ký thành công!');
            console.log('User registered:', response.data);
        } catch (error) {
            // Error is already handled by api interceptor
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Họ và tên"
                />
                {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                />
                {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                />
                {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Xác nhận mật khẩu"
                />
                {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
        </form>
    );
};

/**
 * Example: Manual Toast Notifications
 */
export const ToastExamples = () => {
    return (
        <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
            <button onClick={() => toastService.success('Thao tác thành công!')}>
                Success Toast
            </button>

            <button onClick={() => toastService.error('Đã xảy ra lỗi!')}>
                Error Toast
            </button>

            <button onClick={() => toastService.warning('Cảnh báo!')}>
                Warning Toast
            </button>

            <button onClick={() => toastService.info('Thông tin hữu ích')}>
                Info Toast
            </button>

            <button onClick={() => {
                const loadingToast = toastService.loading('Đang tải...');
                setTimeout(() => {
                    toastService.dismiss(loadingToast);
                    toastService.success('Tải xong!');
                }, 2000);
            }}>
                Loading Toast
            </button>

            <button onClick={() => {
                const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        Math.random() > 0.5 ? resolve() : reject(new Error('Failed!'));
                    }, 2000);
                });

                toastService.promise(promise, {
                    loading: 'Đang xử lý...',
                    success: 'Xử lý thành công!',
                    error: 'Xử lý thất bại!',
                });
            }}>
                Promise Toast
            </button>
        </div>
    );
};

/**
 * Example: API Error Handling
 */
export const ApiErrorExample = () => {
    const [loading, setLoading] = useState(false);

    const testNetworkError = async () => {
        setLoading(true);
        try {
            // This will trigger a network error
            await api.get('http://localhost:9999/non-existent');
        } catch (error) {
            console.error('Network error:', error);
        } finally {
            setLoading(false);
        }
    };

    const test404Error = async () => {
        setLoading(true);
        try {
            await api.get('/non-existent-endpoint');
        } catch (error) {
            console.error('404 error:', error);
        } finally {
            setLoading(false);
        }
    };

    const test401Error = async () => {
        setLoading(true);
        try {
            // Clear token to trigger 401
            localStorage.removeItem('token');
            await api.get('/protected-route');
        } catch (error) {
            console.error('401 error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
            <button onClick={testNetworkError} disabled={loading}>
                Test Network Error
            </button>

            <button onClick={test404Error} disabled={loading}>
                Test 404 Error
            </button>

            <button onClick={test401Error} disabled={loading}>
                Test 401 Error
            </button>
        </div>
    );
};

export default {
    LoginExample,
    RegisterExample,
    ToastExamples,
    ApiErrorExample,
};
