import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
    {
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Lesson title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
        },
        content: {
            type: String, // rich text (HTML)
        },
        videoUrl: {
            type: String, // Cloudinary video URL
        },
        videoDuration: {
            type: Number, // seconds
            min: 0,
        },
        resources: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                type: {
                    type: String,
                    enum: ["pdf", "ppt", "doc", "image", "link", "video"],
                    required: true,
                },
            },
        ],
        order: {
            type: Number,
            required: true,
            min: 1,
        },
        isPreview: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

lessonSchema.index({ chapterId: 1, order: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
