// Script to create fake lesson discussions
// Run this file to populate lesson discussions in your database

import mongoose from 'mongoose';
import Discussion from './src/models/discussion.model.js';
import Lesson from './src/models/lesson.model.js';
import Chapter from './src/models/chapter.model.js';
import Course from './src/models/course.model.js';
import User from './src/models/user.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_platform');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample discussion titles and content for lessons
const discussionTemplates = [
  {
    title: 'Question about the lesson content',
    content: 'I have a question about the concepts explained in this lesson. Could someone help clarify the main points?'
  },
  {
    title: 'Additional resources',
    content: 'Has anyone found any good additional resources or tutorials that complement this lesson? I\'d love to learn more.'
  },
  {
    title: 'Practical application',
    content: 'How can we apply what we learned in this lesson to real-world scenarios? I\'m looking for practical examples.'
  },
  {
    title: 'Challenging part',
    content: 'I found a particular section of this lesson quite challenging. Can we discuss it further?'
  },
  {
    title: 'Tips and tricks',
    content: 'Here are some tips that helped me understand this lesson better. Feel free to add your own!'
  },
  {
    title: 'Lesson summary',
    content: 'Let\'s summarize the key takeaways from this lesson. What did everyone learn?'
  },
  {
    title: 'Related topics',
    content: 'Are there any related topics or lessons that connect well with this one? I\'d like to explore more.'
  },
  {
    title: 'Study group',
    content: 'Would anyone be interested in forming a study group to discuss this lesson in more detail?'
  }
];

const createLessonDiscussions = async () => {
  try {
    await connectDB();

    console.log('🔍 Fetching lessons from database...');
    
    // Get all lessons
    const lessons = await Lesson.find().limit(50);
    
    if (lessons.length === 0) {
      console.log('⚠️ No lessons found in database. Please add courses and lessons first.');
      process.exit(0);
    }

    console.log(`📚 Found ${lessons.length} lessons`);

    // Get some users to assign as discussion creators
    const users = await User.find({ role: { $in: ['student', 'teacher'] } }).limit(10);
    
    if (users.length === 0) {
      console.log('⚠️ No users found in database. Please add users first.');
      process.exit(0);
    }

    console.log(`👥 Found ${users.length} users`);

    let createdCount = 0;

    // Create 1-2 discussions for each lesson
    for (const lesson of lessons) {
      const numDiscussions = Math.random() > 0.5 ? 2 : 1; // Randomly 1 or 2 discussions
      
      console.log(`\n📝 Creating ${numDiscussions} discussion(s) for lesson: ${lesson.title}`);

      for (let i = 0; i < numDiscussions; i++) {
        // Pick a random template and user
        const template = discussionTemplates[Math.floor(Math.random() * discussionTemplates.length)];
        const user = users[Math.floor(Math.random() * users.length)];

        // Get the course for this lesson
        const chapter = await Chapter.findById(lesson.chapterId);
        if (!chapter) {
          console.log(`  ⚠️ Chapter not found for lesson: ${lesson.title}`);
          continue;
        }

        const discussionData = {
          courseId: chapter.courseId,
          lessonId: lesson._id,
          userId: user._id,
          title: `${template.title} - ${lesson.title}`,
          content: template.content,
          isPinned: Math.random() > 0.9, // 10% chance of being pinned
          likes: [],
          views: Math.floor(Math.random() * 50), // Random views 0-49
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
        };

        try {
          const discussion = await Discussion.create(discussionData);
          console.log(`  ✅ Created discussion: "${discussion.title}"`);
          createdCount++;
        } catch (error) {
          console.error(`  ❌ Failed to create discussion:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Successfully created ${createdCount} lesson discussions!`);
    console.log('✨ Done!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating discussions:', error);
    process.exit(1);
  }
};

// Run the script
createLessonDiscussions();
