import React, { useState } from 'react';
import QuizTimer from '../components/quizz/QuizTimer';
import { Button } from '../components/common/Button';
import './QuizTimerDemo.css';

const QuizTimerDemo = () => {
  const [duration, setDuration] = useState(10); // 10 minutes for demo
  const [isPaused, setIsPaused] = useState(false);
  const [warningLog, setWarningLog] = useState([]);
  const [expired, setExpired] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const handleTimeExpired = () => {
    setExpired(true);
    setIsPaused(true);
    alert('Time expired! Quiz will be submitted automatically.');
  };

  const handleWarning = (remainingTime, threshold) => {
    const message = `Warning: ${Math.floor(remainingTime / 60)} minutes remaining (${threshold}s threshold)`;
    setWarningLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), message }]);
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Quiz Timer Warning', {
        body: message,
        icon: '/vite.svg'
      });
    }
  };

  const handleReset = () => {
    setDuration(10);
    setIsPaused(false);
    setExpired(false);
    setWarningLog([]);
    setServerTimeOffset(0);
  };

  const handlePauseToggle = () => {
    setIsPaused((prev) => !prev);
  };

  const handleSyncTime = () => {
    // Simulate server time sync
    // In real app, this would call an API to get server time
    const mockServerOffset = Math.floor(Math.random() * 60) - 30; // ±30 seconds
    setServerTimeOffset(mockServerOffset);
    alert(`Time synced with server. Offset: ${mockServerOffset > 0 ? '+' : ''}${mockServerOffset}s`);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          alert('Notification permission granted!');
        }
      });
    }
  };

  return (
    <div className="quiz-timer-demo">
      <div className="demo-header">
        <h1>Quiz Timer Component Demo</h1>
        <p>This demo showcases the Quiz Timer component with all required features:</p>
        <ul className="feature-list">
          <li>✅ Display countdown timer</li>
          <li>✅ Change color as time runs low (yellow, red)</li>
          <li>✅ Auto-submit when time expires</li>
          <li>✅ Warning before submission</li>
          <li>✅ Time sync with backend</li>
        </ul>
      </div>

      <div className="demo-controls">
        <div className="control-group">
          <label>
            Duration (minutes):
            <input
              type="number"
              min="1"
              max="60"
              value={duration}
              onChange={(e) => {
                setDuration(parseInt(e.target.value) || 1);
                setExpired(false);
                setWarningLog([]);
              }}
              className="control-input"
              disabled={!isPaused && !expired}
            />
          </label>
        </div>

        <div className="control-buttons">
          <Button
            variant={isPaused ? 'primary' : 'secondary'}
            onClick={handlePauseToggle}
            disabled={expired}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </Button>

          <Button variant="outline" onClick={handleReset}>
            🔄 Reset
          </Button>

          <Button variant="outline" onClick={handleSyncTime}>
            🔗 Sync Time
          </Button>

          <Button variant="outline" onClick={requestNotificationPermission}>
            🔔 Enable Notifications
          </Button>
        </div>
      </div>

      <div className="demo-content">
        {/* Standard Timer */}
        <div className="demo-section">
          <h2>Standard Timer</h2>
          <QuizTimer
            duration={duration}
            onTimeExpired={handleTimeExpired}
            onWarning={handleWarning}
            warningThresholds={[300, 180, 60, 30]} // 5min, 3min, 1min, 30sec
            serverTimeOffset={serverTimeOffset}
            isPaused={isPaused}
          />
        </div>

        {/* Compact Timer */}
        <div className="demo-section">
          <h2>Compact Timer</h2>
          <QuizTimer
            duration={duration}
            onTimeExpired={handleTimeExpired}
            onWarning={handleWarning}
            warningThresholds={[300, 180, 60, 30]}
            serverTimeOffset={serverTimeOffset}
            isPaused={isPaused}
            className="compact"
          />
        </div>

        {/* Inline Timer */}
        <div className="demo-section">
          <h2>Inline Timer (Header Style)</h2>
          <div className="inline-timer-demo">
            <div className="demo-header-mock">
              <div>Quiz Title</div>
              <QuizTimer
                duration={duration}
                onTimeExpired={handleTimeExpired}
                onWarning={handleWarning}
                warningThresholds={[300, 180, 60, 30]}
                serverTimeOffset={serverTimeOffset}
                isPaused={isPaused}
                className="inline"
              />
            </div>
          </div>
        </div>

        {/* Warning Log */}
        {warningLog.length > 0 && (
          <div className="demo-section">
            <h2>Warning Log</h2>
            <div className="warning-log">
              {warningLog.map((log, index) => (
                <div key={index} className="warning-log-item">
                  <span className="log-time">{log.time}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="demo-section">
          <h2>Timer Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <strong>Status:</strong>
              <span className={expired ? 'status-expired' : isPaused ? 'status-paused' : 'status-running'}>
                {expired ? '⏰ Expired' : isPaused ? '⏸ Paused' : '▶ Running'}
              </span>
            </div>
            <div className="status-item">
              <strong>Duration:</strong>
              <span>{duration} minutes</span>
            </div>
            <div className="status-item">
              <strong>Server Offset:</strong>
              <span>{serverTimeOffset > 0 ? '+' : ''}{serverTimeOffset}s</span>
            </div>
            <div className="status-item">
              <strong>Warnings:</strong>
              <span>{warningLog.length}</span>
            </div>
          </div>
        </div>

        {/* Color States Demo */}
        <div className="demo-section">
          <h2>Color States Demo</h2>
          <div className="color-states-grid">
            <div className="color-state-item">
              <div className="color-label">Normal (&gt; 15 min)</div>
              <QuizTimer duration={20} isPaused={true} className="compact" />
            </div>
            <div className="color-state-item">
              <div className="color-label">Warning (5-15 min)</div>
              <QuizTimer duration={10} isPaused={true} className="compact" />
            </div>
            <div className="color-state-item">
              <div className="color-label">Critical (&lt; 5 min)</div>
              <QuizTimer duration={3} isPaused={true} className="compact" />
            </div>
            <div className="color-state-item">
              <div className="color-label">Expired</div>
              <QuizTimer duration={0} isPaused={true} className="compact" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTimerDemo;

