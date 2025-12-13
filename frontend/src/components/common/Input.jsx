import React from 'react';
import './Input.css';

const Input = ({
    id,
    name,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    label,
    error,
    disabled = false,
    required = false,
    className = '',
    autoComplete,
    ...props
}) => {
    const inputId = id || name;

    return (
        <div className={`input-wrapper ${className}`}>
            {label && (
                <label htmlFor={inputId} className="form-label">
                    {label}
                    {required && <span className="required-asterisk">*</span>}
                </label>
            )}
            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                autoComplete={autoComplete}
                className={`form-input ${error ? 'form-input--error' : ''}`}
                {...props}
            />
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export { Input };
