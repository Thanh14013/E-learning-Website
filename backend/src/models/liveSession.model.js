import mongoose from "mongoose";

/**
 * @typedef {Object} LiveSession
 * @property {ObjectId} courseId - Course reference
 * @property {ObjectId} hostId - User reference (teacher/host)
 * @property {String} title - Session title
 * @property {String} description - Session description
 * @property {Date} scheduledAt - Scheduled start time
 * @property {Array<Object>} participants - Array of participant info
 * @property {String} recordingUrl - URL to session recording (Cloudinary)
 * @property {String} status - Session status: 'scheduled', 'live', 'ended', 'cancelled'
 * @property {Date} startedAt - Actual start time
 * @property {Date} endedAt - Actual end time
 * @property {Number} duration - Session duration in minutes
 */
const liveSessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    scheduledAt: {
      type: Date,
      required: [true, "Scheduled time is required"],
      index: true,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
        },
        leftAt: {
          type: Date,
        },
        socketId: {
          type: String,
        },
        isVideoOn: {
          type: Boolean,
          default: true,
        },
        isAudioOn: {
          type: Boolean,
          default: true,
        },
        isScreenSharing: {
          type: Boolean,
          default: false,
        },
        handRaised: {
          type: Boolean,
          default: false,
        },
      },
    ],
    recordingUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
      index: true,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    messages: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
liveSessionSchema.index({ courseId: 1, status: 1 });
liveSessionSchema.index({ hostId: 1, scheduledAt: -1 });
liveSessionSchema.index({ scheduledAt: 1, status: 1 });

// Virtual to check if session is upcoming
liveSessionSchema.virtual("isUpcoming").get(function () {
  return this.status === "scheduled" && this.scheduledAt > new Date();
});

// Method to add participant
liveSessionSchema.methods.addParticipant = function (userId, socketId) {
  const existingParticipant = this.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );

  if (existingParticipant) {
    existingParticipant.socketId = socketId;
    existingParticipant.joinedAt = new Date();
    existingParticipant.leftAt = null;
  } else {
    this.participants.push({
      userId,
      socketId,
      joinedAt: new Date(),
    });
  }

  return this.save();
};

// Method to remove participant
liveSessionSchema.methods.removeParticipant = function (userId) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );

  if (participant) {
    participant.leftAt = new Date();
    participant.socketId = null;
  }

  return this.save();
};

// Method to update participant state
liveSessionSchema.methods.updateParticipantState = function (userId, state) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString()
  );

  if (participant) {
    Object.assign(participant, state);
  }

  return this.save();
};

// Method to add chat message
liveSessionSchema.methods.addMessage = function (userId, userName, message) {
  this.messages.push({
    userId,
    userName,
    message,
    timestamp: new Date(),
  });

  // Keep only last 500 messages to avoid document size issues
  if (this.messages.length > 500) {
    this.messages = this.messages.slice(-500);
  }

  return this.save();
};

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSession;
