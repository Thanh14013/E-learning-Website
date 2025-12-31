import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Course from './src/models/course.model.js';
import User from './src/models/user.model.js';

// Load env
dotenv.config();

const runDebug = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the teacher user (from screenshot "Nguyễn Văn Thanh" or similar)
    // Or just all teachers
    const teachers = await User.find({ role: 'teacher' });
    console.log(`Found ${teachers.length} teachers.`);

    for (const teacher of teachers) {
        console.log(`\nTeacher: ${teacher.fullName} (${teacher._id})`);
        
        const courses = await Course.find({ teacherId: teacher._id });
        console.log(`Total Courses: ${courses.length}`);

        const published = courses.filter(c => c.isPublished);
        console.log(`Published Courses (in JS filter): ${published.length}`);

        const totalStudents = courses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
        console.log(`Total Students (Array sum): ${totalStudents}`);
        
        // Log individual course details
        courses.forEach(c => {
             console.log(` - Course: ${c.title}`);
             console.log(`   ID: ${c._id}`);
             console.log(`   Published: ${c.isPublished}`);
             console.log(`   Students: ${c.enrolledStudents?.length} (${c.enrolledStudents})`);
        });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

runDebug();
