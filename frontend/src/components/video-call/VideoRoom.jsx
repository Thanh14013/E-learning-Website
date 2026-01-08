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
 * Live video call room with WebRTC, Lobby, and Waiting Room
 */
const VideoRoom = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    // Session State
    const [session, setSession] = useState(null);
    const [viewMode, setViewMode] = useState('lobby'); // 'lobby', 'waiting', 'room'
    const [isLoading, setIsLoading] = useState(true);

    // Media State
    const [localStream, setLocalStream] = useState(null);
    const localVideoRef = useRef(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Filter participants to exclude the local user (handled by local video)
    const [participants, setParticipants] = useState(new Map());

    // Chat & Sidebar State
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [activeSidebar, setActiveSidebar] = useState(null); // 'chat', 'people', null

    // Host Controls State
    const [joinRequests, setJoinRequests] = useState([]);

    const isHost = session?.hostId === user?._id || session?.hostId?._id === user?._id;

    // 1. Fetch Session Details (Wait for this before anything)
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

        return () => {
            // Cleanup on unmount
            webrtcService.leaveSession();
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line
    }, [sessionId, navigate]);
    // Removed localStream from deps to avoid double cleanup loop

    // 2. Initialize Local Stream (Lobby)
    useEffect(() => {
        if (!isLoading && session) {
            const initLocal = async () => {
                try {
                    const stream = await webrtcService.initializeLocalStream();
                    setLocalStream(stream);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error('Local stream init error', err);
                    toastService.error('Could not access camera/microphone');
                }
            };
            initLocal();
        }
    }, [isLoading, session]);

    // 3. Event Listeners
    useEffect(() => {
        if (!session) return;

        const handleRemoteStream = (e) => {
            const { userId, stream } = e.detail;
            const userName = getParticipantName(userId);
            setParticipants(prev => {
                const next = new Map(prev);
                next.set(userId, { userId, stream, userName, isVideoOn: true, isAudioOn: true });
                return next;
            });
        };

        const handlePeerRemoved = (e) => {
            setParticipants(prev => {
                const next = new Map(prev);
                next.delete(e.detail.userId);
                return next;
            });
        };

        const handleUserJoined = (e) => {
            // Just a notification or adding placeholder if needed
            // We wait for stream for video, but can list them in participants
            // e.detail: { userId, userName }
            // Update participants list UI even if no video yet?
            // For now we rely on stream for video grid, but sidebar needs list.
            // WebrtcService maintains socketMap.
        };

        const handleUserLeft = (e) => {
            // Remove from participants
            setParticipants(prev => {
                const next = new Map(prev);
                next.delete(e.detail.userId);
                return next;
            });
        };

        const handleWaiting = (e) => {
            setViewMode('waiting');
        };

        const handleApproved = (e) => {
            toastService.success("Host approved your request!");
            setViewMode('room');
            // WebrtcService socket logic should handle list fetching or we just wait for events
        };

        const handleDenied = (e) => {
            toastService.error("Host denied your request.");
            navigate('/dashboard'); // Or back to course
        };

        const handleKicked = (e) => {
            toastService.error("You have been kicked from the session.");
            webrtcService.leaveSession();
            navigate('/dashboard');
        };

        const handleJoinRequest = (e) => {
            if (isHost) {
                setJoinRequests(prev => {
                    if (prev.find(r => r.userId === e.detail.userId)) return prev;
                    return [...prev, e.detail];
                });
                toastService.info(`${e.detail.userName} wants to join`);
                setActiveSidebar('people'); // Open sidebar to show request
            }
        };

        const handleMessage = (e) => {
            setChatMessages(prev => [...prev, e.detail]);
            if (activeSidebar !== 'chat') {
                // Show unread indicator? For now just toast
                // toastService.info(`New message from ${e.detail.userName}`);
            }
        };

        const handleVideoToggle = (e) => {
            const { userId, enabled } = e.detail;
            setParticipants(prev => {
                const p = prev.get(userId);
                if (p) return new Map(prev).set(userId, { ...p, isVideoOn: enabled });
                return prev;
            });
        };

        const handleAudioToggle = (e) => {
            const { userId, enabled } = e.detail;
            setParticipants(prev => {
                const p = prev.get(userId);
                if (p) return new Map(prev).set(userId, { ...p, isAudioOn: enabled });
                return prev;
            });
        };

        // Attach listeners
        window.addEventListener('webrtc:stream', handleRemoteStream);
        window.addEventListener('webrtc:peer-removed', handlePeerRemoved);
        window.addEventListener('session:user-joined', handleUserJoined);
        window.addEventListener('session:user-left', handleUserLeft);
        window.addEventListener('session:waiting', handleWaiting);
        window.addEventListener('session:approved', handleApproved);
        window.addEventListener('session:denied', handleDenied);
        window.addEventListener('session:kicked', handleKicked);
        window.addEventListener('session:join-request', handleJoinRequest);
        window.addEventListener('session:chat-message', handleMessage);
        window.addEventListener('session:participant-video-toggled', handleVideoToggle);
        window.addEventListener('session:participant-audio-toggled', handleAudioToggle);

        return () => {
            window.removeEventListener('webrtc:stream', handleRemoteStream);
            window.removeEventListener('webrtc:peer-removed', handlePeerRemoved);
            window.removeEventListener('session:user-joined', handleUserJoined);
            window.removeEventListener('session:user-left', handleUserLeft);
            window.removeEventListener('session:waiting', handleWaiting);
            window.removeEventListener('session:approved', handleApproved);
            window.removeEventListener('session:denied', handleDenied);
            window.removeEventListener('session:kicked', handleKicked);
            window.removeEventListener('session:join-request', handleJoinRequest);
            window.removeEventListener('session:chat-message', handleMessage);
            window.removeEventListener('session:participant-video-toggled', handleVideoToggle);
            window.removeEventListener('session:participant-audio-toggled', handleAudioToggle);
        };
    }, [session, isHost, activeSidebar, navigate]);

    // Helper: Join Session
    const handleJoinClick = async () => {
        if (!user || !localStream) return;
        try {
            await webrtcService.joinSession(sessionId, user.fullName, token);
            // Default to room if no waiting event fired immediately
            // But if waiting room is enabled, backend emits session:waiting immediately.
            // We can wait a tiny bit or just set to 'room' and let event override to 'waiting'
            // Better: use session settings to guess?
            if (session.settings?.waitingRoomEnabled && !isHost) {
                // Expect waiting, but set to 'room' and let event listener switch it? 
                // No, UI flickers.
                // We don't change viewMode here. We let events dictate.
                // But if success (and no waiting room), we won't get a specific "joined" event for ourselves usually, 
                // just 'connect'. webrtcService logs 'Connected'. 
                // Let's assume 'room' unless we get 'waiting'.
                setViewMode('room');
            } else {
                setViewMode('room');
            }
        } catch (err) {
            console.error('Join error', err);
            toastService.error('Failed to join');
        }
    };

    // Helper: Host Actions
    const approveUser = (req) => {
        webrtcService.approveJoinRequest(req.userId);
        setJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
        toastService.success(`Approved ${req.userName}`);
    };

    const denyUser = (req) => {
        webrtcService.denyJoinRequest(req.userId);
        setJoinRequests(prev => prev.filter(r => r.userId !== req.userId));
    };

    const kickUser = (uid) => {
        if (!window.confirm("Kick this user?")) return;
        webrtcService.kickParticipant(uid);
    };

    // Helper: Name Lookup
    const getParticipantName = (uid) => {
        // Check session.participants (from DB fetch)
        const dbP = session?.participants?.find(p => p.userId === uid || p.userId?._id === uid);
        if (dbP) return dbP.userName || dbP.userId?.fullName || 'User';
        // Check requests
        const req = joinRequests.find(r => r.userId === uid);
        if (req) return req.userName;
        return 'Participant';
    };

    // --- Renderers ---

    if (isLoading) return <div className={styles.loading}>Loading...</div>;
    if (!session) return <div className={styles.error}>Session not found</div>;

    // View: Waiting Room
    if (viewMode === 'waiting') {
        return (
            <div className={styles.waitingRoom}>
                <div className={styles.waitingContent}>
                    <h2>⏳ Waiting for Host</h2>
                    <p>You have joined the lobby. Please wait for the host ({session.teacherId?.fullName}) to let you in.</p>
                </div>
            </div>
        );
    }

    // View: Lobby (Pre-join)
    if (viewMode === 'lobby') {
        return (
            <div className={styles.lobbyContainer}>
                <div className={styles.lobbyCard}>
                    <h2>{session.title}</h2>
                    <div className={styles.lobbyVideoPreview}>
                        <video ref={localVideoRef} autoPlay muted playsInline className={styles.videoPreview} />
                        <div className={styles.lobbyControls}>
                            <button
                                onClick={() => {
                                    const enabled = webrtcService.toggleAudio();
                                    setIsAudioEnabled(enabled);
                                }}
                                className={`${styles.lobbyBtn} ${!isAudioEnabled ? styles.off : ''}`}
                            >
                                {isAudioEnabled ? '🎤 On' : '🎤 Off'}
                            </button>
                            <button
                                onClick={() => {
                                    const enabled = webrtcService.toggleVideo();
                                    setIsVideoEnabled(enabled);
                                }}
                                className={`${styles.lobbyBtn} ${!isVideoEnabled ? styles.off : ''}`}
                            >
                                {isVideoEnabled ? '📷 On' : '📷 Off'}
                            </button>
                        </div>
                    </div>
                    <div className={styles.lobbyActions}>
                        <Button variant="primary" size="large" onClick={handleJoinClick} style={{ width: '100%' }}>
                            Join Now
                        </Button>
                        <Button variant="secondary" onClick={() => navigate(-1)} style={{ width: '100%', marginTop: '10px' }}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // View: Room
    return (
        <div className={styles.videoRoom}>
            <div className={styles.mainContent}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.sessionInfo}>
                        <h3>{session.title}</h3>
                        <span className={styles.timer}>
                            {/* Could add duration timer here */}
                        </span>
                    </div>
                    <Button variant="danger" size="small" onClick={() => { webrtcService.leaveSession(); navigate('/dashboard'); }}>
                        Leave
                    </Button>
                </div>

                {/* Video Grid */}
                <div className={styles.videoGrid}>
                    {/* Local */}
                    <div className={styles.videoWrapper}>
                        <video ref={localVideoRef} autoPlay muted playsInline className={styles.videoElement} />
                        <div className={styles.nameTag}>You {isHost ? '(Host)' : ''}</div>
                    </div>
                    {/* Remote */}
                    {Array.from(participants.values()).map(p => (
                        <div key={p.userId} className={styles.videoWrapper}>
                            <RemoteVideo participant={p} />
                            {isHost && (
                                <button className={styles.kickBtn} onClick={() => kickUser(p.userId)} title="Kick User">
                                    🚫
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bottom Controls */}
                <div className={styles.controlsBar}>
                    <button onClick={() => setIsAudioEnabled(webrtcService.toggleAudio())} className={!isAudioEnabled ? styles.controlOff : ''}>
                        {isAudioEnabled ? '🎤 Mute' : '🎤 Unmute'}
                    </button>
                    <button onClick={() => setIsVideoEnabled(webrtcService.toggleVideo())} className={!isVideoEnabled ? styles.controlOff : ''}>
                        {isVideoEnabled ? '📷 Stop Video' : '📷 Start Video'}
                    </button>
                    <button onClick={() => {
                        webrtcService.startScreenShare().then(() => setIsScreenSharing(true)).catch(() => setIsScreenSharing(false));
                    }} className={isScreenSharing ? styles.controlActive : ''}>
                        🖥️ Share
                    </button>
                    <div className={styles.divider} />
                    <button onClick={() => setActiveSidebar(activeSidebar === 'people' ? null : 'people')}>
                        👥 People {joinRequests.length > 0 && <span className={styles.badge}>{joinRequests.length}</span>}
                    </button>
                    <button onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}>
                        💬 Chat
                    </button>
                </div>
            </div>

            {/* Sidebar */}
            {activeSidebar && (
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h4>{activeSidebar === 'people' ? 'Participants' : 'Chat'}</h4>
                        <button onClick={() => setActiveSidebar(null)}>✕</button>
                    </div>

                    {activeSidebar === 'people' && (
                        <div className={styles.peopleList}>
                            {isHost && joinRequests.length > 0 && (
                                <div className={styles.requestsSection}>
                                    <h5>Waiting Room ({joinRequests.length})</h5>
                                    {joinRequests.map(req => (
                                        <div key={req.userId} className={styles.requestItem}>
                                            <div className={styles.reqInfo}>
                                                <span className={styles.avatar}>👤</span>
                                                <span>{req.userName}</span>
                                            </div>
                                            <div className={styles.reqActions}>
                                                <button className={styles.btnApprove} onClick={() => approveUser(req)}>✓</button>
                                                <button className={styles.btnDeny} onClick={() => denyUser(req)}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                    <hr />
                                </div>
                            )}

                            <h5>In Meeting ({participants.size + 1})</h5>
                            <div className={styles.participantItem}>
                                <span>You ({user.fullName})</span>
                                <span className={styles.role}>{isHost ? 'Host' : 'Me'}</span>
                            </div>
                            {Array.from(participants.values()).map(p => (
                                <div key={p.userId} className={styles.participantItem}>
                                    <span>{p.userName}</span>
                                    {isHost && (
                                        <button className={styles.kickSmall} onClick={() => kickUser(p.userId)}>Kick</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {activeSidebar === 'chat' && (
                        <div className={styles.chatContainer}>
                            <div className={styles.messages}>
                                {chatMessages.map((m, i) => (
                                    <div key={i} className={styles.message}>
                                        <strong>{m.userName}</strong>: {m.message}
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!chatInput.trim()) return;
                                webrtcService.sendChatMessage(chatInput, user);
                                setChatInput('');
                            }} className={styles.chatInputArea}>
                                <input
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder="Type a message..."
                                />
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const RemoteVideo = ({ participant }) => {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);
    return <video ref={videoRef} autoPlay playsInline className={styles.videoElement} />;
};

export default VideoRoom;