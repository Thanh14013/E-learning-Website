
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Course from "../models/course.model.js";
import Discussion from "../models/discussion.model.js";

import Comment from "../models/comment.model.js";
import Chapter from "../models/chapter.model.js";
import Lesson from "../models/lesson.model.js";
import Quiz from "../models/quiz.model.js";
import Question from "../models/question.model.js";
import QuizAttempt from "../models/quizAttempt.model.js";
import Progress from "../models/progress.model.js";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

// Load env
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

const seedStudents = async () => {
    await connectDB();

    try {
        // 1. Identify Teacher to get courses
        const teacher = await User.findOne({ fullName: { $regex: /Nguyễn Văn Thanh/i }, role: "teacher" });
        if (!teacher) {
            console.error("Teacher not found.");
            process.exit(1);
        }

        // 2. Get all courses by this teacher
        const courses = await Course.find({ teacherId: teacher._id });
        if (courses.length === 0) {
            console.error("No courses found for this teacher. Run seed_courses.js first.");
            process.exit(1);
        }

        console.log(`Found ${courses.length} courses.`);

        // 3. Find or Create 10 Students
        const excludeEmail = "thanh14704@gmail.com";
        let students = await User.find({ 
            role: "student", 
            email: { $ne: excludeEmail } 
        }).limit(10);

        console.log(`Found ${students.length} existing students.`);

        // Create more if needed
        if (students.length < 10) {
            const needed = 10 - students.length;
            console.log(`Creating ${needed} new students...`);
            
            for (let i = 0; i < needed; i++) {
                const randomId = Math.floor(Math.random() * 100000);
                const newStudent = await User.create({
                    fullName: `Test Student ${randomId}`,
                    email: `student_test_${randomId}@gmail.com`,
                    password: "password123", // Will be hashed by pre-save
                    role: "student",
                    isVerified: true
                });
                students.push(newStudent);
            }
        }

        // 4. Enroll Students & Add Data
        for (const student of students) {
            console.log(`Processing student: ${student.fullName}`);

            for (const course of courses) {
                // Check if already enrolled
                const isEnrolled = course.enrolledStudents.includes(student._id);
                if (!isEnrolled) {
                    // Enroll
                    course.enrolledStudents.push(student._id);
                    // Update user side as well
                    await User.findByIdAndUpdate(student._id, {
                        $addToSet: { enrolledCourses: course._id }
                    });
                }

                // Add Rating (3-5 stars)
                // Check if already reviewed
                const alreadyReviewed = course.reviews.some(r => r.userId.toString() === student._id.toString());
                if (!alreadyReviewed) {
                    const rating = getRandomInt(3, 5);
                    const review = {
                        userId: student._id,
                        rating: rating,
                        comment: `This is a generated review with ${rating} stars.`,
                        createdAt: new Date()
                    };
                    course.reviews.push(review);
                }
            }
        }

        // Save all courses updates (ratings & enrollments)
        console.log("Saving course updates...");
        for (const course of courses) {
            if (course.reviews.length > 0) {
                const totalRating = course.reviews.reduce((acc, r) => acc + r.rating, 0);
                course.rating = totalRating / course.reviews.length;
                course.totalReviews = course.reviews.length;
            }
            await course.save();
        }

        // 5. Add Discussions & Comments
        console.log("Generating discussions and comments...");
        
        for (const course of courses) {
            // Course level discussion
            if (Math.random() > 0.5) { 
                 const student = students[getRandomInt(0, students.length - 1)];
                 const discussion = await Discussion.create({
                     courseId: course._id,
                     userId: student._id,
                     title: `Discussion about ${course.title}`,
                     content: "General query about the course structure.",
                     likes: [students[getRandomInt(0, students.length - 1)]._id]
                 });
                 // Comments
                 const numComments = getRandomInt(1, 3);
                 for (let k = 0; k < numComments; k++) {
                     const commenter = students[getRandomInt(0, students.length - 1)];
                     await Comment.create({
                         discussionId: discussion._id,
                         userId: commenter._id,
                         content: `I agree! This is useful.`,
                         likes: []
                     });
                 }
            }

            // Lesson level discussions
            const chapters = await Chapter.find({ courseId: course._id });
            for (const chapter of chapters) {
                const lessons = await Lesson.find({ chapterId: chapter._id });
                for (const lesson of lessons) {
                    if (Math.random() > 0.7) { // 30% chance per lesson
                        const student = students[getRandomInt(0, students.length - 1)];
                        const discussion = await Discussion.create({
                            courseId: course._id,
                            lessonId: lesson._id,
                            userId: student._id,
                            title: `Question on ${lesson.title}`,
                            content: "I didn't understand the part about X. Can someone explain?",
                            likes: []
                        });
                        
                        // Comments
                        const numComments = getRandomInt(0, 2);
                        for (let k = 0; k < numComments; k++) {
                            const commenter = students[getRandomInt(0, students.length - 1)];
                            await Comment.create({
                                discussionId: discussion._id,
                                userId: commenter._id,
                                content: `Sure, it basically means...`,
                                likes: []
                            });
                        }
                    }
                }
            }
        }

        // 6. Delete old Activity Data (to ensure clean charts)
        console.log("Cleaning up old progress and quiz attempts...");
        await Progress.deleteMany({});
        await QuizAttempt.deleteMany({});

        // 7. Add Quiz Attempts & Progress (For valid analytics)
        console.log("Generating quiz attempts and progress...");
        
        let globalEnrollmentIndex = 0;

        for (const student of students) {
             for (const course of courses) {
                 // 1. Progress (Simulate enrollment history)
                 // Distribute evenly over last 30 days (0-29)
                 // This ensures "at least 1, max 10 per day" given 100 enrollments.
                 // Cycle: 0, 1, 2 ... 29, 0, 1 ...
                 const daysAgo = globalEnrollmentIndex % 30;
                 globalEnrollmentIndex++;

                 const enrollmentDate = new Date();
                 enrollmentDate.setDate(enrollmentDate.getDate() - daysAgo);
                 // Randomize time within that day to avoid clashing exactly
                 enrollmentDate.setHours(getRandomInt(8, 20), getRandomInt(0, 59));
                 
                 // Find first lesson of course
                 const firstChapter = await Chapter.findOne({ courseId: course._id }).sort({ order: 1 });
                 if (firstChapter) {
                     const firstLesson = await Lesson.findOne({ chapterId: firstChapter._id }).sort({ order: 1 });
                     if (firstLesson) {
                         // Create progress (Proxy for enrollment)
                         await Progress.create({
                             userId: student._id,
                             courseId: course._id,
                             lessonId: firstLesson._id,
                             watchedDuration: 10,
                             videoProgressPercent: 10,
                             createdAt: enrollmentDate, 
                             updatedAt: enrollmentDate
                         });
                     }
                 }

                 // 2. Active Student Activity (Quiz Attempt)
                 // Activity must be in last 7 days to be "Active"
                 // Make sure Activity Date >= Enrollment Date
                 if (Math.random() > 0.3) {
                     const sevenDaysAgo = new Date();
                     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                     
                     // Intersection: Must be after enrollment AND within last 7 days
                     // If enrollment was yesterday (1 day ago), activity must be yesterday or today.
                     // If enrollment was 20 days ago, activity can be anywhere in last 7 days.
                     let minDate = enrollmentDate > sevenDaysAgo ? enrollmentDate : sevenDaysAgo;
                     
                     // Random date between minDate and Now
                     const now = new Date();
                     const timeDiff = now.getTime() - minDate.getTime();
                     if (timeDiff >= 0) {
                        const randomOffset = Math.floor(Math.random() * (timeDiff + 1));
                        const activeDate = new Date(minDate.getTime() + randomOffset);

                        // Find a quiz
                        const quiz = await Quiz.findOne({ courseId: course._id });
                        if (quiz) {
                            const questions = await Question.find({ quizId: quiz._id });
                            
                            // Create answers
                            const answers = questions.map(q => ({
                                questionId: q._id,
                                selectedOption: 0 // Always correct
                            }));

                            await QuizAttempt.create({
                                quizId: quiz._id,
                                userId: student._id,
                                answers: answers,
                                score: questions.length,
                                percentage: 100,
                                isPassed: true,
                                attemptNumber: 1,
                                startedAt: activeDate,
                                submittedAt: activeDate,
                                createdAt: activeDate,
                                updatedAt: activeDate
                            });
                        }
                     }
                 }
             }
        }
        
        console.log("Seed Students & Interactions Completed!");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding students:", error.message);
        console.error(error);
        process.exit(1);
    }
};

seedStudents();
