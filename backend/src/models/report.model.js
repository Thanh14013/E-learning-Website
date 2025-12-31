import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["discussion", "comment", "course"],
      required: true,
      index: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    contentPreview: {
      type: String,
      maxlength: 500,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: Date,
    approvedAt: Date,
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
