import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './VideoPlayer.module.css';

/**
 * VideoPlayer Component
 * Custom HTML5 video player with full controls
 * Features: play/pause, progress bar, volume, playback speed, fullscreen
 */
const VideoPlayer = ({ videoUrl, title, onProgress, startTime = 0 }) => {
  // Refs
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);

  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // Refs for control hiding timeout
  const controlsTimeoutRef = useRef(null);

  /**
   * Initialize video player when component mounts
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set start time if provided
    if (startTime > 0) {
      video.currentTime = startTime;
    }

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Call parent progress callback
      if (onProgress) {
        onProgress(video.currentTime, video.duration);
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    // Attach event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('ended', handleEnded);

    // Cleanup
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, startTime, onProgress]);

  /**
   * Handle fullscreen change events
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  /**
   * Auto-hide controls after 3 seconds of inactivity
   */
  useEffect(() => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showControls]);

  /**
   * Toggle play/pause
   */
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  /**
   * Handle progress bar click to seek
   * @param {Event} e - Click event
   */
  const handleProgressClick = (e) => {
    const video = videoRef.current;
    const progressBar = progressBarRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * video.duration;

    video.currentTime = newTime;
  };

  /**
   * Handle volume bar click
   * @param {Event} e - Click event
   */
  const handleVolumeClick = (e) => {
    const video = videoRef.current;
    const volumeBar = volumeBarRef.current;
    if (!video || !volumeBar) return;

    const rect = volumeBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));

    video.volume = percentage;
    setVolume(percentage);
    setIsMuted(percentage === 0);
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  /**
   * Change playback speed
   * @param {number} rate - New playback rate
   */
  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  /**
   * Skip forward/backward
   * @param {number} seconds - Number of seconds to skip (positive or negative)
   */
  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  /**
   * Format time in MM:SS format
   * @param {number} time - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Handle mouse move to show controls
   */
  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skip(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        skip(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.1));
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className={`${styles.videoPlayerContainer} ${isFullscreen ? styles.fullscreen : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Video player"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className={styles.video}
        src={videoUrl}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>

      {/* Loading overlay */}
      {duration === 0 && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Play button overlay (when paused) */}
      {!isPlaying && duration > 0 && (
        <div className={styles.playOverlay} onClick={togglePlay}>
          <button className={styles.bigPlayButton} aria-label="Play video">
            ▶
          </button>
        </div>
      )}

      {/* Controls */}
      <div className={`${styles.controls} ${showControls ? styles.showControls : ''}`}>
        {/* Progress bar */}
        <div 
          className={styles.progressContainer}
          ref={progressBarRef}
          onClick={handleProgressClick}
        >
          {/* Buffered progress */}
          <div 
            className={styles.bufferedBar}
            style={{ width: `${buffered}%` }}
          />
          
          {/* Current progress */}
          <div 
            className={styles.progressBar}
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          
          {/* Progress handle */}
          <div 
            className={styles.progressHandle}
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Control buttons */}
        <div className={styles.controlsBar}>
          {/* Left controls */}
          <div className={styles.leftControls}>
            {/* Play/Pause button */}
            <button 
              className={styles.controlButton}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>

            {/* Skip backward */}
            <button 
              className={styles.controlButton}
              onClick={() => skip(-10)}
              aria-label="Skip backward 10 seconds"
            >
              ⏪
            </button>

            {/* Skip forward */}
            <button 
              className={styles.controlButton}
              onClick={() => skip(10)}
              aria-label="Skip forward 10 seconds"
            >
              ⏩
            </button>

            {/* Volume controls */}
            <div className={styles.volumeControl}>
              <button 
                className={styles.controlButton}
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              
              <div 
                className={styles.volumeBar}
                ref={volumeBarRef}
                onClick={handleVolumeClick}
              >
                <div 
                  className={styles.volumeProgress}
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>

            {/* Time display */}
            <div className={styles.timeDisplay}>
              <span>{formatTime(currentTime)}</span>
              <span> / </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className={styles.rightControls}>
            {/* Playback speed */}
            <div className={styles.speedControl}>
              <select 
                className={styles.speedSelect}
                value={playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                aria-label="Playback speed"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">Normal</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="1.75">1.75x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* Fullscreen button */}
            <button 
              className={styles.controlButton}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

VideoPlayer.propTypes = {
  videoUrl: PropTypes.string.isRequired,
  title: PropTypes.string,
  onProgress: PropTypes.func,
  startTime: PropTypes.number
};

export default VideoPlayer;
