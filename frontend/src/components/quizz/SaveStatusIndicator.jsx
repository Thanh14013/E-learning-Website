import React from 'react';
import './SaveStatusIndicator.css';

/**
 * SaveStatusIndicator Component
 * 
 * Displays the current save status of quiz answers
 * States: idle, saving, saved, error, syncing
 */
const SaveStatusIndicator = ({ status, isOnline, lastSaveTime, className = '' }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'saving':
        return {
          icon: '⏳',
          text: 'Đang lưu...',
          className: 'status-saving',
          color: '#F59E0B'
        };
      case 'saved':
        return {
          icon: '✓',
          text: 'Đã lưu',
          className: 'status-saved',
          color: '#10B981'
        };
      case 'error':
        return {
          icon: '⚠️',
          text: isOnline ? 'Lỗi lưu' : 'Mất kết nối',
          className: 'status-error',
          color: '#EF4444'
        };
      case 'syncing':
        return {
          icon: '🔄',
          text: 'Đang đồng bộ...',
          className: 'status-syncing',
          color: '#3B82F6'
        };
      case 'idle':
      default:
        return {
          icon: '',
          text: '',
          className: 'status-idle',
          color: 'transparent'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Don't show if idle
  if (status === 'idle') {
    return null;
  }

  const formatLastSaveTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes < 1) {
      return `vừa xong`;
    } else if (minutes < 60) {
      return `${minutes} phút trước`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours} giờ trước`;
    }
  };

  return (
    <div className={`save-status-indicator ${statusInfo.className} ${className}`}>
      <div className="save-status-content">
        {statusInfo.icon && (
          <span className="save-status-icon" style={{ color: statusInfo.color }}>
            {statusInfo.icon}
          </span>
        )}
        <span className="save-status-text" style={{ color: statusInfo.color }}>
          {statusInfo.text}
        </span>
        {status === 'saved' && lastSaveTime && (
          <span className="save-status-time">
            {formatLastSaveTime(lastSaveTime)}
          </span>
        )}
        {status === 'error' && !isOnline && (
          <span className="save-status-warning">
            Câu trả lời sẽ được lưu khi kết nối lại
          </span>
        )}
      </div>
    </div>
  );
};

export default SaveStatusIndicator;

