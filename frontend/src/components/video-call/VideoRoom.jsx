import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import webrtcService from '../../services/webrtcService';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import styles from './VideoRoom.module.css';

/**
 * Remote Video Component
 * Renders remote participant's video/audio stream
 */
function RemoteVideo({ participant }) {
    const videoRef = useRef(null);
    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
            videoRef.current.play().catch(e => console.warn("Remote play failed", e));
        }
    }, [participant.stream]);

    if (participant.isMain) {
        return (
            <>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className={styles.mainVideoElement}
                    style={{ display: (!participant.isVideoOn || !participant.stream) ? 'none' : 'block' }}
                />
                {(!participant.isVideoOn || !participant.stream) && (
                    <div className={styles.mainLoadingOverlay}>
                        <div className={styles.avatarLarge}>{participant.userName ? participant.userName.charAt(0).toUpperCase() : '?'}</div>
                        <h3>{participant.userName}</h3>
                        <span className={styles.statusText}>Camera Off</span>
                    </div>
                )}
                {participant.isVideoOn && participant.stream && (
                    <div className={styles.mainVideoLabel}>{participant.userName} </div>
                )}
            </>
        )
    }

    // Default Card Render (Hidden/Sidebar usage)
    return (
        <div className={styles.videoContainer}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={styles.videoElement}
                style={{ display: (!participant.isVideoOn || !participant.stream) ? 'none' : 'block' }}
            />
            {(!participant.isVideoOn || !participant.stream) ? (
                <div className={styles.videoPlaceholder}>
                    <span className={styles.placeholderName}>{participant.userName}</span>
                </div>
            ) : (
                <div className={styles.nameTag}>{participant.userName}</div>
            )}
        </div>
    );
}

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
    // Media State: Assume OFF initially, enable if Host later
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Filter participants to exclude the local user (handled by local video)
    const [participants, setParticipants] = useState(new Map());

    // Chat & Sidebar State
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [activeSidebar, setActiveSidebar] = useState(null); // 'chat', 'people', null

    // Host Controls State
    const [joinRequests, setJoinRequests] = useState([]);

    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [kickModal, setKickModal] = useState({ isOpen: false, userId: null });

    const isHost = session?.hostId === user?._id || session?.hostId?._id === user?._id;

    // Enable media for Host once session is loaded
    useEffect(() => {
        if (isHost) {
            setIsAudioEnabled(true);
            setIsVideoEnabled(true);
        }
    }, [isHost]);

    // Added: Sync State to Tracks (Fix for Black Screen)
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = isAudioEnabled);
            localStream.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);

            // Also ensure we tell peers if we change it here (though usually triggered by buttons)
            // But if it's initial load, buttons haven't been clicked.
            // The buttons call webrtcService.toggleAudio() which emits.
            // But if we set state here programmatically, we might need to emit manually OR 
            // rely on the fact that toggleAudio/Video calls set state.

            // Actually, we just want to ensure physical hardware matches state.
            // The socket events are handled by the button clicks. 
            // BUT, for initial load (Host), we set state=true. 
            // We need to ensure tracks are enabled. 
            // AND we probably should emit "I am on" to anyone already there (though host is first).
        }
    }, [localStream, isAudioEnabled, isVideoEnabled]);

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

    // 2. Initialize Waiting Room from Session
    useEffect(() => {
        if (session?.waitingRoom && isHost) {
            setJoinRequests(session.waitingRoom);
        }
    }, [session, isHost]);

    // 3. Initialize Local Stream (Lobby)
    useEffect(() => {
        if (!isLoading && session) {
            const initLocal = async () => {
                // Determine if media should be on by default
                // For host: YES. For student: NO (they manually enable in lobby)
                // Actually, logic is: init stream if User WANTS it. 
                // But initially, state is set based on isHost. 
                // So if !isHost, isVideoEnabled is false.

                // However, webrtcService.initializeLocalStream() requests permission immediately.
                // If we want to start OFF, we shouldn't call this yet? 
                // OR we call it but mute tracks?

                // Better approach: Only initialize if isHost is true. 
                // Students initialize when they click "Camera On" in lobby?
                // The current component structure expects 'localStream' to exist to show preview.

                // Let's stick to: Always init stream for preview, but mute audio/video tracks if state is false.
                // But wait, the previous fix enabled init for everyone.

                try {
                    const stream = await webrtcService.initializeLocalStream();
                    setLocalStream(stream);

                    // Apply initial state
                    stream.getAudioTracks().forEach(t => t.enabled = isAudioEnabled);
                    stream.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);

                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error('Local stream init error', err);
                    if (isHost) {
                        // Only complain loudly if host fails. Students might just have denied permission.
                        toastService.error('Could not access camera/microphone');
                    }
                }
            };
            initLocal();
        }
    }, [isLoading, session, isHost]); // Added dependencies to re-run if state changes? No, just run once. Wait, isAudio/VideoEnabled are state.
    // We shouldn't depend on them for INIT. We init once.


    // Ensure video element gets stream when mounted/available (Fix for Teacher Black Screen)
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            console.log('[VideoRoom] Attaching local stream to video element');
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(e => console.error('Local video play failed:', e));
        }
    }, [localStream, isHost, viewMode]); // Re-run when Host view mounts/viewMode changes

    // 3. Event Listeners
    useEffect(() => {
        if (!session) return;

        const handleRemoteStream = (e) => {
            const { userId, stream } = e.detail;
            setParticipants(prev => {
                const next = new Map(prev);
                const existing = next.get(userId) || {};
                let fallbackName = "User";
                if (userId === session.hostId || (session.hostId?._id && userId === session.hostId._id)) {
                    fallbackName = "Teacher (Host)";
                }
                const userName = existing.userName || getParticipantName(userId) || fallbackName;
                next.set(userId, { ...existing, userId, stream, userName, isVideoOn: true, isAudioOn: true });
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
            const { userId, userName, avatar, isMuted, isVideoOff } = e.detail;
            if (userId === (user._id || user.id)) return;

            let finalName = userName || "User";
            const hostId = session.hostId._id || session.hostId;
            if (userId === hostId) finalName = "Teacher (Host)";

            setParticipants(prev => {
                if (prev.has(userId)) return prev;
                const next = new Map(prev);
                next.set(userId, { userId, userName: finalName, avatar, isAudioOn: !isMuted, isVideoOn: !isVideoOff });
                return next;
            });
            toastService.info(`${finalName} joined`);
        };

        const handleUserLeft = (e) => {
            const { userId } = e.detail;
            setParticipants(prev => {
                const next = new Map(prev);
                next.delete(userId);
                return next;
            });
        };

        const handleWaiting = () => setViewMode('waiting');

        const handleApproved = () => {
            setViewMode('room');
            toastService.success("Join request approved!");
        };

        const handleDenied = () => {
            toastService.error("Join request denied.");
            navigate('/dashboard');
        };

        const handleKicked = (e) => {
            toastService.error(e.detail?.message || "You have been kicked from the session.");
            window.location.href = '/dashboard';
        };

        const handleSessionEnded = () => {
            toastService.info("Session has ended.");
            webrtcService.leaveSession();
            window.location.href = '/dashboard';
        };

        const handleJoinRequest = (e) => {
            if (isHost) {
                setJoinRequests(prev => {
                    if (prev.find(r => r.userId === e.detail.userId)) return prev;
                    return [...prev, e.detail];
                });
                toastService.info(`${e.detail.userName} asked to join.`);
                setActiveSidebar('people');
            }
        };

        const handleMessage = (e) => {
            const { userId, message, userName } = e.detail;
            const isMe = userId === (user._id || user.id);
            setChatMessages(prev => [...prev, { userId, userName, message, isMe }]);
            if (!isMe && activeSidebar !== 'chat') {
                toastService.info(`New message from ${userName}`);
            }
        };

        const handleVideoToggle = (e) => {
            const { userId, videoEnabled } = e.detail;
            setParticipants(prev => {
                const p = prev.get(userId);
                if (p) return new Map(prev).set(userId, { ...p, isVideoOn: videoEnabled });
                return prev;
            });
        };

        const handleAudioToggle = (e) => {
            const { userId, audioEnabled } = e.detail;
            setParticipants(prev => {
                const p = prev.get(userId);
                if (p) return new Map(prev).set(userId, { ...p, isAudioOn: audioEnabled });
                return prev;
            });
        };

        window.addEventListener('webrtc:stream', handleRemoteStream);
        window.addEventListener('webrtc:peer-removed', handlePeerRemoved);
        window.addEventListener('session:user-joined', handleUserJoined);
        window.addEventListener('session:user-left', handleUserLeft);
        window.addEventListener('session:waiting', handleWaiting);
        window.addEventListener('session:join-approved', handleApproved);
        window.addEventListener('session:join-denied', handleDenied);
        window.addEventListener('session:kicked', handleKicked);
        window.addEventListener('session:ended', handleSessionEnded);
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
            window.removeEventListener('session:join-approved', handleApproved);
            window.removeEventListener('session:join-denied', handleDenied);
            window.removeEventListener('session:kicked', handleKicked);
            window.removeEventListener('session:ended', handleSessionEnded);
            window.removeEventListener('session:join-request', handleJoinRequest);
            window.removeEventListener('session:chat-message', handleMessage);
            window.removeEventListener('session:participant-video-toggled', handleVideoToggle);
            window.removeEventListener('session:participant-audio-toggled', handleAudioToggle);
        };
    }, [session, isHost, activeSidebar, navigate, user]);

    // Helper: Join Session
    const handleJoinClick = async () => {
        // Allow joining if user exists (student doesn't need localStream)
        if (!user) return;
        if (isHost && !localStream) {
            toastService.warning("Host must have media enabled.");
            return;
        }
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
        setKickModal({ isOpen: true, userId: uid });
    };

    const handleConfirmKick = () => {
        if (kickModal.userId) {
            webrtcService.kickParticipant(kickModal.userId);
            toastService.success("Participant removed from session");
            setKickModal({ isOpen: false, userId: null });
        }
    };

    // End Session (Host only)
    const handleEndSession = async () => {
        setShowEndSessionModal(false);
        try {
            await api.put(`/sessions/${sessionId}/end`);
            toastService.success('Session ended successfully');
            webrtcService.leaveSession();

            // Reload the opener (Session Scheduler) if it exists
            if (window.opener) {
                try {
                    window.opener.location.reload();
                } catch (e) {
                    console.warn('Could not reload opener', e);
                }
            }

            // Close the tab/window
            window.close();

            // Fallback if browser blocks window.close()
            setTimeout(() => {
                if (!window.closed) {
                    toastService.info('Please close this tab manually');
                }
            }, 100);
        } catch (error) {
            console.error('Failed to end session:', error);
            toastService.error('Failed to end session');
        }
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
                        {/* Show preview for everyone */}
                        <>
                            <video ref={localVideoRef} autoPlay muted playsInline className={styles.videoPreview} />
                            <div className={styles.lobbyControls}>
                                <button
                                    onClick={() => {
                                        const enabled = webrtcService.toggleAudio();
                                        setIsAudioEnabled(enabled);
                                    }}
                                    className={`${styles.lobbyBtn} ${!isAudioEnabled ? styles.off : ''}`}
                                >
                                    {isAudioEnabled ? 'Mic on' : 'Mic off'}
                                </button>
                                <button
                                    onClick={() => {
                                        const enabled = webrtcService.toggleVideo();
                                        setIsVideoEnabled(enabled);
                                    }}
                                    className={`${styles.lobbyBtn} ${!isVideoEnabled ? styles.off : ''}`}
                                >
                                    {isVideoEnabled ? 'Camera on' : 'Camera off'}
                                </button>
                            </div>
                        </>
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
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.sessionInfo}>
                    <h3>{session.title}</h3>
                    <span className={styles.timer}>
                        {/* Could add duration timer here */}
                    </span>
                </div>
                <div className={styles.headerActions}>
                    {isHost && (
                        <Button
                            variant="danger"
                            size="small"
                            onClick={() => setShowEndSessionModal(true)}
                            style={{ marginRight: '10px' }}
                        >
                            End Session
                        </Button>
                    )}
                    <Button variant="secondary" size="small" onClick={() => {
                        webrtcService.leaveSession();

                        // Close the tab for everyone
                        window.close();

                        // Fallback if browser blocks window.close()
                        setTimeout(() => {
                            if (!window.closed) {
                                toastService.info('Please close this tab manually');
                                // If still can't close, navigate away as last resort
                                navigate('/dashboard');
                            }
                        }, 100);
                    }}>
                        Leave
                    </Button>
                </div>
            </div>

            {/* Content Area (Video + Sidebar) */}
            <div className={styles.contentArea}>
                <div className={styles.spotlightContainer}>
                    {/* LOGIC:
                        - If I am Host: Show ME (LocalStream) in Main Area.
                        - If I am Student: Show Host (RemoteStream) in Main Area.
                    */}

                    {isHost ? (
                        /* TEACHER VIEW: Sees Self */
                        <div className={styles.mainVideoWrapper}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={styles.mainVideoElement}
                            />
                            <div className={styles.mainVideoLabel}>
                                You (Host)
                                {!isVideoEnabled && <span className={styles.statusText}>Camera Off</span>}
                            </div>
                        </div>
                    ) : (
                        /* STUDENT VIEW: Sees Teacher */
                        <div className={styles.mainVideoWrapper}>
                            {(() => {
                                // Find Host Participant
                                // Note: Session hostId might be populated object or string
                                const hostIdStr = session.hostId?._id || session.hostId;
                                const hostParticipant = participants.get(hostIdStr);

                                if (hostParticipant) {
                                    return (
                                        <>
                                            <RemoteVideo participant={{ ...hostParticipant, isMain: true }} />
                                        </>
                                    )
                                } else {
                                    return (
                                        <div className={styles.mainLoadingOverlay}>
                                            <h3>Waiting for Teacher...</h3>
                                            <p>The host hasn't joined or video is loading.</p>
                                        </div>
                                    )
                                }
                            })()}
                        </div>
                    )}

                    {/* HIDDEN / BACKGROUND VIDEOS */}
                    {/* We must keep these mounted for WebRTC to receive/send streams, 
                        but we hide them visually as per user request "No student screen" */}

                    {/* 1. Student Self View (Hidden for Student) */}
                    {!isHost && (
                        <div className={styles.hiddenVideo}>
                            {/* Muted local video for connection purposes */}
                            <video ref={localVideoRef} autoPlay muted playsInline />
                        </div>
                    )}

                    {/* 2. Other Students (Hidden for everyone for now, focused on Teacher) */}
                    {Array.from(participants.values())
                        .filter(p => {
                            const hostIdStr = session.hostId?._id || session.hostId;
                            return p.userId !== (user._id || user.id) && p.userId !== hostIdStr;
                        })
                        .map(p => (
                            <div key={p.userId} className={styles.hiddenVideo}>
                                <RemoteVideo participant={p} />
                            </div>
                        ))
                    }
                </div> {/* End spotlightContainer */}

                {/* Sidebar Area */}
                {activeSidebar && (
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                            <h4>{activeSidebar === 'people' ? 'Participants' : 'Chat'}</h4>
                            <button onClick={() => setActiveSidebar(null)} className={styles.closeSidebarBtn}>✕</button>
                        </div>

                        {activeSidebar === 'people' && (
                            <div className={styles.peopleList}>
                                {isHost && joinRequests.length > 0 && (
                                    <div className={styles.requestsSection}>
                                        <h5>Waiting Room <span className={styles.badge}>{joinRequests.length}</span></h5>
                                        {joinRequests.map(req => (
                                            <div key={req.userId} className={styles.requestItem}>
                                                <div className={styles.reqInfo}>
                                                    <div className={styles.avatarSmall}>
                                                        {req.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{req.userName}</span>
                                                </div>
                                                <div className={styles.reqActions}>
                                                    <button className={styles.btnApprove} onClick={() => approveUser(req)}>Accept</button>
                                                    <button className={styles.btnDeny} onClick={() => denyUser(req)}>Deny</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <h5 className={styles.sectionTitle}>In Meeting ({participants.size + 1})</h5>

                                {/* Me */}
                                <div className={styles.participantItem}>
                                    <div className={styles.participantInfo}>
                                        <div className={styles.avatarSmall}>
                                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className={styles.participantName}>
                                            You ({user.fullName})
                                            <span className={styles.roleTag}>{isHost ? 'Host' : 'Me'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Others */}
                                {Array.from(participants.values())
                                    .filter(p => p.userId !== user._id)
                                    .map(p => (
                                        <div key={p.userId} className={styles.participantItem}>
                                            <div className={styles.participantInfo}>
                                                <div className={styles.avatarSmall}>
                                                    {p.userName ? p.userName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className={styles.participantName}>
                                                    {p.userName}
                                                </div>
                                            </div>
                                            {isHost && (
                                                <button className={styles.kickBtnStyled} onClick={() => kickUser(p.userId)}>Remove</button>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}

                        {activeSidebar === 'chat' && (
                            <div className={styles.chatContainer}>
                                <div className={styles.messageList}>
                                    {chatMessages.length === 0 && (
                                        <div className={styles.emptyState}>No messages yet</div>
                                    )}
                                    {chatMessages.map((m, i) => (
                                        <div key={i} className={`${styles.chatMessage} ${m.isMe ? styles.myMessage : ''}`}>
                                            <div className={styles.messageHeader}>
                                                <span className={styles.msgUser}>{m.userName}</span>
                                                <span className={styles.msgTime}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className={styles.msgContent}>{m.message}</div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!chatInput.trim()) return;
                                    webrtcService.sendChatMessage(chatInput, user);
                                    setChatMessages(prev => [...prev, { userName: "You", message: chatInput, isMe: true }]);
                                    setChatInput('');
                                }} className={styles.chatForm}>
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className={styles.chatInput}
                                    />
                                    <button type="submit" className={styles.sendButton} disabled={!chatInput.trim()}>➤</button>
                                </form>
                            </div>
                        )}
                    </div>
                )}

            </div> {/* End contentArea */}

            {/* Bottom Controls */}
            <div className={styles.controlsBar}>
                {/* Everyone gets controls now */}
                <>
                    {/* UPDATE: Use simple state toggles, rely on useEffect to call service */}
                    <button onClick={() => setIsAudioEnabled(prev => !prev)} className={!isAudioEnabled ? styles.controlOff : ''}>
                        {isAudioEnabled ? '🎤 Mute' : '🎤 Unmute'}
                    </button>
                    <button onClick={() => setIsVideoEnabled(prev => !prev)} className={!isVideoEnabled ? styles.controlOff : ''}>
                        {isVideoEnabled ? '📷 Stop Video' : '📷 Start Video'}
                    </button>
                    <button onClick={() => {
                        webrtcService.startScreenShare().then(() => setIsScreenSharing(true)).catch(() => setIsScreenSharing(false));
                    }} className={isScreenSharing ? styles.controlActive : ''}>
                        🖥️ Share
                    </button>
                    <div className={styles.divider} />
                </>
                <button onClick={() => setActiveSidebar(activeSidebar === 'people' ? null : 'people')}>
                    👥 People {joinRequests.length > 0 && <span className={styles.badge}>{joinRequests.length}</span>}
                </button>
                <button onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}>
                    💬 Chat
                </button>
            </div>

            {/* Video Grid Removed handled above */}

            {/* End Session Modal */}
            {
                showEndSessionModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowEndSessionModal(false)}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3>End Session</h3>
                                <button className={styles.modalClose} onClick={() => setShowEndSessionModal(false)}>✕</button>
                            </div>
                            <div className={styles.modalBody}>
                                <p>Are you sure you want to end this session for everyone?</p>
                                <p className={styles.modalWarning}>⚠️ All participants will be disconnected and the session will be marked as completed.</p>
                            </div>
                            <div className={styles.modalFooter}>
                                <Button variant="secondary" onClick={() => setShowEndSessionModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleEndSession}>
                                    End Session
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Kick Confirmation Modal */}
            {kickModal.isOpen && (
                <Modal
                    isOpen={kickModal.isOpen}
                    onClose={() => setKickModal({ isOpen: false, userId: null })}
                    title="Remove Participant"
                >
                    <div className={styles.modalBody}>
                        <p>Are you sure you want to remove this participant?</p>
                        <p className={styles.modalWarning}>⚠️ They will be disconnected from the session.</p>
                        <div className={styles.modalActions} style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <Button variant="secondary" onClick={() => setKickModal({ isOpen: false, userId: null })}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleConfirmKick}>
                                Remove
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div >
    );
};



export default VideoRoom;