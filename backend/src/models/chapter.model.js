import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Chapter title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
        },
        order: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { timestamps: true }
);

// Index to quickly sort and query chapters per course
chapterSchema.index({ courseId: 1, order: 1 });

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
