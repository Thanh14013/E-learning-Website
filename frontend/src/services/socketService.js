/**
 * Socket.IO Service
 * Manages Socket.IO connection and event handlers for real-time features
 * - Notifications
 * - Discussion updates
 * - Session updates
 * - Progress tracking
 */

import { io } from "socket.io-client";
import toastService from "./toastService.js";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
    this.contextCallbacks = new Map();
  }

  /**
   * Initialize socket connection
   * @param {string} token - JWT token for authentication
   */
  connect(token = null) {
    if (this.socket?.connected) {
      console.log("[socketService] Already connected");
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
    const options = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket"],
    };

    if (token) {
      options.auth = { token };
    }

    this.socket = io(socketUrl, options);
    this.setupConnectionHandlers();
    this.setupEventHandlers();

    console.log("[socketService] Connecting to", socketUrl);
  }

  /**
   * Setup connection/disconnection handlers
   */
  setupConnectionHandlers() {
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("[socketService] CONNECTED:", this.socket.id);
      // Connection events are logged but no toast shown to avoid noisy UI
      this.notifyContexts("connection", { connected: true });
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("[socketService] DISCONNECTED:", reason);

      if (reason === "io server disconnect") {
        // Server disconnected, manual reconnect needed
        this.socket.connect();
      } else {
        // Do not show connection toasts for disconnects to reduce noise
      }

      this.notifyContexts("connection", { connected: false, reason });
    });

    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      console.error("[socketService] Connection error:", error.message);

      // No toast shown here to avoid spamming the user; contexts can react to connection state
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(
        "[socketService] RECONNECTED after",
        attemptNumber,
        "attempts"
      );
      // No toast shown on reconnect to reduce noise
      this.notifyContexts("connection", { connected: true, reconnected: true });
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("[socketService] Reconnect attempt", attemptNumber);
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("[socketService] Reconnect error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("[socketService] Reconnect failed after max attempts");
      // No toast here to avoid unnecessary notifications
    });
  }

  /**
   * Setup all event handlers
   */
  setupEventHandlers() {
    // ========== NOTIFICATION EVENTS ==========
    this.socket.on("notification:new", (notification) => {
      console.log("[socketService] notification:new", notification);
      this.notifyContexts("notification:new", notification);

      // Show toast for important notifications
      if (notification?.title) {
        const toastType =
          notification.type === "error"
            ? "error"
            : notification.type === "warning"
            ? "warning"
            : "info";
        toastService[toastType](notification.title, {
          duration: notification.type === "error" ? 5000 : 3000,
        });
      }
    });

    this.socket.on("notification:count", (payload) => {
      console.log("[socketService] notification:count", payload);
      const count = typeof payload === "number" ? payload : payload?.count ?? 0;
      this.notifyContexts("notification:count", { count });
    });

    // ========== DISCUSSION EVENTS ==========
    // Join/Leave room events (client → server)
    // These are handled by components that call socket.emit

    // Discussion created
    this.socket.on("discussion:created", (data) => {
      console.log("[socketService] discussion:created", data);
      this.notifyContexts("discussion:created", data);

      if (data?.title) {
        toastService.info(`Thảo luận mới: ${data.title}`);
      }
    });

    // Comment created
    this.socket.on("comment:created", (data) => {
      console.log("[socketService] comment:created", data);
      this.notifyContexts("comment:created", data);

      if (data?.userName && data?.discussionTitle) {
        toastService.info(
          `${data.userName} đã bình luận trong "${data.discussionTitle}"`
        );
      }
    });

    // Discussion liked
    this.socket.on("discussion:liked", (data) => {
      console.log("[socketService] discussion:liked", data);
      this.notifyContexts("discussion:liked", data);
    });

    // Discussion updated
    this.socket.on("discussion:updated", (data) => {
      console.log("[socketService] discussion:updated", data);
      this.notifyContexts("discussion:updated", data);
    });

    // ========== SESSION EVENTS ==========
    // User joined session
    this.socket.on("session:user-joined", (data) => {
      console.log("[socketService] session:user-joined", data);
      this.notifyContexts("session:user-joined", data);

      if (data?.userName && data?.sessionTitle) {
        toastService.info(
          `${data.userName} đã tham gia "${data.sessionTitle}"`
        );
      }
    });

    // User left session
    this.socket.on("session:user-left", (data) => {
      console.log("[socketService] session:user-left", data);
      this.notifyContexts("session:user-left", data);
    });

    // Chat message in session
    this.socket.on("session:chat-message", (data) => {
      console.log("[socketService] session:chat-message", data);
      this.notifyContexts("session:chat-message", data);
    });

    // Screen share started/stopped
    this.socket.on("session:user-screen-share", (data) => {
      console.log("[socketService] session:user-screen-share", data);
      this.notifyContexts("session:user-screen-share", data);

      if (data?.userName) {
        const message = data.isSharing
          ? `${data.userName} đã bắt đầu chia sẻ màn hình`
          : `${data.userName} đã dừng chia sẻ màn hình`;
        toastService.info(message);
      }
    });

    // Hand raised
    this.socket.on("session:user-hand-raised", (data) => {
      console.log("[socketService] session:user-hand-raised", data);
      this.notifyContexts("session:user-hand-raised", data);
    });

    // Session started
    this.socket.on("session:started", (data) => {
      console.log("[socketService] session:started", data);
      this.notifyContexts("session:started", data);

      if (data?.title) {
        toastService.success(`Phiên học "${data.title}" đã bắt đầu`);
      }
    });

    // Session ended
    this.socket.on("session:ended", (data) => {
      console.log("[socketService] session:ended", data);
      this.notifyContexts("session:ended", data);

      if (data?.title) {
        toastService.info(`Phiên học "${data.title}" đã kết thúc`);
      }
    });

    // ========== PROGRESS EVENTS ==========
    this.socket.on("progress:updated", (data) => {
      console.log("[socketService] progress:updated", data);
      this.notifyContexts("progress:updated", data);
    });
  }

  /**
   * Register a context callback for specific events
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function
   */
  registerContextCallback(eventType, callback) {
    if (!this.contextCallbacks.has(eventType)) {
      this.contextCallbacks.set(eventType, new Set());
    }
    this.contextCallbacks.get(eventType).add(callback);
    console.log("[socketService] Registered callback for", eventType);
  }

  /**
   * Unregister a context callback
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   */
  unregisterContextCallback(eventType, callback) {
    const callbacks = this.contextCallbacks.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      console.log("[socketService] Unregistered callback for", eventType);
    }
  }

  /**
   * Notify all registered contexts about an event
   * @param {string} eventType - Event type
   * @param {any} data - Event data
   */
  notifyContexts(eventType, data) {
    const callbacks = this.contextCallbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `[socketService] Error in callback for ${eventType}:`,
            error
          );
        }
      });
    }
  }

  /**
   * Join a room (for namespaced events)
   * @param {string} namespace - Namespace (e.g., 'discussion', 'session')
   * @param {string} roomId - Room ID (e.g., courseId, sessionId)
   */
  joinRoom(namespace, roomId) {
    if (!this.socket?.connected) {
      console.warn("[socketService] Cannot join room: not connected");
      return;
    }

    const eventName = `${namespace}:join`;
    this.socket.emit(eventName, { roomId });
    console.log("[socketService] Joined room", namespace, roomId);
  }

  /**
   * Leave a room
   * @param {string} namespace - Namespace
   * @param {string} roomId - Room ID
   */
  leaveRoom(namespace, roomId) {
    if (!this.socket?.connected) {
      return;
    }

    const eventName = `${namespace}:leave`;
    this.socket.emit(eventName, { roomId });
    console.log("[socketService] Left room", namespace, roomId);
  }

  /**
   * Emit a custom event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn("[socketService] Cannot emit: not connected");
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.contextCallbacks.clear();
      console.log("[socketService] Disconnected");
    }
  }

  /**
   * Get socket instance (for direct access if needed)
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Check if connected
   */
  getConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
