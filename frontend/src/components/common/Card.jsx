import React from 'react';
import './Card.css';

const Card = ({
    children,
    className = '',
    hover = false,
    onClick,
    title,
    footer,
    noPadding = false,
}) => {
    const cardClasses = [
        'card',
        hover ? 'card--hover' : '',
        onClick ? 'card--clickable' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={cardClasses} onClick={onClick}>
            {title && (
                <div className="card-header">
                    <h3 className="card-title">{title}</h3>
                </div>
            )}
            <div className={noPadding ? 'card-body--no-padding' : 'card-body'}>
                {children}
            </div>
            {footer && <div className="card-footer">{footer}</div>}
        </div>
    );
};

export { Card };
