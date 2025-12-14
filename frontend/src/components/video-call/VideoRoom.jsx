import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import webrtcService from '../../services/webrtcService';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { Button } from '../common/Button';
import styles from './VideoRoom.module.css';

/**
 * VideoRoom Component
 * Live video call room with WebRTC for real-time communication
 */
const VideoRoom = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [participants, setParticipants] = useState(new Map());
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [showChat, setShowChat] = useState(false);

    // Refs
    const localVideoRef = useRef(null);

    // Fetch session details
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await api.get(`/sessions/${sessionId}`);
                setSession(response.data.data);
            } catch (error) {
                console.error('[VideoRoom] Error fetching session:', error);
                toastService.error('Failed to load session');
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
    }, [sessionId, navigate]);

    // Initialize WebRTC
    useEffect(() => {
        const initWebRTC = async () => {
            if (!session || !user) return;

            try {
                // Initialize local media stream
                const stream = await webrtcService.initializeLocalStream();

                // Attach to local video element
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Join session
                await webrtcService.joinSession(sessionId, user.fullName);

                // Listen for remote streams
                window.addEventListener('webrtc:stream', handleRemoteStream);
                window.addEventListener('webrtc:peer-removed', handlePeerRemoved);
            } catch (error) {
                console.error('[VideoRoom] WebRTC initialization error:', error);
                toastService.error(error.message || 'Failed to initialize video call');
            }
        };

        initWebRTC();

        // Cleanup on unmount
        return () => {
            window.removeEventListener('webrtc:stream', handleRemoteStream);
            window.removeEventListener('webrtc:peer-removed', handlePeerRemoved);
            webrtcService.leaveSession();
        };
    }, [session, sessionId, user]);

    /**
     * Handle remote stream added
     */
    const handleRemoteStream = (event) => {
        const { userId, stream } = event.detail;
        console.log(`[VideoRoom] Adding remote stream for user ${userId}`);

        setParticipants((prev) => {
            const updated = new Map(prev);
            updated.set(userId, { userId, stream });
            return updated;
        });
    };

    /**
     * Handle peer removed
     */
    const handlePeerRemoved = (event) => {
        const { userId } = event.detail;
        console.log(`[VideoRoom] Removing peer ${userId}`);

        setParticipants((prev) => {
            const updated = new Map(prev);
            updated.delete(userId);
            return updated;
        });
    };

    /**
     * Toggle audio on/off
     */
    const toggleAudio = () => {
        const enabled = webrtcService.toggleAudio();
        setIsAudioEnabled(enabled);
        toastService.info(enabled ? 'Microphone enabled' : 'Microphone muted');
    };

    /**
     * Toggle video on/off
     */
    const toggleVideo = () => {
        const enabled = webrtcService.toggleVideo();
        setIsVideoEnabled(enabled);
        toastService.info(enabled ? 'Camera enabled' : 'Camera disabled');
    };

    /**
     * Toggle screen share
     */
    const toggleScreenShare = async () => {
        try {
            if (isScreenSharing) {
                await webrtcService.stopScreenShare();
                setIsScreenSharing(false);
                toastService.info('Screen sharing stopped');
            } else {
                await webrtcService.startScreenShare();
                setIsScreenSharing(true);
                toastService.info('Screen sharing started');
            }
        } catch (error) {
            console.error('[VideoRoom] Screen share error:', error);
            toastService.error(error.message);
        }
    };

    /**
     * Leave session
     */
    const leaveSession = () => {
        webrtcService.leaveSession();
        toastService.success('Left session');
        navigate('/dashboard');
    };

    /**
     * Send chat message
     */
    const sendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        // TODO: Implement chat via Socket.IO
        const message = {
            userId: user._id,
            userName: user.fullName,
            text: chatInput,
            timestamp: new Date().toISOString(),
        };

        setChatMessages((prev) => [...prev, message]);
        setChatInput('');
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading session...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className={styles.error}>
                <h2>Session not found</h2>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className={styles.videoRoom}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.sessionInfo}>
                    <h2>{session.title}</h2>
                    <span className={styles.participantsCount}>
                        {participants.size + 1} participant{participants.size !== 0 ? 's' : ''}
                    </span>
                </div>
                <Button variant="danger" onClick={leaveSession}>
                    Leave Session
                </Button>
            </div>

            {/* Video Grid */}
            <div className={styles.videoGrid}>
                {/* Local Video */}
                <div className={styles.videoContainer}>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={styles.video}
                    />
                    <div className={styles.videoLabel}>
                        <span>{user.fullName} (You)</span>
                        {!isVideoEnabled && <span className={styles.badge}>📷 Off</span>}
                        {!isAudioEnabled && <span className={styles.badge}>🎤 Off</span>}
                    </div>
                </div>

                {/* Remote Videos */}
                {Array.from(participants.values()).map((participant) => (
                    <RemoteVideo key={participant.userId} participant={participant} />
                ))}
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <button
                    className={`${styles.controlButton} ${!isAudioEnabled ? styles.active : ''}`}
                    onClick={toggleAudio}
                    title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                    {isAudioEnabled ? '🎤' : '🎤'}
                </button>

                <button
                    className={`${styles.controlButton} ${!isVideoEnabled ? styles.active : ''}`}
                    onClick={toggleVideo}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                    {isVideoEnabled ? '📷' : '📷'}
                </button>

                <button
                    className={`${styles.controlButton} ${isScreenSharing ? styles.active : ''}`}
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                    🖥️
                </button>

                <button
                    className={styles.controlButton}
                    onClick={() => setShowChat(!showChat)}
                    title="Toggle chat"
                >
                    💬
                </button>
            </div>

            {/* Chat Panel */}
            {showChat && (
                <div className={styles.chatPanel}>
                    <div className={styles.chatHeader}>
                        <h3>Chat</h3>
                        <button onClick={() => setShowChat(false)}>✕</button>
                    </div>

                    <div className={styles.chatMessages}>
                        {chatMessages.length === 0 ? (
                            <p className={styles.emptyChat}>No messages yet</p>
                        ) : (
                            chatMessages.map((msg, index) => (
                                <div key={index} className={styles.chatMessage}>
                                    <strong>{msg.userName}:</strong> {msg.text}
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={sendMessage} className={styles.chatForm}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className={styles.chatInput}
                        />
                        <button type="submit" className={styles.sendButton}>
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

/**
 * RemoteVideo Component
 * Displays a remote participant's video stream
 */
const RemoteVideo = ({ participant }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);

    return (
        <div className={styles.videoContainer}>
            <video ref={videoRef} autoPlay playsInline className={styles.video} />
            <div className={styles.videoLabel}>
                <span>Participant {participant.userId.slice(0, 8)}</span>
            </div>
        </div>
    );
};

export default VideoRoom;