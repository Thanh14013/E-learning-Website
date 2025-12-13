import React from 'react';
import './Loading.css';

const Loading = ({ size = 'medium', fullScreen = false, text = '' }) => {
    const sizeClasses = {
        small: 'spinner--small',
        medium: 'spinner--medium',
        large: 'spinner--large',
    };

    const spinner = (
        <div className={`spinner ${sizeClasses[size]}`}>
            <div className="spinner-circle"></div>
            {text && <p className="spinner-text">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="loading-fullscreen">
                {spinner}
            </div>
        );
    }

    return spinner;
};

export { Loading };
