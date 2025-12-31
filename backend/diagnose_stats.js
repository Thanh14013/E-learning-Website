
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Chart.js import removed
dotenv.config();

const CourseSchema = new mongoose.Schema({
  title: String,
  enrolledStudents: [mongoose.Schema.Types.ObjectId],
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: Boolean,
  rating: Number
});

const UserSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    role: String
});

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
// Mock Analytics model for querying
const AnalyticsSchema = new mongoose.Schema({
    courseId: mongoose.Schema.Types.ObjectId,
    completionRate: Number,
    activeStudents: Number
});
const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
const Discussion = mongoose.models.Discussion || mongoose.model('Discussion', new mongoose.Schema({ createdAt: Date, courseId: mongoose.Schema.Types.ObjectId })); // Mock

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const runDiagnosis = async () => {
    await connectDB();
    
    // 1. Find the specific course seen in screenshot
    const c = await Course.findOne({ title: { $regex: 'Thanh', $options: 'i' } }); // Keyword from screenshot "Nguyễn Văn Thanh"
    if (!c) {
        console.log("Course 'Nguyễn Văn Thanh' not found.");
        process.exit();
    }

    console.log(`\n--- Course Info ---`);
    console.log(`ID: ${c._id}`);
    console.log(`Title: ${c.title}`);
    console.log(`Enrollments Count (DB): ${c.enrolledStudents ? c.enrolledStudents.length : 0}`);
    console.log(`Teacher ID: ${c.teacherId}`);
    
    // 2. Find the teacher/owner
    const teacher = await User.findById(c.teacherId);
    if (!teacher) {
        console.log("Teacher not found!");
    } else {
        console.log(`Teacher Name: ${teacher.fullName}`);
        console.log(`Teacher Role: ${teacher.role}`);
        console.log(`Teacher ID: ${teacher._id}`);
    }

    // 3. Simulate getTeacherDashboard for this Teacher
    console.log(`\n--- Simulating getTeacherDashboard(${c.teacherId}) ---`);
    const teacherCourses = await Course.find({ teacherId: c.teacherId });
    console.log(`Courses found for this teacher: ${teacherCourses.length}`);
    const teacherTotalStudents = teacherCourses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
    console.log(`Total Students (Logic): ${teacherTotalStudents}`);

    // 4. Simulate getAdminDashboardStats (if role is admin, logic uses all courses)
    console.log(`\n--- Simulating getAdminDashboardStats (Assuming Admin role) ---`);
    const allCourses = await Course.find();
    console.log(`All Courses found: ${allCourses.length}`);
    const date = new Date(); // Mock date
    const adminTotalStudents = allCourses.reduce(
        (sum, c) => sum + (c.enrolledStudents?.length || 0),
        0
    );
    console.log(`Total Students (Admin Logic - All Courses): ${adminTotalStudents}`);

    // 5. Check if 'MasterDev' exists and what role
    const masterDev = await User.findOne({ fullName: 'MasterDev' });
    if (masterDev) {
         console.log(`\n--- MasterDev User Info ---`);
         console.log(`ID: ${masterDev._id}`);
         console.log(`Role: ${masterDev.role}`);
         
         const masterDevCourses = await Course.find({ teacherId: masterDev._id });
         console.log(`Courses owned by MasterDev: ${masterDevCourses.length}`);
    } else {
        console.log("\nUser 'MasterDev' not found in DB (might be just a display name in UI?)");
    }

    process.exit();
};

runDiagnosis();
