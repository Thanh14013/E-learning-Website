import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },

        lessonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lesson",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: [true, "Please provide quiz title."],
            trim: true,
        },

        duration: {
            type: Number, // minutes
            default: 0,
        },

        passingScore: {
            type: Number,
            required: true,
        },

        attemptsAllowed: {
            type: Number,
            default: 1,
        },

        isPublished: {
            type: Boolean,
            default: false,
        },

        order: {
            type: Number,
            default: 1
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to quickly find quiz by lesson + course
quizSchema.index({ courseId: 1, lessonId: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;