import mongoose from "mongoose";

/**
 * Analytics Schema
 * Stores daily analytics data for each course
 */
const analyticsSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    activeStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedLessons: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalProgress: {
      type: Number,
      default: 0,
      min: 0,
    },
    newEnrollments: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageWatchTime: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
analyticsSchema.index({ courseId: 1, date: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
