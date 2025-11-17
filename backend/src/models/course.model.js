import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Course title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
        },
        description: {
            type: String,
            maxlength: [2000, "Description cannot exceed 2000 characters"],
        },
        thumbnail: {
            type: String, // Cloudinary URL
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        category: {
            type: String,
            enum: ["Programming", "Design", "Business", "Language", "Other"],
            default: "Other",
            index: true,
        },
        level: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "beginner",
            index: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        enrolledStudents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        rating: {
            type: Number,
            min: 0,
            max: 10,
            default: 0,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Text search index (title + description)
courseSchema.index({ title: "text", description: "text" });

const Course = mongoose.model("Course", courseSchema);
export default Course;
