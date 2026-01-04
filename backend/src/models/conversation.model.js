import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      content: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date },
      isRead: { type: Boolean, default: false },
    },
    // Map of userId -> unread count. Ex: { "user1_id": 2, "user2_id": 0 }
    // Important: Any update to this map should use atomic operators to ensure data integrity
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    // To quickly check if it's a group chat or 1v1 (Teacher-Student is 1v1)
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Compound Index: Ensure fast lookup for exact participants
// Note: useful for searching "is there a convo between A and B?"
conversationSchema.index({ participants: 1 });

// Text index for searching group names (optional, but good practice)
conversationSchema.index({ groupName: "text" });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
