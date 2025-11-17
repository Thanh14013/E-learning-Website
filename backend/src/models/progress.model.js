import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            required: true,
            index: true,
        },

        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },

        watchedDuration: {
            type: Number, // seconds
            default: 0,
        },

        isCompleted: {
            type: Boolean,
            default: false,
        },

        lastWatchedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;