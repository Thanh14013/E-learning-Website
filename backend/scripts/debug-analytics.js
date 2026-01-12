import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Models
import User from '../src/models/user.model.js';
import Course from '../src/models/course.model.js';
import Quiz from '../src/models/quiz.model.js';
import QuizAttempt from '../src/models/quizAttempt.model.js';
import Progress from '../src/models/progress.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const runDebug = async () => {
    await connectDB();

    const email = 'vu1470413@gmail.com'; // From screenshot
    const user = await User.findOne({ email });

    if (!user) {
        console.log('User not found:', email);
        return;
    }
    console.log('User found:', user._id, user.fullName);

    // Find courses enrolled
    const courses = await Course.find({ enrolledStudents: user._id });
    console.log(`User is enrolled in ${courses.length} courses`);

    for (const course of courses) {
        console.log(`\nChecking Course: ${course.title} (${course._id})`);

        // Count Quizzes
        const quizzes = await Quiz.find({ courseId: course._id });
        console.log(`Total Quizzes in Course: ${quizzes.length}`);

        // Count Attempts
        const quizIds = quizzes.map(q => q._id);
        const attempts = await QuizAttempt.find({
            userId: user._id,
            quizId: { $in: quizIds }
        });
        console.log(`Total Attempts by User: ${attempts.length}`);

        // Analyze Quizzes
        let completedCount = 0;
        for (const quiz of quizzes) {
            const qAttempts = attempts.filter(a => a.quizId.toString() === quiz._id.toString());
            const isPassed = qAttempts.some(a => a.isPassed);
            const attemptsUsed = qAttempts.length;
            const attemptsAllowed = quiz.attemptsAllowed || 100; // Default if null? Check model
            const exhausted = attemptsUsed >= attemptsAllowed && attemptsUsed > 0;

            if (isPassed || exhausted) {
                completedCount++;
                console.log(`  - Quiz Completed: ${quiz.title} (Passed: ${isPassed}, Used: ${attemptsUsed}/${attemptsAllowed})`);
            }
        }

        const completionRate = quizzes.length > 0 ? (completedCount / quizzes.length) * 100 : 0;
        console.log(`Calculated Completion Rate: ${completionRate.toFixed(2)}% (${completedCount}/${quizzes.length})`);

        // Progress
        const progress = await Progress.find({ userId: user._id, courseId: course._id });
        console.log(`Progress Records: ${progress.length}`);
    }

    mongoose.disconnect();
};

runDebug();
