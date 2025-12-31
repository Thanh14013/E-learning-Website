
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const CourseSchema = new mongoose.Schema({
  title: String,
  enrolledStudents: [mongoose.Schema.Types.ObjectId],
  teacherId: mongoose.Schema.Types.ObjectId,
  isPublished: Boolean
});

// Check if model exists to avoid recompiling
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkEnrollments = async () => {
    await connectDB();
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses.`);
    courses.forEach(c => {
        console.log(`Course: "${c.title}" | Published: ${c.isPublished} | Enrollments: ${c.enrolledStudents ? c.enrolledStudents.length : 0} | Teacher: ${c.teacherId}`);
    });
    process.exit();
};

checkEnrollments();
