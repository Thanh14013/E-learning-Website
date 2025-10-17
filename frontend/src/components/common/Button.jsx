import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  className = '',
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    danger: 'btn--danger',
    outline: 'btn--outline'
  };
  const sizeClasses = {
    small: 'btn--small',
    medium: 'btn--medium',
    large: 'btn--large'
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? 'btn--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };

