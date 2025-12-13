import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
    {
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        answers: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Question",
                    required: true,
                },

                // multiple choice → number index
                selectedOption: { type: Number },

                // true/false → boolean
                selectedBoolean: { type: Boolean },

                // fill blank → text
                filledText: { type: String },

                // essay → text
                essayAnswer: { type: String },
            },
        ],

        score: {
            type: Number,
            default: 0,
        },

        isPassed: {
            type: Boolean,
            default: false,
        },

        attemptNumber: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index to quickly get attempts of user for quiz
attemptSchema.index({ quizId: 1, userId: 1 });

const QuizAttempt = mongoose.model("QuizAttempt", attemptSchema);

export default QuizAttempt;