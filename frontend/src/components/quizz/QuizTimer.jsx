import React, { useState, useEffect, useRef, useCallback } from 'react';
import './QuizTimer.css';

const QuizTimer = ({
  duration, // Duration in minutes
  onTimeExpired,
  onWarning, // Callback when warning threshold is reached
  warningThresholds = [60, 30, 15, 5], // Warning thresholds in seconds
  serverTimeOffset = 0, // Time difference from server (in seconds)
  isPaused = false,
  onTimeUpdate, // Callback to sync time
  className = ''
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const hasExpiredRef = useRef(false);
  const hasWarnedRef = useRef(new Set()); // Track which warnings have been shown

  // Calculate initial time with server offset
  const getInitialTime = useCallback(() => {
    return duration * 60 + serverTimeOffset;
  }, [duration, serverTimeOffset]);

  useEffect(() => {
    setTimeRemaining(getInitialTime());
    hasWarnedRef.current = new Set();
    setIsExpired(false);
    hasExpiredRef.current = false;
  }, [duration, getInitialTime]);

  useEffect(() => {
    if (isPaused || isExpired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up interval to update timer every second
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = prevTime - 1;

        // Check for warnings
        warningThresholds.forEach((threshold) => {
          if (
            newTime <= threshold &&
            newTime > threshold - 1 &&
            !hasWarnedRef.current.has(threshold)
          ) {
            hasWarnedRef.current.add(threshold);
            if (onWarning) {
              onWarning(newTime, threshold);
            }
          }
        });

        // Check if time expired
        if (newTime <= 0 && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          setIsExpired(true);
          if (onTimeExpired) {
            onTimeExpired();
          }
          return 0;
        }

        // Sync with server periodically (every 10 seconds)
        if (onTimeUpdate && newTime % 10 === 0 && newTime > 0) {
          // Optional: sync with server
        }

        return Math.max(0, newTime);
      });
    }, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, isExpired, warningThresholds, onWarning, onTimeExpired, onTimeUpdate]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (isExpired || timeRemaining === 0) {
      return 'expired';
    }
    if (timeRemaining <= 300) {
      // 5 minutes or less - red
      return 'critical';
    }
    if (timeRemaining <= 900) {
      // 15 minutes or less - yellow
      return 'warning';
    }
    return 'normal';
  };

  // Get warning message based on remaining time
  const getWarningMessage = () => {
    if (isExpired) {
      return 'Time expired!';
    }
    if (timeRemaining <= 60) {
      return 'Less than 1 minute remaining!';
    }
    if (timeRemaining <= 300) {
      return 'Less than 5 minutes remaining!';
    }
    if (timeRemaining <= 900) {
      return 'Less than 15 minutes remaining!';
    }
    return null;
  };

  const timerColor = getTimerColor();
  const warningMessage = getWarningMessage();
  const isCritical = timeRemaining <= 300 && !isExpired;

  return (
    <div className={`quiz-timer-container ${className}`}>
      <div className={`quiz-timer ${timerColor} ${isCritical ? 'pulse' : ''}`}>
        <div className="quiz-timer-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="quiz-timer-content">
          <div className="quiz-timer-label">Time Remaining</div>
          <div className={`quiz-timer-display ${timerColor}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {warningMessage && (
        <div className={`quiz-timer-warning ${timerColor}`}>
          <div className="warning-icon">⚠</div>
          <div className="warning-text">{warningMessage}</div>
        </div>
      )}

      {isExpired && (
        <div className="quiz-timer-expired">
          <div className="expired-icon">⏰</div>
          <div className="expired-text">Time's up! Quiz will be submitted automatically.</div>
        </div>
      )}
    </div>
  );
};

export default QuizTimer;

