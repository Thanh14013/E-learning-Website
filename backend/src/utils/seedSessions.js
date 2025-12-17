import mongoose from 'mongoose';
import LiveSession from '../models/liveSession.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';

/**
 * Seed live sessions for testing calendar functionality
 * This creates sample live sessions for existing courses
 */
export const seedLiveSessions = async () => {
  try {
    console.log('🌱 Starting to seed live sessions...');

    // Find some courses and teachers
    const courses = await Course.find().populate('teacherId').limit(5);
    if (courses.length === 0) {
      console.log('❌ No courses found. Please create courses first.');
      return;
    }

    // Clear existing sessions (optional - comment out if you want to keep existing)
    // await LiveSession.deleteMany({});
    // console.log('🗑️ Cleared existing sessions');

    const sessions = [];
    const now = new Date();

    // Create sessions for each course
    for (const course of courses) {
      if (!course.teacherId) continue;

      // Create 3-5 sessions per course at different times
      const sessionCount = Math.floor(Math.random() * 3) + 3; // 3-5 sessions

      for (let i = 0; i < sessionCount; i++) {
        // Schedule sessions at various times (some in past, some in future)
        const daysOffset = Math.floor(Math.random() * 20) - 5; // -5 to +15 days from now
        const scheduledDate = new Date(now);
        scheduledDate.setDate(scheduledDate.getDate() + daysOffset);
        scheduledDate.setHours(Math.floor(Math.random() * 8) + 9); // 9 AM to 5 PM
        scheduledDate.setMinutes(0);
        scheduledDate.setSeconds(0);

        // Determine status based on date
        let status = 'scheduled';
        if (scheduledDate < now) {
          // Randomly set past sessions as ended or cancelled
          status = Math.random() > 0.3 ? 'ended' : 'cancelled';
        }

        const session = {
          courseId: course._id,
          hostId: course.teacherId._id,
          title: `Live Session ${i + 1}: ${course.title.substring(0, 30)}`,
          description: `Interactive live session covering key concepts from ${course.title}. Join us for Q&A and demonstrations.`,
          scheduledAt: scheduledDate,
          status: status,
          duration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
        };

        // For ended sessions, add start and end times
        if (status === 'ended') {
          session.startedAt = new Date(scheduledDate);
          session.endedAt = new Date(scheduledDate.getTime() + session.duration * 60000);
        }

        sessions.push(session);
      }
    }

    // Insert all sessions
    const created = await LiveSession.insertMany(sessions);
    console.log(`✅ Successfully created ${created.length} live sessions`);

    // Show summary by status
    const summary = await LiveSession.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('📊 Sessions by status:');
    summary.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    return created;
  } catch (error) {
    console.error('❌ Error seeding live sessions:', error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-learning';
  
  mongoose.connect(mongoURI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      return seedLiveSessions();
    })
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export default seedLiveSessions;
