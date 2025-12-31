import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["multiple_choice", "true_false", "essay", "fill_blank"],
      required: true,
    },

    questionText: {
      type: String,
      required: [true, "Please provide question text."],
    },

    // Multiple choice
    options: {
      type: [String],
      default: undefined,
    },

    correctOption: {
      type: Number, // index of options[]
    },

    // True/False
    correctBoolean: {
      type: Boolean,
    },

    // Fill in the blank
    correctText: {
      type: String,
    },

    // Explanation for the answer (optional)
    explanation: {
      type: String,
      maxlength: [1000, "Explanation cannot exceed 1000 characters"],
    },

    order: {
        type: Number,
        default: 1
    },

    // Essay: no correct answer stored
  },
  {
    timestamps: true,
  }
);

// text search on question
questionSchema.index({ questionText: "text" });

const Question = mongoose.model("Question", questionSchema);

export default Question;
