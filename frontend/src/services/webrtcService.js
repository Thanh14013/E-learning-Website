/**
 * WebRTC Service
 * Manages peer-to-peer video/audio connections for live sessions
 * Uses simple-peer library for WebRTC abstraction
 * Connects directly to /session namespace on backend
 */

import Peer from "simple-peer";
import { io } from "socket.io-client";

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.peers = new Map(); // Map<userId, Peer>
    this.socketMap = new Map(); // Map<userId, socketId>
    this.sessionId = null;
    this.isInitialized = false;
    this.socket = null;
  }

  /**
   * Initialize local media stream
   * @param {Object} constraints - Media constraints
   * @returns {Promise<MediaStream>}
   */
  async initializeLocalStream(constraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("[WebRTC] Local stream initialized:", this.localStream.id);
      return this.localStream;
    } catch (error) {
      console.error("[WebRTC] Error getting local stream:", error);
      throw new Error(
        "Unable to access camera/microphone. Please check permissions."
      );
    }
  }

  /**
   * Join a video session
   * @param {string} sessionId - Session ID to join
   * @param {string} userName - User display name
   * @param {string} token - Auth token
   */
  async joinSession(sessionId, userName, token) {
    if (!this.localStream) {
      throw new Error(
        "Local stream not initialized. Call initializeLocalStream first."
      );
    }

    this.sessionId = sessionId;
    this.isInitialized = true;
    this.socketMap.clear();

    // Connect to session namespace directly
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
    this.socket = io(`${socketUrl}/session`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => {
      console.log(`[WebRTC] Connected to session namespace: ${this.socket.id}`);
      // Emit join event once connected
      this.socket.emit("session:join", { sessionId, userName });
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`[WebRTC] Reconnected after ${attemptNumber} attempts`);
      // Rejoin session and recreate peer connections
      this.handleReconnection(sessionId, userName);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[WebRTC] Connection error:", err.message);
      window.dispatchEvent(
        new CustomEvent("session:error", {
          detail: { message: "Failed to connect to video server." },
        })
      );
    });

    this.socket.on("disconnect", (reason) => {
      console.warn(`[WebRTC] Disconnected: ${reason}`);
      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect manually
        this.socket.connect();
      }
    });

    // Setup Socket.IO listeners (Signaling & Events)
    this.setupSocketListeners();
  }

  /**
   * Setup Socket.IO event listeners
   */
  setupSocketListeners() {
    if (!this.socket) return;
    const socket = this.socket;

    // Receive list of existing participants (We are the Joiner)
    socket.on("session:participants-list", ({ participants }) => {
      console.log(
        `[WebRTC] Received participants list: ${participants.length} users`
      );

      participants.forEach((p) => {
        this.socketMap.set(p.userId, p.socketId);
        // Create initiator peers for existing participants
        this.createPeer(p.userId, true);

        // Dispatch to UI to show placeholder
        window.dispatchEvent(
          new CustomEvent("session:user-joined", {
            detail: { userId: p.userId, userName: p.userName },
          })
        );
      });
    });

    // Receive chat history when joining
    socket.on("session:chat-history", ({ messages }) => {
      console.log(`[WebRTC] Received ${messages.length} chat history messages`);
      messages.forEach((msg) => {
        window.dispatchEvent(
          new CustomEvent("session:chat-message", {
            detail: msg,
          })
        );
      });
    });

    // New user joined (We are existing user)
    socket.on(
      "session:participant-joined",
      ({ userId, userName, socketId }) => {
        console.log(`[WebRTC] Participant joined: ${userName} (${userId})`);
        this.socketMap.set(userId, socketId);

        // Dispatch event for UI
        window.dispatchEvent(
          new CustomEvent("session:user-joined", {
            detail: { userId, userName },
          })
        );
        // Note: We don't create peer here, we wait for their Offer.
      }
    );

    // User left
    socket.on("session:participant-left", ({ userId }) => {
      console.log(`[WebRTC] Participant left: ${userId}`);
      this.socketMap.delete(userId);
      this.removePeer(userId);

      // Dispatch event for UI
      window.dispatchEvent(
        new CustomEvent("session:user-left", {
          detail: { userId },
        })
      );
    });

    // Chat handling
    socket.on("session:chat-message", (data) => {
      window.dispatchEvent(
        new CustomEvent("session:chat-message", {
          detail: data,
        })
      );
    });

    // WebRTC Signaling: Offer
    socket.on("session:offer", ({ fromUserId, offer }) => {
      console.log(`[WebRTC] Received offer from ${fromUserId}`);
      this.handleSignal(fromUserId, offer, false);
    });

    // WebRTC Signaling: Answer
    socket.on("session:answer", ({ fromUserId, answer }) => {
      console.log(`[WebRTC] Received answer from ${fromUserId}`);
      this.handleSignal(fromUserId, answer, true);
    });

    // WebRTC Signaling: ICE Candidate
    socket.on("session:ice-candidate", ({ fromUserId, candidate }) => {
      console.log(`[WebRTC] Received candidate from ${fromUserId}`);
      const peer = this.peers.get(fromUserId);
      if (peer) peer.signal(candidate);
    });

    // Handle session errors
    socket.on("session:error", ({ message }) => {
      console.error("[WebRTC] Session error:", message);
      window.dispatchEvent(
        new CustomEvent("session:error", { detail: { message } })
      );
    });

    // Remote Media State Changes
    socket.on("session:participant-video-toggled", (data) => {
      window.dispatchEvent(
        new CustomEvent("session:participant-video-toggled", { detail: data })
      );
    });

    socket.on("session:participant-audio-toggled", (data) => {
      window.dispatchEvent(
        new CustomEvent("session:participant-audio-toggled", { detail: data })
      );
    });

    socket.on("session:participant-screen-sharing", (data) => {
      window.dispatchEvent(
        new CustomEvent("session:participant-screen-sharing", { detail: data })
      );
    });

    // Session ended by host
    socket.on("session:ended", (data) => {
      console.log("[WebRTC] Session ended by host");
      window.dispatchEvent(new CustomEvent("session:ended", { detail: data }));
    });
  }

  /**
   * Handle reconnection - rejoin session and recreate peers
   */
  async handleReconnection(sessionId, userName) {
    try {
      console.log("[WebRTC] Handling reconnection...");

      // Clear existing peers
      this.peers.forEach((peer) => peer.destroy());
      this.peers.clear();
      this.socketMap.clear();

      // Rejoin session
      this.socket.emit("session:join", { sessionId, userName });

      // Notify UI
      window.dispatchEvent(
        new CustomEvent("session:reconnected", {
          detail: { message: "Reconnected to session" },
        })
      );
    } catch (error) {
      console.error("[WebRTC] Reconnection error:", error);
    }
  }

  /**
   * Handle incoming signal (Offer or Answer)
   */
  handleSignal(userId, signalData, isAnswer) {
    // If no peer exists and it's an offer, create non-initiator peer
    if (!this.peers.has(userId) && !isAnswer) {
      this.createPeer(userId, false);
    }

    const peer = this.peers.get(userId);
    if (peer) {
      peer.signal(signalData);
    } else {
      console.warn(`[WebRTC] Ignored signal from unknown peer ${userId}`);
    }
  }

  /**
   * Create a peer connection
   * @param {string} userId - Remote user ID
   * @param {boolean} initiator - Whether we initiate the connection
   */
  createPeer(userId, initiator) {
    if (this.peers.has(userId)) {
      console.warn(`[WebRTC] Peer ${userId} already exists`);
      return;
    }

    const peer = new Peer({
      initiator,
      stream: this.localStream,
      trickle: true,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          // TURN server - Uncomment and configure when available
          // {
          //   urls: "turn:your-turn-server.com:3478",
          //   username: "turnuser",
          //   credential: "turnpass"
          // }
        ],
        sdpSemantics: "unified-plan",
      },
    });

    // Handle peer signals
    peer.on("signal", (signal) => {
      const targetSocketId = this.socketMap.get(userId);
      if (!targetSocketId) {
        console.error(
          `[WebRTC] No socketId found for user ${userId}, cannot send signal`
        );
        return;
      }

      if (signal.type === "offer") {
        this.socket.emit("session:offer", {
          sessionId: this.sessionId,
          targetSocketId,
          offer: signal,
        });
      } else if (signal.type === "answer") {
        this.socket.emit("session:answer", {
          sessionId: this.sessionId,
          targetSocketId,
          answer: signal,
        });
      } else if (signal.candidate) {
        this.socket.emit("session:ice-candidate", {
          sessionId: this.sessionId,
          targetSocketId,
          candidate: signal, // simple-peer sends candidate object
        });
      }
    });

    // Handle incoming stream
    peer.on("stream", (remoteStream) => {
      console.log(`[WebRTC] Received stream from ${userId}`);
      window.dispatchEvent(
        new CustomEvent("webrtc:stream", {
          detail: { userId, stream: remoteStream },
        })
      );
    });

    // Handle errors
    peer.on("error", (err) => {
      console.error(`[WebRTC] Peer error with ${userId}:`, err);

      // Auto-retry connection for certain errors
      if (err.code === "ERR_CONNECTION_FAILURE") {
        console.log(`[WebRTC] Attempting to reconnect to peer ${userId}`);
        setTimeout(() => {
          if (this.peers.has(userId)) {
            this.removePeer(userId);
            // Recreate peer if we're the initiator
            const wasInitiator = initiator;
            if (wasInitiator) {
              this.createPeer(userId, true);
            }
          }
        }, 2000);
      } else {
        // For other errors, just remove the peer
        this.removePeer(userId);
      }
    });

    // Handle close
    peer.on("close", () => {
      console.log(`[WebRTC] Peer connection closed: ${userId}`);
      this.removePeer(userId);
    });

    this.peers.set(userId, peer);
  }

  /**
   * Remove and cleanup peer connection
   * @param {string} userId - User ID
   */
  removePeer(userId) {
    const peer = this.peers.get(userId);
    if (peer) {
      peer.destroy();
      this.peers.delete(userId);
      console.log(`[WebRTC] Removed peer: ${userId}`);

      window.dispatchEvent(
        new CustomEvent("webrtc:peer-removed", {
          detail: { userId },
        })
      );
    }
  }

  /**
   * Toggle local audio
   * @returns {boolean} New audio state (true = enabled)
   */
  toggleAudio() {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;

      if (this.socket) {
        this.socket.emit("session:toggle-audio", {
          sessionId: this.sessionId,
          enabled: audioTrack.enabled,
        });
      }
      return audioTrack.enabled;
    }
    return false;
  }

  /**
   * Toggle local video
   * @returns {boolean} New video state (true = enabled)
   */
  toggleVideo() {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;

      if (this.socket) {
        this.socket.emit("session:toggle-video", {
          sessionId: this.sessionId,
          enabled: videoTrack.enabled,
        });
      }
      return videoTrack.enabled;
    }
    return false;
  }

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    // ... (Implementation similar to before, but use this.socket.emit)
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });

      console.log("[WebRTC] Screen share started");

      // Replace video track for all peers
      const screenTrack = screenStream.getVideoTracks()[0];
      this.peers.forEach((peer) => {
        const sender = peer._pc
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      if (this.socket) {
        this.socket.emit("session:screen-share-start", {
          sessionId: this.sessionId,
        });
      }

      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error("[WebRTC] Screen share error:", error);
      throw new Error("Unable to start screen sharing");
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare() {
    if (!this.localStream) return;

    console.log("[WebRTC] Screen share stopped");

    // Restore original video track
    const videoTrack = this.localStream.getVideoTracks()[0];
    this.peers.forEach((peer) => {
      const sender = peer._pc
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    if (this.socket) {
      this.socket.emit("session:screen-share-stop", {
        sessionId: this.sessionId,
      });
    }
  }

  /**
   * Leave session and cleanup
   */
  leaveSession() {
    console.log("[WebRTC] Leaving session");

    this.peers.forEach((peer) => peer.destroy());
    this.peers.clear();
    this.socketMap.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.socket) {
      this.socket.emit("session:leave", { sessionId: this.sessionId });
      this.socket.disconnect();
      this.socket = null;
    }

    this.sessionId = null;
    this.isInitialized = false;
  }

  // Methods for VideoRoom to poll if needed
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Send chat message
   */
  sendChatMessage(text, user) {
    if (!this.socket || !this.sessionId) return;

    this.socket.emit("session:chat-message", {
      sessionId: this.sessionId,
      message: text,
      // userId inferred from auth on backend
    });
  }
}

const webrtcService = new WebRTCService();
export default webrtcService;
