/**
 * WebRTC Service
 * Manages peer-to-peer video/audio connections for live sessions
 * Uses simple-peer library for WebRTC abstraction
 */

import Peer from "simple-peer";
import socketService from "./socketService";

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.peers = new Map(); // Map<userId, Peer>
    this.sessionId = null;
    this.isInitialized = false;
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
   */
  async joinSession(sessionId, userName) {
    if (!this.localStream) {
      throw new Error(
        "Local stream not initialized. Call initializeLocalStream first."
      );
    }

    this.sessionId = sessionId;
    this.isInitialized = true;

    // Setup Socket.IO listeners for WebRTC signaling
    this.setupSocketListeners();

    // Emit join event to server
    socketService.emit("session", "session:join", { sessionId, userName });

    console.log(`[WebRTC] Joined session: ${sessionId}`);
  }

  /**
   * Setup Socket.IO event listeners for WebRTC signaling
   */
  setupSocketListeners() {
    const socket = socketService.getNamespaceSocket("session");
    if (!socket) {
      console.error("[WebRTC] Session socket not available");
      return;
    }

    // User joined - create peer connection
    socket.on("session:user-joined", ({ userId, userName }) => {
      console.log(`[WebRTC] User joined: ${userName} (${userId})`);
      this.createPeer(userId, true); // We are the initiator
    });

    // User left - cleanup peer connection
    socket.on("session:user-left", ({ userId }) => {
      console.log(`[WebRTC] User left: ${userId}`);
      this.removePeer(userId);
    });

    // Receive WebRTC signal from peer
    socket.on("webrtc:signal", ({ from, signal }) => {
      console.log(`[WebRTC] Received signal from ${from}`);

      // If peer doesn't exist yet, create it (we are not the initiator)
      if (!this.peers.has(from)) {
        this.createPeer(from, false);
      }

      // Signal the peer
      const peer = this.peers.get(from);
      if (peer) {
        peer.signal(signal);
      }
    });

    // Handle session errors
    socket.on("session:error", ({ message }) => {
      console.error("[WebRTC] Session error:", message);
    });
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
        ],
      },
    });

    // Handle peer signals (send to other peer via server)
    peer.on("signal", (signal) => {
      console.log(`[WebRTC] Sending signal to ${userId}`);
      socketService.emit("session", "webrtc:signal", {
        to: userId,
        signal,
      });
    });

    // Handle incoming stream
    peer.on("stream", (remoteStream) => {
      console.log(`[WebRTC] Received stream from ${userId}`);
      // Emit custom event for UI to handle
      window.dispatchEvent(
        new CustomEvent("webrtc:stream", {
          detail: { userId, stream: remoteStream },
        })
      );
    });

    // Handle connection errors
    peer.on("error", (err) => {
      console.error(`[WebRTC] Peer error with ${userId}:`, err);
      this.removePeer(userId);
    });

    // Handle peer close
    peer.on("close", () => {
      console.log(`[WebRTC] Peer connection closed: ${userId}`);
      this.removePeer(userId);
    });

    this.peers.set(userId, peer);
    console.log(
      `[WebRTC] Created peer for ${userId} (initiator: ${initiator})`
    );
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

      // Emit custom event for UI to remove video
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
      console.log(
        `[WebRTC] Audio ${audioTrack.enabled ? "enabled" : "disabled"}`
      );

      // Notify other participants
      socketService.emit("session", "session:toggle-audio", {
        sessionId: this.sessionId,
        enabled: audioTrack.enabled,
      });

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
      console.log(
        `[WebRTC] Video ${videoTrack.enabled ? "enabled" : "disabled"}`
      );

      // Notify other participants
      socketService.emit("session", "session:toggle-video", {
        sessionId: this.sessionId,
        enabled: videoTrack.enabled,
      });

      return videoTrack.enabled;
    }
    return false;
  }

  /**
   * Start screen sharing
   * @returns {Promise<MediaStream>}
   */
  async startScreenShare() {
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

      // Notify participants
      socketService.emit("session", "session:screen-share", {
        sessionId: this.sessionId,
        enabled: true,
      });

      // Handle screen share stop (user clicks browser's "Stop sharing" button)
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

    // Notify participants
    socketService.emit("session", "session:screen-share", {
      sessionId: this.sessionId,
      enabled: false,
    });
  }

  /**
   * Leave session and cleanup
   */
  leaveSession() {
    console.log("[WebRTC] Leaving session");

    // Destroy all peer connections
    this.peers.forEach((peer) => {
      peer.destroy();
    });
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Emit leave event
    if (this.sessionId) {
      socketService.emit("session", "session:leave", {
        sessionId: this.sessionId,
      });
    }

    this.sessionId = null;
    this.isInitialized = false;

    console.log("[WebRTC] Session left, resources cleaned up");
  }

  /**
   * Get local stream
   * @returns {MediaStream|null}
   */
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Get all peer connections
   * @returns {Map<string, Peer>}
   */
  getPeers() {
    return this.peers;
  }

  /**
   * Check if audio is enabled
   * @returns {boolean}
   */
  isAudioEnabled() {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? audioTrack.enabled : false;
  }

  /**
   * Check if video is enabled
   * @returns {boolean}
   */
  isVideoEnabled() {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.enabled : false;
  }
}

// Singleton instance
const webrtcService = new WebRTCService();

export default webrtcService;
