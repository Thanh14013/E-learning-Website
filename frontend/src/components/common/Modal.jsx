import React, { useEffect } from 'react';
import './Modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium',
    closeOnOverlayClick = true,
    showCloseButton = true,
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    const sizeClasses = {
        small: 'modal-content--small',
        medium: 'modal-content--medium',
        large: 'modal-content--large',
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-content ${sizeClasses[size]}`}>
                {(title || showCloseButton) && (
                    <div className="modal-header">
                        {title && <h3 className="modal-title">{title}</h3>}
                        {showCloseButton && (
                            <button
                                className="modal-close-button"
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
};

export { Modal };
