import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './VideoPlayer.module.css';

/**
 * VideoPlayer Component
 * Custom HTML5 video player with full controls
 * Features: play/pause, progress bar, volume, playback speed, fullscreen, quality selector, PiP
 * 
 * @param {string} videoUrl - Primary video source URL
 * @param {string} title - Video title for accessibility
 * @param {function} onProgress - Callback for progress updates (currentTime, duration)
 * @param {number} startTime - Start playback from specific time (in seconds)
 * @param {Array} videoQualities - Optional array of quality options [{quality: '1080p', label: '1080p', url: 'video-url'}]
 */
const VideoPlayer = ({ videoUrl, title, onProgress, startTime = 0, videoQualities = null }) => {
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
    const [currentQuality, setCurrentQuality] = useState(videoQualities?.[0]?.quality || 'auto');
    const [hasError, setHasError] = useState(false);
    const [isPiPSupported, setIsPiPSupported] = useState(false);

    // Refs for control hiding timeout
    const controlsTimeoutRef = useRef(null);

    /**
     * Initialize video player when component mounts
     * Set up event listeners and check for Picture-in-Picture support
     */
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Check Picture-in-Picture support
        if (document.pictureInPictureEnabled) {
            setIsPiPSupported(true);
        }

        // Set start time if provided
        if (startTime > 0) {
            video.currentTime = startTime;
        }

        // Event listeners
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setHasError(false);
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

        const handleError = (e) => {
            console.error('Video loading error:', e);
            setHasError(true);
            setIsPlaying(false);
        };

        const handleWaiting = () => {
            // Video is buffering
        };

        const handleCanPlay = () => {
            setHasError(false);
        };

        // Attach event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('progress', handleProgress);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);

        // Cleanup
        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('progress', handleProgress);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
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
     * Change video quality
     * Maintains playback position and playing state
     * @param {string} quality - Quality identifier (e.g., '1080p', '720p')
     */
    const changeQuality = (quality) => {
        const video = videoRef.current;
        if (!video || !videoQualities) return;

        const qualityOption = videoQualities.find(q => q.quality === quality);
        if (!qualityOption) return;

        // Save current state
        const wasPlaying = !video.paused;
        const currentTimeBackup = video.currentTime;

        // Update video source
        video.src = qualityOption.url;
        video.load();

        // Restore state
        video.currentTime = currentTimeBackup;
        setCurrentQuality(quality);

        // Resume playing if it was playing
        if (wasPlaying) {
            video.play().catch(err => console.error('Error resuming playback:', err));
        }
    };

    /**
     * Toggle Picture-in-Picture mode
     */
    const togglePiP = async () => {
        const video = videoRef.current;
        if (!video || !isPiPSupported) return;

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch (error) {
            console.error('Picture-in-Picture error:', error);
        }
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
     * Space/K: play/pause
     * Arrow Left/Right: skip backward/forward 10s
     * Arrow Up/Down: volume up/down
     * M: toggle mute
     * F: toggle fullscreen
     * P: toggle Picture-in-Picture
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
            case 'p':
                e.preventDefault();
                if (isPiPSupported) togglePiP();
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
            {duration === 0 && !hasError && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p className={styles.loadingText}>Loading video...</p>
                </div>
            )}

            {/* Error overlay */}
            {hasError && (
                <div className={styles.errorOverlay}>
                    <div className={styles.errorContent}>
                        <span className={styles.errorIcon}>⚠️</span>
                        <h3>Video playback error</h3>
                        <p>Unable to load the video. Please try again.</p>
                        <button 
                            className={styles.retryButton}
                            onClick={() => {
                                setHasError(false);
                                videoRef.current?.load();
                            }}
                        >
                            Retry
                        </button>
                    </div>
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
                            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>

                        {/* Skip backward */}
                        <button
                            className={styles.controlButton}
                            onClick={() => skip(-10)}
                            aria-label="Skip backward 10 seconds"
                            title="Skip backward 10s (←)"
                        >
                            ⏪
                        </button>

                        {/* Skip forward */}
                        <button
                            className={styles.controlButton}
                            onClick={() => skip(10)}
                            aria-label="Skip forward 10 seconds"
                            title="Skip forward 10s (→)"
                        >
                            ⏩
                        </button>

                        {/* Volume controls */}
                        <div className={styles.volumeControl}>
                            <button
                                className={styles.controlButton}
                                onClick={toggleMute}
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
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
                        {/* Quality selector */}
                        {videoQualities && videoQualities.length > 0 && (
                            <div className={styles.qualityControl}>
                                <select
                                    className={styles.qualitySelect}
                                    value={currentQuality}
                                    onChange={(e) => changeQuality(e.target.value)}
                                    aria-label="Video quality"
                                    title="Video quality"
                                >
                                    {videoQualities.map((q) => (
                                        <option key={q.quality} value={q.quality}>
                                            {q.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Playback speed */}
                        <div className={styles.speedControl}>
                            <select
                                className={styles.speedSelect}
                                value={playbackRate}
                                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                                aria-label="Playback speed"
                                title="Playback speed"
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

                        {/* Picture-in-Picture button */}
                        {isPiPSupported && (
                            <button
                                className={styles.controlButton}
                                onClick={togglePiP}
                                aria-label="Picture-in-Picture"
                                title="Picture-in-Picture (P)"
                            >
                                📺
                            </button>
                        )}

                        {/* Fullscreen button */}
                        <button
                            className={styles.controlButton}
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
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
    startTime: PropTypes.number,
    videoQualities: PropTypes.arrayOf(
        PropTypes.shape({
            quality: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired
        })
    )
};

export default VideoPlayer;
