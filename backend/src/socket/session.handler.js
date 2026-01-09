/**
 * Live Session Namespace Handler
 * Handles real-time video session events and WebRTC signaling
 * Namespace: /session
 */

import { socketAuth } from "../middleware/socketAuth.js";
import LiveSession from "../models/liveSession.model.js";

/**
 * Initialize Session Namespace
 * @param {Object} io - Socket.IO server instance
 */
export const initializeSessionNamespace = (io) => {
  // Create session namespace
  const sessionNamespace = io.of("/session");

  // Apply authentication middleware
  sessionNamespace.use(socketAuth);

  console.log("🎥 Session namespace initialized");

  // Namespace connection handler
  sessionNamespace.on("connection", (socket) => {
    console.log(`🎥 User ${socket.user.id} connected to session namespace`);

    /**
     * Join Video Session Room
     * Event: session:join
     * Payload: { sessionId: string, userName: string }
     */
    socket.on("session:join", async (data) => {
      try {
        const { sessionId, userName } = data;

        if (!sessionId) {
          socket.emit("session:error", { message: "Session ID is required" });
          return;
        }

        // Validate session exists and is live
        const session = await LiveSession.findById(sessionId);
        if (!session) {
          socket.emit("session:error", { message: "Session not found" });
          return;
        }

        if (session.status !== "live") {
          socket.emit("session:error", {
            message: `Session is not live (status: ${session.status})`,
          });
          return;
        }

        // Check participant limit (max 50 for mesh architecture)
        const currentParticipants =
          sessionNamespace.adapter.rooms.get(`session:${sessionId}`)?.size || 0;
        const MAX_PARTICIPANTS = 50;
        if (currentParticipants >= MAX_PARTICIPANTS) {
          socket.emit("session:error", {
            message: `Session is full (maximum ${MAX_PARTICIPANTS} participants)`,
          });
          return;
        }

        // Check if host
        const isHost = session.hostId.toString() === socket.user.id;

        // Check if already participant (active)
        const isParticipant = session.participants.some(
          (p) => p.userId.toString() === socket.user.id && !p.leftAt
        );

        // Waiting Room Logic - Enforced for all non-host users
        if (!isHost && !isParticipant) {
          await session.addToWaitingRoom(
            socket.user.id,
            socket.id,
            userName,
            socket.user.avatar
          );
          socket.join(`waiting:${sessionId}`);
          socket.emit("session:waiting", {
            message: "Waiting for host to accept...",
          });

          // Notify Host (broadcast to all in session room to be safe, or check if Host is there)
          // Ideally host is in `session:${sessionId}`.
          // Using sessionNamespace.to ensures everyone in the room gets it (including host if they are there).
          sessionNamespace.to(`session:${sessionId}`).emit("session:join-request", {
            userId: socket.user.id,
            userName: userName || socket.user.email,
            socketId: socket.id,
            avatar: socket.user.avatar,
            timestamp: new Date(),
          });
          console.log(`⏳ User ${socket.user.id} added to waiting room`);
          return;
        }

        // Add participant to DB
        await session.addParticipant(socket.user.id, socket.id);
        console.log(`✅ User ${socket.user.id} added to DB participants`);

        // Join session room
        socket.join(`session:${sessionId}`);
        console.log(`🎥 User ${socket.user.id} joined session: ${sessionId}`);

        // Store session info on socket
        socket.sessionId = sessionId;
        socket.userName = userName || socket.user.email;

        // Notify user of successful join
        socket.emit("session:joined", {
          sessionId,
          userId: socket.user.id,
          message: "Successfully joined session",
        });

        // Notify other participants
        socket.to(`session:${sessionId}`).emit("session:participant-joined", {
          userId: socket.user.id,
          userName: socket.userName,
          role: socket.user.role,
          socketId: socket.id, // Needed for WebRTC signaling target
        });

        // Send list of existing participants to the new user
        const room = sessionNamespace.adapter.rooms.get(`session:${sessionId}`);
        if (room) {
          const participants = [];
          room.forEach((socketId) => {
            const participantSocket = sessionNamespace.sockets.get(socketId);
            if (participantSocket && participantSocket.id !== socket.id) {
              participants.push({
                userId: participantSocket.user.id,
                userName: participantSocket.userName,
                role: participantSocket.user.role,
                socketId: participantSocket.id,
              });
            }
          });
          socket.emit("session:participants-list", { participants });
        }

        // Send chat history to new participant
        if (session.messages && session.messages.length > 0) {
          socket.emit("session:chat-history", {
            messages: session.messages.slice(-50), // Last 50 messages
          });
        }
      } catch (error) {
        console.error("Error joining session:", error.message);
        socket.emit("session:error", { message: "Failed to join session" });
      }
    });

    /**
     * Leave Video Session
     * Event: session:leave
     * Payload: { sessionId: string }
     */
    socket.on("session:leave", async (data) => {
      try {
        const { sessionId } = data;

        if (!sessionId) {
          socket.emit("session:error", { message: "Session ID is required" });
          return;
        }

        // Update participant in DB
        try {
          const session = await LiveSession.findById(sessionId);
          if (session) {
            await session.removeParticipant(socket.user.id);
            console.log(
              `✅ User ${socket.user.id} removed from DB participants`
            );
          }
        } catch (dbError) {
          console.error("Error updating DB on leave:", dbError.message);
        }

        // Leave session room
        socket.leave(`session:${sessionId}`);
        console.log(`🎥 User ${socket.user.id} left session: ${sessionId}`);

        // Notify user
        socket.emit("session:left", {
          sessionId,
          message: "Successfully left session",
        });

        // Notify other participants (AND self if needed, but self is leaving)
        // Actually, we want to notify everyone remaining in the room. 
        // socket.to excludes sender, which is fine for 'left' because sender is leaving.
        // BUT, if we want to be consistent: 
        sessionNamespace.to(`session:${sessionId}`).emit("session:participant-left", {
          userId: socket.user.id,
          userName: socket.userName,
        });
      } catch (error) {
        console.error("Error leaving session:", error.message);
        socket.emit("session:error", { message: "Failed to leave session" });
      }
    });

    /**
     * Approve Join Request (Host Only)
     * Event: session:approve-request
     * Payload: { sessionId: string, userId: string }
     */
    socket.on("session:approve-request", async (data) => {
      try {
        const { sessionId, userId } = data;
        const session = await LiveSession.findById(sessionId);
        if (!session) return;

        // Verify Host
        if (session.hostId.toString() !== socket.user.id) {
          socket.emit("session:error", { message: "Unauthorized" });
          return;
        }

        const entry = session.waitingRoom.find(
          (p) => p.userId.toString() === userId
        );
        if (!entry) return;

        await session.removeFromWaitingRoom(userId);
        
        // Add to participants + DB
        await session.addParticipant(userId, entry.socketId, entry.userName, entry.avatar);

        // Notify user
        if (entry.socketId) {
           const userSocket = sessionNamespace.sockets.get(entry.socketId);
           if (userSocket) {
             userSocket.leave(`waiting:${sessionId}`);
             userSocket.join(`session:${sessionId}`);
             
             // Tell user they are in
             userSocket.emit("session:approved", {
                sessionId,
                message: "Request approved",
             });
             
             // Send them the participants list so they can connect (important!)
             // We can construct it locally or query DB.
             // Actually, the user client expects `session:participants-list` to start initiating peers?
             // Or they wait for `participant-joined` events? 
             // Usually join flow emits `session:participants-list` to the joiner.
             // existing participants get `session:participant-joined`.
             
             // Let's send participants list to the approved user
             const updatedSession = await LiveSession.findById(sessionId); // refetch for participants
             userSocket.emit("session:participants-list", {
                 participants: updatedSession.participants
                   .filter(p => !p.leftAt && p.userId.toString() !== userId) // exclude self
                   .map(p => ({
                     userId: p.userId,
                     userName: p.userName || "User",
                     socketId: p.socketId,
                     isMuted: p.isMuted,
                     isVideoOff: p.isVideoOff
                 }))
             });
           }
        }
        
        // Broadcast to ALL (including Host)
        sessionNamespace.to(`session:${sessionId}`).emit("session:participant-joined", {
            userId: entry.userId,
            userName: entry.userName,
            socketId: entry.socketId,
            avatar: entry.avatar,
            isMuted: true,
            isVideoOff: true 
        });
        
        console.log(`✅ User ${userId} approved by host`);
      } catch (error) {
        console.error("Error approving request:", error.message);
      }
    });

    /**
     * Deny Join Request (Host Only)
     * Event: session:deny-request
     * Payload: { sessionId: string, userId: string }
     */
    socket.on("session:deny-request", async (data) => {
      try {
        const { sessionId, userId } = data;
        const session = await LiveSession.findById(sessionId);
        if (!session) return;

        if (session.hostId.toString() !== socket.user.id) return;

        const entry = session.waitingRoom.find(
          (p) => p.userId.toString() === userId
        );
        
        await session.removeFromWaitingRoom(userId);

        if (entry && entry.socketId) {
          sessionNamespace.to(entry.socketId).emit("session:denied", {
            sessionId,
            message: "Request denied by host",
          });
           const userSocket = sessionNamespace.sockets.get(entry.socketId);
           if (userSocket) {
             userSocket.leave(`waiting:${sessionId}`);
           }
        }
        console.log(`❌ User ${userId} denied by host`);
      } catch (error) {
        console.error("Error denying request:", error.message);
      }
    });

    /**
     * Kick Participant (Host Only)
     * Event: session:kick-participant
     * Payload: { sessionId: string, userId: string }
     */
    socket.on("session:kick-participant", async (data) => {
      try {
        const { sessionId, userId } = data;
        const session = await LiveSession.findById(sessionId);
        if (!session) return;

        if (session.hostId.toString() !== socket.user.id) return;

        const participant = session.participants.find(
          (p) => p.userId.toString() === userId && !p.leftAt
        );

        if (participant) {
          await session.removeParticipant(userId);
          
          if (participant.socketId) {
            sessionNamespace.to(participant.socketId).emit("session:kicked", {
              sessionId,
              message: "You have been removed from the session",
            });
            
             const userSocket = sessionNamespace.sockets.get(participant.socketId);
             if (userSocket) {
               userSocket.leave(`session:${sessionId}`);
             }
             
             // Broadcast to others that they left (or kicked)
            socket.to(`session:${sessionId}`).emit("session:participant-left", {
                userId: userId,
                userName: participant.userName || "User",
            });
          }
        }
        console.log(`👢 User ${userId} kicked by host`);
      } catch (error) {
         console.error("Error kicking participant:", error.message);
      }
    });

    /**
     * WebRTC Signaling - Send Offer
     * Event: session:offer
     * Payload: { sessionId: string, targetSocketId: string, offer: RTCSessionDescription }
     */
    socket.on("session:offer", (data) => {
      try {
        const { sessionId, targetSocketId, offer } = data;

        if (!sessionId || !targetSocketId || !offer) {
          socket.emit("session:error", { message: "Invalid offer data" });
          return;
        }

        // Forward offer to target peer
        sessionNamespace.to(targetSocketId).emit("session:offer", {
          sessionId,
          fromSocketId: socket.id,
          fromUserId: socket.user.id,
          fromUserName: socket.userName,
          offer,
        });

        console.log(
          `🎥 Offer sent from ${socket.user.id} to ${targetSocketId}`
        );
      } catch (error) {
        console.error("Error sending offer:", error.message);
        socket.emit("session:error", { message: "Failed to send offer" });
      }
    });

    /**
     * WebRTC Signaling - Send Answer
     * Event: session:answer
     * Payload: { sessionId: string, targetSocketId: string, answer: RTCSessionDescription }
     */
    socket.on("session:answer", (data) => {
      try {
        const { sessionId, targetSocketId, answer } = data;

        if (!sessionId || !targetSocketId || !answer) {
          socket.emit("session:error", { message: "Invalid answer data" });
          return;
        }

        // Forward answer to target peer
        sessionNamespace.to(targetSocketId).emit("session:answer", {
          sessionId,
          fromSocketId: socket.id,
          fromUserId: socket.user.id,
          answer,
        });

        console.log(
          `🎥 Answer sent from ${socket.user.id} to ${targetSocketId}`
        );
      } catch (error) {
        console.error("Error sending answer:", error.message);
        socket.emit("session:error", { message: "Failed to send answer" });
      }
    });

    /**
     * WebRTC Signaling - ICE Candidate
     * Event: session:ice-candidate
     * Payload: { sessionId: string, targetSocketId: string, candidate: RTCIceCandidate }
     */
    socket.on("session:ice-candidate", (data) => {
      try {
        const { sessionId, targetSocketId, candidate } = data;

        if (!sessionId || !targetSocketId || !candidate) {
          return;
        }

        // Forward ICE candidate to target peer
        sessionNamespace.to(targetSocketId).emit("session:ice-candidate", {
          sessionId,
          fromSocketId: socket.id,
          fromUserId: socket.user.id,
          candidate,
        });
      } catch (error) {
        console.error("Error sending ICE candidate:", error.message);
      }
    });

    /**
     * Toggle Video
     * Event: session:toggle-video
     * Payload: { sessionId: string, enabled: boolean }
     */
    socket.on("session:toggle-video", async (data) => {
      try {
        const { sessionId, enabled } = data;

        if (!sessionId || typeof enabled !== "boolean") {
          socket.emit("session:error", {
            message: "Invalid toggle video data",
          });
          return;
        }

        // Update participant state in DB
        try {
          const session = await LiveSession.findById(sessionId);
          if (session) {
            await session.updateParticipantState(socket.user.id, {
              isVideoOn: enabled,
            });
          }
        } catch (dbError) {
          console.error("Error updating video state in DB:", dbError.message);
        }

        // Broadcast video state change to other participants
        socket
          .to(`session:${sessionId}`)
          .emit("session:participant-video-toggled", {
            userId: socket.user.id,
            userName: socket.userName,
            videoEnabled: enabled,
          });

        console.log(
          `🎥 User ${socket.user.id} video: ${enabled ? "ON" : "OFF"}`
        );
      } catch (error) {
        console.error("Error toggling video:", error.message);
      }
    });

    /**
     * Toggle Audio
     * Event: session:toggle-audio
     * Payload: { sessionId: string, enabled: boolean }
     */
    socket.on("session:toggle-audio", async (data) => {
      try {
        const { sessionId, enabled } = data;

        if (!sessionId || typeof enabled !== "boolean") {
          socket.emit("session:error", {
            message: "Invalid toggle audio data",
          });
          return;
        }

        // Update participant state in DB
        try {
          const session = await LiveSession.findById(sessionId);
          if (session) {
            await session.updateParticipantState(socket.user.id, {
              isAudioOn: enabled,
            });
          }
        } catch (dbError) {
          console.error("Error updating audio state in DB:", dbError.message);
        }

        // Broadcast audio state change to other participants
        socket
          .to(`session:${sessionId}`)
          .emit("session:participant-audio-toggled", {
            userId: socket.user.id,
            userName: socket.userName,
            audioEnabled: enabled,
          });

        console.log(
          `🎥 User ${socket.user.id} audio: ${enabled ? "ON" : "OFF"}`
        );
      } catch (error) {
        console.error("Error toggling audio:", error.message);
      }
    });

    /**
     * Screen Share Started
     * Event: session:screen-share-start
     * Payload: { sessionId: string }
     */
    socket.on("session:screen-share-start", async (data) => {
      try {
        const { sessionId } = data;

        if (!sessionId) {
          socket.emit("session:error", { message: "Session ID is required" });
          return;
        }

        // Update participant state in DB
        try {
          const session = await LiveSession.findById(sessionId);
          if (session) {
            await session.updateParticipantState(socket.user.id, {
              isScreenSharing: true,
            });
          }
        } catch (dbError) {
          console.error(
            "Error updating screen share state in DB:",
            dbError.message
          );
        }

        // Notify other participants about screen sharing
        socket
          .to(`session:${sessionId}`)
          .emit("session:participant-screen-sharing", {
            userId: socket.user.id,
            userName: socket.userName,
            isSharing: true,
          });

        console.log(`🖥️ User ${socket.user.id} started screen sharing`);
      } catch (error) {
        console.error("Error starting screen share:", error.message);
      }
    });

    /**
     * Screen Share Stopped
     * Event: session:screen-share-stop
     * Payload: { sessionId: string }
     */
    socket.on("session:screen-share-stop", async (data) => {
      try {
        const { sessionId } = data;

        if (!sessionId) {
          return;
        }

        // Update participant state in DB
        try {
          const session = await LiveSession.findById(sessionId);
          if (session) {
            await session.updateParticipantState(socket.user.id, {
              isScreenSharing: false,
            });
          }
        } catch (dbError) {
          console.error(
            "Error updating screen share state in DB:",
            dbError.message
          );
        }

        // Notify other participants that screen sharing stopped
        socket
          .to(`session:${sessionId}`)
          .emit("session:participant-screen-sharing", {
            userId: socket.user.id,
            userName: socket.userName,
            isSharing: false,
          });

        console.log(`🖥️ User ${socket.user.id} stopped screen sharing`);
      } catch (error) {
        console.error("Error stopping screen share:", error.message);
      }
    });

    /**
     * Chat Message in Session
     * Event: session:chat-message
     * Payload: { sessionId: string, message: string }
     */
    socket.on("session:chat-message", async (data) => {
      try {
        const { sessionId, message } = data;

        if (!sessionId || !message) {
          socket.emit("session:error", { message: "Message is required" });
          return;
        }

        const messageData = {
          userId: socket.user.id,
          userName: socket.userName,
          message,
          timestamp: new Date().toISOString(),
        };

        // Persist message to DB
        try {
          const session = await LiveSession.findById(sessionId);
          if (session) {
            await session.addMessage(socket.user.id, socket.userName, message);
            console.log(`💾 Chat message saved to DB`);
          }
        } catch (dbError) {
          console.error("Error saving chat message:", dbError.message);
        }

        // Broadcast chat message to others ONLY
        socket
          .to(`session:${sessionId}`)
          .emit("session:chat-message", messageData);

        console.log(
          `💬 Chat message from ${socket.user.id} in session ${sessionId}`
        );

        console.log(
          `💬 Chat message from ${socket.user.id} in session ${sessionId}`
        );
      } catch (error) {
        console.error("Error sending chat message:", error.message);
        socket.emit("session:error", { message: "Failed to send message" });
      }
    });

    /**
     * Raise Hand
     * Event: session:raise-hand
     * Payload: { sessionId: string, raised: boolean }
     */
    socket.on("session:raise-hand", (data) => {
      try {
        const { sessionId, raised } = data;

        if (!sessionId || typeof raised !== "boolean") {
          socket.emit("session:error", { message: "Invalid raise hand data" });
          return;
        }

        // Broadcast hand raise status to all participants
        sessionNamespace
          .to(`session:${sessionId}`)
          .emit("session:participant-hand-raised", {
            userId: socket.user.id,
            userName: socket.userName,
            handRaised: raised,
            timestamp: new Date().toISOString(),
          });

        console.log(
          `✋ User ${socket.user.id} hand: ${raised ? "RAISED" : "LOWERED"}`
        );
      } catch (error) {
        console.error("Error raising hand:", error.message);
      }
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(
        `🎥 User ${socket.user.id} disconnected from session namespace`
      );

      // Update DB
      if (socket.sessionId) {
        try {
          const session = await LiveSession.findById(socket.sessionId);
          if (session) {
            await session.removeParticipant(socket.user.id);
            console.log(
              `✅ User ${socket.user.id} removed from DB on disconnect`
            );
          }
        } catch (dbError) {
          console.error("Error updating DB on disconnect:", dbError.message);
        }

        // Notify participants in the session
        socket
          .to(`session:${socket.sessionId}`)
          .emit("session:participant-left", {
            userId: socket.user.id,
            userName: socket.userName,
          });
      }
    });
  });

  return sessionNamespace;
};

export default initializeSessionNamespace;
