
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lesson.model.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/question.model.js";
import path from "path";
import { fileURLToPath } from "url";

// Load env vars
// We need to point to the root backend .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
};

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const categories = [
    "Programming", "Frontend", "Backend", "Full Stack", "Nodejs", "Reactjs", "Python"
];

const videoLinks = [
    "https://www.youtube.com/watch?v=ReK0Uo2e41w", // General programming
    "https://www.youtube.com/watch?v=SccSCuHhOw0", // Nodejs
    "https://www.youtube.com/watch?v=Ke90Tje7VS0", // React
    "https://www.youtube.com/watch?v=_uQrJ0TkZlc", // Python
    "https://www.youtube.com/watch?v=zJSY8tbf_ys", // Frontend
];

const seedCourses = async () => {
    await connectDB();

    try {
        // 1. Find Teacher
        // Use a regex to match loosely or exact string if known. 
        // User said "Nguyễn Văn Thanh"
        const teacher = await User.findOne({ fullName: { $regex: /Nguyễn Văn Thanh/i }, role: "teacher" });

        if (!teacher) {
            console.error("Teacher 'Nguyễn Văn Thanh' not found! Please create this user first.");
            process.exit(1);
        }

        console.log(`Found teacher: ${teacher.fullName} (${teacher._id})`);

        // 2. Clear old data
        console.log("Clearing old courses and related data...");
        await Course.deleteMany({});
        await Chapter.deleteMany({});
        await Lesson.deleteMany({});
        await Quiz.deleteMany({});
        await Question.deleteMany({});
        await Chapter.deleteMany({});
        await Lesson.deleteMany({});
        await Quiz.deleteMany({});
        await Question.deleteMany({});

        // 3. Create 10 Courses
        const coursesToCreate = 10;
        
        for (let i = 1; i <= coursesToCreate; i++) {
            const courseTitle = `Mastering ${categories[i % categories.length]}`;
            const category = categories[i % categories.length]; 
            // User said: "tên của các chapter và lesson hãy bỏ hết chữ chapter và lesson ở đầu đi". 
            // Did not explicitly say Course text, but "Course 10: Mastering..." is in the screenshot.
            // I will keep "Course X:" if user didn't complain, but maybe cleaner is better.
            // Screenshot shows "Course 10: Mastering Full Stack". 
            // Let's stick to user request: "chapter và lesson".
            
            console.log(`Creating course ${i}/${coursesToCreate}: ${courseTitle}`);

            // Create Course
            const newCourse = await Course.create({
                title: courseTitle,
                description: `This is a comprehensive course about ${category}. You will learn everything from basics to advanced topics. Generated for testing purposes.`,
                teacherId: teacher._id,
                category: category,
                level: "beginner",
                isPublished: true,
                approvalStatus: "approved",
                approvedAt: new Date(),
                thumbnail: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
                rating: 0,
                totalReviews: 0
            });

            // Create Chapters (3-5)
            const numChapters = getRandomInt(3, 5);
            for (let c = 1; c <= numChapters; c++) {
                const newChapter = await Chapter.create({
                    courseId: newCourse._id,
                    title: `Getting Started with Module ${c}`, // Removed "Chapter ${c}: "
                    order: c
                });

                // Create Lessons (3-5)
                const numLessons = getRandomInt(3, 5);
                for (let l = 1; l <= numLessons; l++) {
                    const videoUrl = videoLinks[getRandomInt(0, videoLinks.length - 1)];
                    const newLesson = await Lesson.create({
                        chapterId: newChapter._id,
                        title: `Topic Overview`, // Removed "Lesson ${l}: "
                        content: `<p>This is the content for lesson ${l}. Watch the video to learn more.</p>`,
                        videoUrl: videoUrl,
                        videoDuration: getRandomInt(60, 600),
                        order: l,
                        isPreview: l === 1
                    });

                    // Create Quizzes (3-5) per lesson
                    const numQuizzes = getRandomInt(3, 5);
                    for (let q = 1; q <= numQuizzes; q++) {
                        const newQuiz = await Quiz.create({
                            courseId: newCourse._id,
                            lessonId: newLesson._id,
                            title: `Quiz for Lesson ${l}`, // Removed "Quiz ${q} for..."? Maybe "Topic Quiz"? 
                            // User said 'leave only title'. "Quiz for Lesson X" is a title.
                            // I'll keep "Quiz for Lesson ${l}" but maybe remove "Lesson"? 
                            // "Quiz ${q}" is sufficient?
                            // Let's use "Topic Mastery Quiz ${q}"
                            passingScore: 70, 
                            attemptsAllowed: 3,
                            isPublished: true,
                            order: q
                        });


                        // Create Questions (3-5) per quiz
                        const numQuestions = getRandomInt(3, 5);
                        for (let qs = 1; qs <= numQuestions; qs++) {
                            // Multiple choice, multiple answers possible? 
                            // User said "trắc nghiệm nhiều đáp án, và đáp án luôn là đáp án đầu tiên".
                            // This usually means ONE correct answer out of many options? Or Multiple Select? "trắc nghiệm nhiều đáp án" can mean Multiple Choice (Select One) or Multiple Select.
                            // "đáp án luôn là đáp án đầu tiên" (answer is always the first one) implies there is one correct option, and it's at index 0.
                            // If `correctOption` is a Number, it supports Single Select key.
                            // If `correctOption` supports array, it's Multiple Select.
                            // Model `question.model.js` has `correctOption: { type: Number }`. So it is Single Select (one correct answer).
                            
                            const options = [
                                `Correct Answer for Q${qs}`,
                                `Wrong Answer 1`,
                                `Wrong Answer 2`,
                                `Wrong Answer 3`
                            ];

                            await Question.create({
                                quizId: newQuiz._id,
                                type: "multiple_choice",
                                questionText: `Question ${qs}: What is the correct answer?`,
                                options: options,
                                correctOption: 0, // First one is correct
                                explanation: "The first option is always correct as per requirements.",
                                order: qs
                            });
                        }
                    }
                }
            }
        }

        console.log("Seed Courses Completed Successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding courses:", error);
        process.exit(1);
    }
};

seedCourses();
