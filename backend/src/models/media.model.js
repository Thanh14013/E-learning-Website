import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
    {
        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ["video", "resource", "image", "audio", "other"],
            required: true,
        },

        url: {
            type: String,
            required: true,
        },

        filename: {
            type: String,
            required: true,
        },

        size: {
            type: Number, // bytes
            default: 0,
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    { timestamps: true }
);

mediaSchema.index({ lessonId: 1, type: 1 });

const Media = mongoose.model("Media", mediaSchema);

export default Media;