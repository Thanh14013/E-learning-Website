import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import User from "./src/models/user.model.js";
import UserProfile from "./src/models/userProfile.model.js";
import Course from "./src/models/course.model.js";
import Chapter from "./src/models/chapter.model.js";
import Lesson from "./src/models/lesson.model.js";
import Quiz from "./src/models/quiz.model.js";
import Question from "./src/models/question.model.js";
import QuizAttempt from "./src/models/quizAttempt.model.js";
import Progress from "./src/models/progress.model.js";
import Discussion from "./src/models/discussion.model.js";
import Comment from "./src/models/comment.model.js";
import Notification from "./src/models/notification.model.js";
import LiveSession from "./src/models/liveSession.model.js";
import Analytics from "./src/models/analytics.model.js";
import Media from "./src/models/media.model.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Skip clearing - keep existing data
const clearDatabase = async () => {
  console.log("\n📝 Keeping existing data and adding new courses...");
  // No deletion - append only
};

// Seed Users
const seedUsers = async () => {
  console.log("\n👥 Seeding Users...");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin", salt);

  const users = [
    // Admin user
    {
      fullName: "Admin User",
      email: "admin@admin.com",
      password: hashedPassword,
      role: "admin",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/admin.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
      profileApprovalStatus: "approved",
    },
    // Teachers
    {
      fullName: "John Smith",
      email: "john.smith@teacher.com",
      password: hashedPassword,
      role: "teacher",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/teacher1.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
      profileApprovalStatus: "approved",
    },
    {
      fullName: "Sarah Johnson",
      email: "sarah.johnson@teacher.com",
      password: hashedPassword,
      role: "teacher",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/teacher2.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
      profileApprovalStatus: "approved",
    },
    {
      fullName: "Michael Brown",
      email: "michael.brown@teacher.com",
      password: hashedPassword,
      role: "teacher",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/teacher3.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
      profileApprovalStatus: "approved",
    },
    {
      fullName: "Emily Davis",
      email: "emily.davis@teacher.com",
      password: hashedPassword,
      role: "teacher",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/teacher4.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
      profileApprovalStatus: "approved",
    },
    // Students
    {
      fullName: "Alex Martinez",
      email: "alex.martinez@student.com",
      password: hashedPassword,
      role: "student",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/student1.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
    },
    {
      fullName: "Emma Wilson",
      email: "emma.wilson@student.com",
      password: hashedPassword,
      role: "student",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/student2.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
    },
    {
      fullName: "James Anderson",
      email: "james.anderson@student.com",
      password: hashedPassword,
      role: "student",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/student3.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
    },
    {
      fullName: "Olivia Taylor",
      email: "olivia.taylor@student.com",
      password: hashedPassword,
      role: "student",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/student4.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
    },
    {
      fullName: "William Thomas",
      email: "william.thomas@student.com",
      password: hashedPassword,
      role: "student",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/student5.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
    },
    {
      fullName: "Sophia Moore",
      email: "sophia.moore@student.com",
      password: hashedPassword,
      role: "student",
      avatar:
        "https://res.cloudinary.com/demo/image/upload/v1/avatars/student6.jpg",
      isVerified: true,
      isBanned: false,
      profileCompleted: true,
    },
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

// Seed User Profiles
const seedUserProfiles = async (users) => {
  console.log("\n📋 Seeding User Profiles...");

  const profiles = users.map((user, index) => {
    if (user.role === "admin") {
      return {
        userId: user._id,
        phone: "+1-555-0000",
        address: "123 Admin St, Tech City, TC 12345",
        dateOfBirth: new Date("1985-01-15"),
        bio: "System Administrator with expertise in managing e-learning platforms.",
        socialLinks: {
          linkedin: "https://linkedin.com/in/admin",
        },
      };
    } else if (user.role === "teacher") {
      return {
        userId: user._id,
        phone: `+1-555-100${index}`,
        address: `${100 + index} Teacher Ave, Education City, EC 54321`,
        dateOfBirth: new Date(1980 + index, index % 12, 15),
        bio: `Experienced programming instructor specializing in modern web development and software engineering.`,
        expertise:
          index % 2 === 0 ? "Full Stack Development" : "Frontend Development",
        qualifications:
          "M.S. in Computer Science, 10+ years of industry experience",
        cvUrl: `https://res.cloudinary.com/demo/document/upload/v1/cv/teacher${index}.pdf`,
        socialLinks: {
          linkedin: `https://linkedin.com/in/teacher${index}`,
          twitter: `https://twitter.com/teacher${index}`,
        },
      };
    } else {
      return {
        userId: user._id,
        phone: `+1-555-200${index}`,
        address: `${200 + index} Student Rd, Learning City, LC 98765`,
        dateOfBirth: new Date(1995 + index, index % 12, 10),
        bio: `Passionate about learning web development and building modern applications.`,
        socialLinks: {
          linkedin: `https://linkedin.com/in/student${index}`,
        },
      };
    }
  });

  const createdProfiles = await UserProfile.insertMany(profiles);
  console.log(`✅ Created ${createdProfiles.length} user profiles`);
  return createdProfiles;
};

// Seed 30 New Courses
const seed30NewCourses = async (teachers) => {
  console.log("\n📚 Seeding 30 New Courses...");

  const newCourses = [
    // Programming Languages (8 courses)
    {
      title: "TypeScript Masterclass: From Beginner to Expert",
      description:
        "Learn TypeScript from scratch with practical examples. Master types, interfaces, generics, decorators, and build type-safe applications.",
      thumbnail:
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800",
      teacherId: teachers[0]._id,
      category: "Programming",
      level: "intermediate",
      isPublished: true,
      rating: 4.8,
      totalReviews: 95,
    },
    {
      title: "Go Programming: Build Scalable Applications",
      description:
        "Master Go programming language. Learn concurrency, goroutines, channels, and build high-performance backend systems.",
      thumbnail:
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
      teacherId: teachers[1]._id,
      category: "Programming",
      level: "advanced",
      isPublished: true,
      rating: 4.7,
      totalReviews: 78,
    },
    {
      title: "Rust Programming for Systems Development",
      description:
        "Learn Rust programming for system-level development. Master memory safety, ownership, and concurrent programming.",
      thumbnail:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
      teacherId: teachers[2]._id,
      category: "Programming",
      level: "advanced",
      isPublished: true,
      rating: 4.9,
      totalReviews: 67,
    },
    {
      title: "PHP Modern Development with Laravel",
      description:
        "Master modern PHP development with Laravel framework. Build robust web applications with MVC architecture.",
      thumbnail:
        "https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?w=800",
      teacherId: teachers[3]._id,
      category: "Backend",
      level: "intermediate",
      isPublished: true,
      rating: 4.6,
      totalReviews: 89,
    },
    {
      title: "Ruby on Rails: Full-Stack Web Development",
      description:
        "Build complete web applications with Ruby on Rails. Learn MVC, Active Record, testing, and deployment.",
      thumbnail:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
      teacherId: teachers[0]._id,
      category: "Full Stack",
      level: "intermediate",
      isPublished: true,
      rating: 4.5,
      totalReviews: 72,
    },
    {
      title: "Kotlin for Android Development",
      description:
        "Master Kotlin programming for Android app development. Build modern mobile applications with Jetpack Compose.",
      thumbnail:
        "https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800",
      teacherId: teachers[1]._id,
      category: "Mobile Development",
      level: "intermediate",
      isPublished: true,
      rating: 4.7,
      totalReviews: 103,
    },
    {
      title: "Swift iOS Development Bootcamp",
      description:
        "Learn iOS app development with Swift. Build native iOS applications using UIKit and SwiftUI frameworks.",
      thumbnail:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800",
      teacherId: teachers[2]._id,
      category: "Mobile Development",
      level: "beginner",
      isPublished: true,
      rating: 4.8,
      totalReviews: 124,
    },
    {
      title: "Scala Functional Programming",
      description:
        "Master functional programming with Scala. Learn immutability, higher-order functions, and build reactive systems.",
      thumbnail:
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
      teacherId: teachers[3]._id,
      category: "Programming",
      level: "advanced",
      isPublished: true,
      rating: 4.6,
      totalReviews: 58,
    },

    // Frontend (6 courses)
    {
      title: "Vue.js 3 Complete Course",
      description:
        "Master Vue.js 3 with Composition API. Build reactive web applications with modern JavaScript framework.",
      thumbnail:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
      teacherId: teachers[0]._id,
      category: "Frontend",
      level: "intermediate",
      isPublished: true,
      rating: 4.7,
      totalReviews: 112,
    },
    {
      title: "Angular: Enterprise Web Applications",
      description:
        "Build scalable enterprise applications with Angular. Learn TypeScript, RxJS, NgRx, and best practices.",
      thumbnail:
        "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?w=800",
      teacherId: teachers[1]._id,
      category: "Frontend",
      level: "advanced",
      isPublished: true,
      rating: 4.5,
      totalReviews: 87,
    },
    {
      title: "Svelte and SvelteKit Development",
      description:
        "Learn Svelte and SvelteKit for building fast, reactive web applications with minimal boilerplate code.",
      thumbnail:
        "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800",
      teacherId: teachers[2]._id,
      category: "Frontend",
      level: "beginner",
      isPublished: true,
      rating: 4.8,
      totalReviews: 76,
    },
    {
      title: "Next.js 14: Full-Stack React Framework",
      description:
        "Master Next.js 14 with App Router. Build SEO-friendly, server-rendered React applications with TypeScript.",
      thumbnail:
        "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800",
      teacherId: teachers[3]._id,
      category: "Full Stack",
      level: "intermediate",
      isPublished: true,
      rating: 4.9,
      totalReviews: 156,
    },
    {
      title: "Tailwind CSS: Modern Styling Framework",
      description:
        "Master utility-first CSS with Tailwind. Build beautiful, responsive designs quickly and efficiently.",
      thumbnail:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      teacherId: teachers[0]._id,
      category: "Frontend",
      level: "beginner",
      isPublished: true,
      rating: 4.6,
      totalReviews: 98,
    },
    {
      title: "Web Animation with Three.js and GSAP",
      description:
        "Create stunning 3D graphics and animations for the web using Three.js and GSAP animation library.",
      thumbnail:
        "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800",
      teacherId: teachers[1]._id,
      category: "Frontend",
      level: "advanced",
      isPublished: true,
      rating: 4.7,
      totalReviews: 64,
    },

    // Backend & Full Stack (6 courses)
    {
      title: "Django REST Framework for APIs",
      description:
        "Build powerful RESTful APIs with Django REST Framework. Learn authentication, serialization, and deployment.",
      thumbnail:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800",
      teacherId: teachers[2]._id,
      category: "Backend",
      level: "intermediate",
      isPublished: true,
      rating: 4.6,
      totalReviews: 91,
    },
    {
      title: "Express.js and MongoDB Backend Development",
      description:
        "Master backend development with Express.js and MongoDB. Build RESTful APIs with authentication and testing.",
      thumbnail:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
      teacherId: teachers[3]._id,
      category: "Backend",
      level: "intermediate",
      isPublished: true,
      rating: 4.8,
      totalReviews: 134,
    },
    {
      title: "GraphQL API Development",
      description:
        "Learn GraphQL for building flexible APIs. Master queries, mutations, subscriptions, and Apollo Server.",
      thumbnail:
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
      teacherId: teachers[0]._id,
      category: "Backend",
      level: "advanced",
      isPublished: true,
      rating: 4.7,
      totalReviews: 83,
    },
    {
      title: "Microservices with Node.js and Kubernetes",
      description:
        "Build and deploy microservices architecture using Node.js, Docker, and Kubernetes orchestration.",
      thumbnail:
        "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800",
      teacherId: teachers[1]._id,
      category: "Backend",
      level: "advanced",
      isPublished: true,
      rating: 4.9,
      totalReviews: 72,
    },
    {
      title: "Full-Stack Development with MERN Stack",
      description:
        "Master MongoDB, Express, React, and Node.js. Build complete full-stack applications from scratch.",
      thumbnail:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
      teacherId: teachers[2]._id,
      category: "Full Stack",
      level: "intermediate",
      isPublished: true,
      rating: 4.8,
      totalReviews: 187,
    },
    {
      title: "NestJS: Enterprise Node.js Framework",
      description:
        "Build scalable server-side applications with NestJS framework. Learn TypeScript, dependency injection, and testing.",
      thumbnail:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
      teacherId: teachers[3]._id,
      category: "Backend",
      level: "advanced",
      isPublished: true,
      rating: 4.7,
      totalReviews: 69,
    },

    // DevOps & Cloud (5 courses)
    {
      title: "Docker and Container Orchestration",
      description:
        "Master Docker containerization. Learn container management, Docker Compose, and deployment strategies.",
      thumbnail:
        "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800",
      teacherId: teachers[0]._id,
      category: "DevOps",
      level: "intermediate",
      isPublished: true,
      rating: 4.8,
      totalReviews: 115,
    },
    {
      title: "Kubernetes Administration and Deployment",
      description:
        "Learn Kubernetes for container orchestration. Master pods, services, deployments, and production workflows.",
      thumbnail:
        "https://images.unsplash.com/photo-1667372393086-9d4001d51cf1?w=800",
      teacherId: teachers[1]._id,
      category: "DevOps",
      level: "advanced",
      isPublished: true,
      rating: 4.9,
      totalReviews: 93,
    },
    {
      title: "AWS Solutions Architect Certification Prep",
      description:
        "Prepare for AWS Solutions Architect certification. Learn EC2, S3, Lambda, VPC, and cloud architecture patterns.",
      thumbnail:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
      teacherId: teachers[2]._id,
      category: "Cloud Computing",
      level: "intermediate",
      isPublished: true,
      rating: 4.7,
      totalReviews: 142,
    },
    {
      title: "Azure Cloud Development",
      description:
        "Build and deploy applications on Microsoft Azure. Learn Azure Functions, App Services, and DevOps pipelines.",
      thumbnail:
        "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=800",
      teacherId: teachers[3]._id,
      category: "Cloud Computing",
      level: "intermediate",
      isPublished: true,
      rating: 4.6,
      totalReviews: 86,
    },
    {
      title: "Terraform Infrastructure as Code",
      description:
        "Master Infrastructure as Code with Terraform. Automate cloud resource provisioning and management.",
      thumbnail:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
      teacherId: teachers[0]._id,
      category: "DevOps",
      level: "advanced",
      isPublished: true,
      rating: 4.8,
      totalReviews: 77,
    },

    // Data Science & AI (5 courses)
    {
      title: "Machine Learning with Python and Scikit-Learn",
      description:
        "Learn machine learning algorithms and techniques. Build predictive models with Python and Scikit-Learn.",
      thumbnail:
        "https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800",
      teacherId: teachers[1]._id,
      category: "Machine Learning",
      level: "intermediate",
      isPublished: true,
      rating: 4.9,
      totalReviews: 168,
    },
    {
      title: "Deep Learning with TensorFlow and Keras",
      description:
        "Master deep learning with TensorFlow and Keras. Build neural networks for computer vision and NLP.",
      thumbnail:
        "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
      teacherId: teachers[2]._id,
      category: "Machine Learning",
      level: "advanced",
      isPublished: true,
      rating: 4.8,
      totalReviews: 145,
    },
    {
      title: "Data Analysis with Pandas and NumPy",
      description:
        "Master data analysis with Python. Learn Pandas, NumPy, and data visualization with Matplotlib and Seaborn.",
      thumbnail:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
      teacherId: teachers[3]._id,
      category: "Data Science",
      level: "beginner",
      isPublished: true,
      rating: 4.7,
      totalReviews: 132,
    },
    {
      title: "Natural Language Processing with Python",
      description:
        "Learn NLP techniques for text processing. Build chatbots, sentiment analysis, and text classification models.",
      thumbnail:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800",
      teacherId: teachers[0]._id,
      category: "Machine Learning",
      level: "advanced",
      isPublished: true,
      rating: 4.8,
      totalReviews: 89,
    },
    {
      title: "Big Data Processing with Apache Spark",
      description:
        "Master big data processing with Apache Spark. Learn distributed computing and data engineering at scale.",
      thumbnail:
        "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800",
      teacherId: teachers[1]._id,
      category: "Data Science",
      level: "advanced",
      isPublished: true,
      rating: 4.7,
      totalReviews: 74,
    },
  ];

  const createdCourses = await Course.insertMany(newCourses);
  console.log(`✅ Created ${createdCourses.length} new courses`);
  return createdCourses;
};

// Seed Courses (Original function - kept for backward compatibility)
const seedCourses = async (teachers) => {
  console.log("\n📚 Seeding Original Courses...");

  const courses = [
    {
      title: "Complete React Development Bootcamp",
      description:
        "Master React from basics to advanced concepts. Learn hooks, context API, Redux, and build real-world projects.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/react-course.jpg",
      teacherId: teachers[0]._id,
      category: "Reactjs",
      level: "intermediate",
      isPublished: true,
      rating: 4.7,
      totalReviews: 85,
    },
    {
      title: "Node.js Backend Development Masterclass",
      description:
        "Build scalable backend applications with Node.js, Express, MongoDB, and REST APIs. Learn authentication, file uploads, and deployment.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/nodejs-course.jpg",
      teacherId: teachers[1]._id,
      category: "Nodejs",
      level: "advanced",
      isPublished: true,
      rating: 4.8,
      totalReviews: 120,
    },
    {
      title: "Full Stack JavaScript Development",
      description:
        "Learn to build complete web applications using JavaScript, React, Node.js, and MongoDB. From frontend to backend deployment.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/fullstack-js.jpg",
      teacherId: teachers[0]._id,
      category: "Full Stack",
      level: "intermediate",
      isPublished: true,
      rating: 4.9,
      totalReviews: 200,
    },
    {
      title: "Python Programming for Beginners",
      description:
        "Start your programming journey with Python. Learn syntax, data structures, OOP, and build practical projects.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/python-basics.jpg",
      teacherId: teachers[2]._id,
      category: "Python",
      level: "beginner",
      isPublished: true,
      rating: 4.6,
      totalReviews: 150,
    },
    {
      title: "Advanced Python and Data Science",
      description:
        "Deep dive into Python for data analysis, machine learning, and scientific computing with NumPy, Pandas, and Scikit-learn.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/python-advanced.jpg",
      teacherId: teachers[2]._id,
      category: "Data Science",
      level: "advanced",
      isPublished: true,
      rating: 4.7,
      totalReviews: 95,
    },
    {
      title: "Java Programming Fundamentals",
      description:
        "Learn Java from scratch. Understand OOP principles, collections, exception handling, and build console applications.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/java-fundamentals.jpg",
      teacherId: teachers[3]._id,
      category: "Java",
      level: "beginner",
      isPublished: true,
      rating: 4.5,
      totalReviews: 110,
    },
    {
      title: "Modern Frontend Development with HTML, CSS & JavaScript",
      description:
        "Master the fundamentals of web development. Learn HTML5, CSS3, responsive design, and JavaScript ES6+.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/frontend-basics.jpg",
      teacherId: teachers[1]._id,
      category: "Frontend",
      level: "beginner",
      isPublished: true,
      rating: 4.8,
      totalReviews: 180,
    },
    {
      title: "DevOps Engineering: CI/CD and Cloud Deployment",
      description:
        "Learn DevOps practices, Docker, Kubernetes, CI/CD pipelines, and deploy applications to AWS and Azure.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/devops.jpg",
      teacherId: teachers[3]._id,
      category: "DevOps",
      level: "advanced",
      isPublished: true,
      rating: 4.6,
      totalReviews: 75,
    },
    {
      title: "C++ Programming and Data Structures",
      description:
        "Comprehensive C++ course covering syntax, pointers, OOP, STL, and implementing data structures and algorithms.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/cpp-course.jpg",
      teacherId: teachers[2]._id,
      category: "C++",
      level: "intermediate",
      isPublished: true,
      rating: 4.4,
      totalReviews: 65,
    },
    {
      title: "Cloud Computing with AWS",
      description:
        "Learn AWS cloud services including EC2, S3, Lambda, RDS, and build scalable cloud applications.",
      thumbnail:
        "https://res.cloudinary.com/demo/image/upload/v1/courses/aws-cloud.jpg",
      teacherId: teachers[3]._id,
      category: "Cloud Computing",
      level: "intermediate",
      isPublished: true,
      rating: 4.7,
      totalReviews: 90,
    },
  ];

  const createdCourses = await Course.insertMany(courses);
  console.log(`✅ Created ${createdCourses.length} courses`);
  return createdCourses;
};

// Seed Chapters
const seedChapters = async (courses) => {
  console.log("\n📖 Seeding Chapters...");

  const chapters = [];

  courses.forEach((course, courseIndex) => {
    const chapterCount = 3 + (courseIndex % 3); // 3-5 chapters per course

    for (let i = 1; i <= chapterCount; i++) {
      chapters.push({
        courseId: course._id,
        title: `Chapter ${i}: ${getChapterTitle(course.category, i)}`,
        order: i,
      });
    }
  });

  const createdChapters = await Chapter.insertMany(chapters);
  console.log(`✅ Created ${createdChapters.length} chapters`);
  return createdChapters;
};

// Helper function to generate chapter titles
function getChapterTitle(category, order) {
  const titles = {
    Reactjs: [
      "Introduction to React",
      "Components and Props",
      "State and Lifecycle",
      "Hooks and Context",
      "Advanced Patterns",
    ],
    Nodejs: [
      "Node.js Fundamentals",
      "Express Framework",
      "Database Integration",
      "Authentication & Security",
      "Deployment & Scaling",
    ],
    "Full Stack": [
      "Frontend Setup",
      "Backend Development",
      "Database Design",
      "API Integration",
      "Production Deployment",
    ],
    Python: [
      "Python Basics",
      "Data Structures",
      "Functions and Modules",
      "Object-Oriented Programming",
      "File Handling",
    ],
    Java: [
      "Java Syntax",
      "OOP Concepts",
      "Collections Framework",
      "Exception Handling",
      "Advanced Topics",
    ],
    Frontend: [
      "HTML Fundamentals",
      "CSS Styling",
      "JavaScript Basics",
      "Responsive Design",
      "Modern JavaScript",
    ],
    DevOps: [
      "DevOps Introduction",
      "Docker Containers",
      "Kubernetes Orchestration",
      "CI/CD Pipelines",
      "Cloud Deployment",
    ],
  };

  const categoryTitles = titles[category] || [
    "Introduction",
    "Core Concepts",
    "Advanced Topics",
    "Best Practices",
    "Real World Projects",
  ];

  return categoryTitles[(order - 1) % categoryTitles.length];
}

// Seed Lessons
const seedLessons = async (chapters) => {
  console.log("\n📝 Seeding Lessons...");

  const lessons = [];

  chapters.forEach((chapter, chapterIndex) => {
    const lessonCount = 2 + (chapterIndex % 3); // 2-4 lessons per chapter

    for (let i = 1; i <= lessonCount; i++) {
      lessons.push({
        chapterId: chapter._id,
        title: `Lesson ${i}: ${getLessonTitle(chapter.title, i)}`,
        content: `<h2>Lesson Overview</h2><p>This lesson covers important concepts in ${chapter.title}. You will learn fundamental and advanced techniques.</p><h3>Learning Objectives</h3><ul><li>Understand core concepts</li><li>Apply practical examples</li><li>Build real-world projects</li></ul>`,
        videoUrl: `https://res.cloudinary.com/demo/video/upload/v1/lessons/lesson${chapterIndex}-${i}.mp4`,
        videoDuration: 600 + i * 300, // 10-25 minutes
        resources: [
          {
            name: "Lesson Documents",
            url: `https://res.cloudinary.com/demo/document/upload/v1/resources/notes${chapterIndex}-${i}.pdf`,
            type: "pdf",
          },
          {
            name: "Code Examples",
            url: `https://github.com/example/lesson${chapterIndex}-${i}`,
            type: "doc",
          },
        ],
        order: i,
        isPreview: i === 1 && chapterIndex < 3, // First lesson of first 3 chapters is preview
      });
    }
  });

  const createdLessons = await Lesson.insertMany(lessons);
  console.log(`✅ Created ${createdLessons.length} lessons`);
  return createdLessons;
};

// Helper function to generate lesson titles
function getLessonTitle(chapterTitle, order) {
  const keywords = [
    "Introduction",
    "Deep Dive",
    "Practical Examples",
    "Advanced Techniques",
    "Best Practices",
    "Common Patterns",
    "Project Implementation",
  ];
  return keywords[(order - 1) % keywords.length];
}

// Seed Quizzes
const seedQuizzes = async (courses, lessons) => {
  console.log("\n❓ Seeding Quizzes...");

  const quizzes = [];

  // Create 1-2 quizzes per course
  courses.forEach((course, index) => {
    const courseLessons = lessons.filter(
      (lesson) =>
        lesson.chapterId &&
        chapters.find(
          (ch) =>
            ch._id.toString() === lesson.chapterId.toString() &&
            ch.courseId.toString() === course._id.toString()
        )
    );

    if (courseLessons.length > 0) {
      const selectedLessons = courseLessons.slice(0, 2); // Take first 2 lessons

      selectedLessons.forEach((lesson, lessonIndex) => {
        quizzes.push({
          courseId: course._id,
          lessonId: lesson._id,
          title: `Quiz: ${lesson.title}`,
          duration: 15 + lessonIndex * 5, // 15-20 minutes
          passingScore: 70,
          attemptsAllowed: 3,
          isPublished: true,
        });
      });
    }
  });

  const createdQuizzes = await Quiz.insertMany(quizzes);
  console.log(`✅ Created ${createdQuizzes.length} quizzes`);
  return createdQuizzes;
};

// Keep reference to chapters for quiz seeding
let chapters = [];

// Seed Questions
const seedQuestions = async (quizzes) => {
  console.log("\n❔ Seeding Questions...");

  const questions = [];

  quizzes.forEach((quiz, quizIndex) => {
    // 5-10 questions per quiz
    const questionCount = 5 + (quizIndex % 6);

    for (let i = 0; i < questionCount; i++) {
      const type = ["multiple_choice", "true_false", "fill_blank"][i % 3];

      if (type === "multiple_choice") {
        questions.push({
          quizId: quiz._id,
          type: "multiple_choice",
          questionText: `Which of the following best describes ${getQuestionTopic(
            quizIndex,
            i
          )}?`,
          options: [
            "A fundamental concept in programming",
            "An advanced design pattern",
            "A deprecated feature",
            "A testing methodology",
          ],
          correctOption: i % 4,
          explanation:
            "This is the correct answer based on modern programming practices and industry standards.",
        });
      } else if (type === "true_false") {
        questions.push({
          quizId: quiz._id,
          type: "true_false",
          questionText: `${getQuestionTopic(
            quizIndex,
            i
          )} is essential for building scalable applications. True or False?`,
          correctBoolean: i % 2 === 0,
          explanation:
            "Understanding this concept is crucial for software development.",
        });
      } else {
        questions.push({
          quizId: quiz._id,
          type: "fill_blank",
          questionText: `Complete the sentence: The primary purpose of ${getQuestionTopic(
            quizIndex,
            i
          )} is to _____`,
          correctText: "improve code quality",
          explanation: "This helps in maintaining clean and efficient code.",
        });
      }
    }
  });

  const createdQuestions = await Question.insertMany(questions);
  console.log(`✅ Created ${createdQuestions.length} questions`);
  return createdQuestions;
};

// Helper function for question topics
function getQuestionTopic(quizIndex, questionIndex) {
  const topics = [
    "component lifecycle",
    "async/await",
    "RESTful APIs",
    "database normalization",
    "error handling",
    "design patterns",
    "code optimization",
    "unit testing",
    "dependency injection",
    "microservices architecture",
  ];
  return topics[(quizIndex + questionIndex) % topics.length];
}

// Seed Quiz Attempts
const seedQuizAttempts = async (quizzes, students) => {
  console.log("\n✏️ Seeding Quiz Attempts...");

  const attempts = [];

  students.forEach((student, studentIndex) => {
    // Each student attempts 2-4 quizzes
    const quizzesToAttempt = quizzes.slice(0, 3 + (studentIndex % 2));

    quizzesToAttempt.forEach((quiz, quizIndex) => {
      const attemptCount = 1 + (studentIndex % 2); // 1-2 attempts per quiz

      for (let attempt = 1; attempt <= attemptCount; attempt++) {
        const score = 60 + Math.random() * 40; // 60-100 score
        const percentage = Math.round(score);

        attempts.push({
          quizId: quiz._id,
          userId: student._id,
          answers: [], // Simplified for seeding
          score: score,
          percentage: percentage,
          isPassed: percentage >= quiz.passingScore,
          attemptNumber: attempt,
          startedAt: new Date(Date.now() - 3600000 * (attempt + quizIndex)),
          submittedAt: new Date(Date.now() - 3000000 * (attempt + quizIndex)),
        });
      }
    });
  });

  const createdAttempts = await QuizAttempt.insertMany(attempts);
  console.log(`✅ Created ${createdAttempts.length} quiz attempts`);
  return createdAttempts;
};

// Seed Progress
const seedProgress = async (courses, lessons, students) => {
  console.log("\n📊 Seeding Progress...");

  const progressRecords = [];

  students.forEach((student, studentIndex) => {
    // Each student enrolls in 2-4 courses
    const enrolledCourses = courses.slice(0, 2 + (studentIndex % 3));

    enrolledCourses.forEach((course, courseIndex) => {
      // Get lessons for this course
      const courseLessons = lessons.filter((lesson) => {
        const chapter = chapters.find(
          (ch) => ch._id.toString() === lesson.chapterId.toString()
        );
        return chapter && chapter.courseId.toString() === course._id.toString();
      });

      // Student completes some lessons
      const lessonsToComplete = courseLessons.slice(
        0,
        Math.floor(courseLessons.length * (0.3 + Math.random() * 0.7))
      );

      lessonsToComplete.forEach((lesson, lessonIndex) => {
        progressRecords.push({
          userId: student._id,
          lessonId: lesson._id,
          courseId: course._id,
          watchedDuration: lesson.videoDuration
            ? Math.floor(lesson.videoDuration * (0.5 + Math.random() * 0.5))
            : 0,
          isCompleted: lessonIndex < lessonsToComplete.length - 2, // Most are completed
          lastWatchedAt: new Date(
            Date.now() - 86400000 * (lessonIndex + courseIndex)
          ),
        });
      });
    });
  });

  const createdProgress = await Progress.insertMany(progressRecords);
  console.log(`✅ Created ${createdProgress.length} progress records`);
  return createdProgress;
};

// Seed Discussions
const seedDiscussions = async (courses, users) => {
  console.log("\n💬 Seeding Discussions...");

  const discussions = [];

  courses.forEach((course, courseIndex) => {
    const discussionCount = 2 + (courseIndex % 3); // 2-4 discussions per course

    for (let i = 0; i < discussionCount; i++) {
      const author = users[5 + ((courseIndex + i) % 6)]; // Students and teachers

      discussions.push({
        courseId: course._id,
        userId: author._id,
        title: getDiscussionTitle(course.category, i),
        content: getDiscussionContent(course.category, i),
        isPinned: i === 0 && courseIndex < 3, // Pin first discussion of first 3 courses
        likes: users
          .slice(5, 5 + Math.floor(Math.random() * 5))
          .map((u) => u._id),
        views: Math.floor(Math.random() * 100) + 20,
      });
    }
  });

  const createdDiscussions = await Discussion.insertMany(discussions);
  console.log(`✅ Created ${createdDiscussions.length} discussions`);
  return createdDiscussions;
};

// Helper functions for discussion content
function getDiscussionTitle(category, index) {
  const titles = [
    `Best practices for ${category} development`,
    `Common mistakes to avoid in ${category}`,
    `How to debug ${category} applications effectively`,
    `Recommended resources for learning ${category}`,
    `Project ideas for ${category} beginners`,
  ];
  return titles[index % titles.length];
}

function getDiscussionContent(category, index) {
  const contents = [
    `I've been working with ${category} for a while now and wanted to share some best practices that have helped me. What are your thoughts?`,
    `Can someone explain the best approach to handle errors in ${category}? I'm looking for industry-standard solutions.`,
    `I'm building a project using ${category} and would love to get feedback on my architecture. Has anyone worked on similar projects?`,
    `What are the must-know concepts for mastering ${category}? I want to make sure I'm not missing anything important.`,
    `Looking for study partners to learn ${category} together. Anyone interested in forming a study group?`,
  ];
  return contents[index % contents.length];
}

// Seed Comments
const seedComments = async (discussions, users) => {
  console.log("\n💭 Seeding Comments...");

  const comments = [];

  discussions.forEach((discussion, discussionIndex) => {
    const commentCount = 3 + (discussionIndex % 4); // 3-6 comments per discussion

    for (let i = 0; i < commentCount; i++) {
      const commenter = users[5 + ((discussionIndex + i) % 6)];

      const comment = {
        discussionId: discussion._id,
        userId: commenter._id,
        content: getCommentContent(i),
        parentId: null,
        likes: users
          .slice(5, 5 + Math.floor(Math.random() * 3))
          .map((u) => u._id),
      };

      comments.push(comment);
    }
  });

  const createdComments = await Comment.insertMany(comments);

  // Create nested replies (reply to first comment of each discussion)
  const replies = [];
  discussions.forEach((discussion, discussionIndex) => {
    const parentComment = createdComments.find(
      (c) => c.discussionId.toString() === discussion._id.toString()
    );

    if (parentComment && discussionIndex < 5) {
      const replier = users[6 + (discussionIndex % 5)];
      replies.push({
        discussionId: discussion._id,
        userId: replier._id,
        content:
          "Thanks for your response! That really helps clarify things for me.",
        parentId: parentComment._id,
        likes: [],
      });
    }
  });

  if (replies.length > 0) {
    await Comment.insertMany(replies);
  }

  console.log(
    `✅ Created ${
      createdComments.length + replies.length
    } comments (including replies)`
  );
  return createdComments;
};

// Helper function for comment content
function getCommentContent(index) {
  const contents = [
    "Great question! I've been struggling with this too. Looking forward to hearing other perspectives.",
    "In my experience, the best approach is to follow the documentation closely and practice with small examples first.",
    "I recommend checking out the official tutorial series. It covers this topic in detail.",
    "This is a common issue. Make sure you understand the fundamentals before moving to advanced topics.",
    "Thanks for starting this discussion! I learned a lot from the responses here.",
    "Have you tried using the debugging tools? They can help identify issues much faster.",
  ];
  return contents[index % contents.length];
}

// Seed Notifications
const seedNotifications = async (users, courses, quizzes) => {
  console.log("\n🔔 Seeding Notifications...");

  const notifications = [];

  users.forEach((user, userIndex) => {
    if (user.role === "student") {
      // Course notifications
      notifications.push({
        userId: user._id,
        type: "course",
        title: "New Course Available",
        content: `Check out the new course: ${
          courses[userIndex % courses.length].title
        }`,
        link: `/courses/${courses[userIndex % courses.length]._id}`,
        isRead: userIndex % 3 === 0,
        readAt: userIndex % 3 === 0 ? new Date() : null,
      });

      // Quiz notifications
      if (quizzes.length > 0) {
        notifications.push({
          userId: user._id,
          type: "quiz_assigned",
          title: "New Quiz Assigned",
          content: `You have a new quiz to complete: ${
            quizzes[userIndex % quizzes.length].title
          }`,
          link: `/quizzes/${quizzes[userIndex % quizzes.length]._id}`,
          isRead: userIndex % 2 === 0,
          readAt: userIndex % 2 === 0 ? new Date() : null,
        });
      }

      // Progress notification
      notifications.push({
        userId: user._id,
        type: "progress",
        title: "Great Progress!",
        content: "You've completed 50% of your enrolled courses. Keep it up!",
        link: "/dashboard/progress",
        isRead: true,
        readAt: new Date(Date.now() - 86400000),
      });
    } else if (user.role === "teacher") {
      // Discussion notification
      notifications.push({
        userId: user._id,
        type: "discussion",
        title: "New Discussion in Your Course",
        content: "A student started a new discussion in one of your courses.",
        link: "/discussions",
        isRead: userIndex % 2 === 0,
        readAt: userIndex % 2 === 0 ? new Date() : null,
      });

      // System notification
      notifications.push({
        userId: user._id,
        type: "system",
        title: "Course Analytics Available",
        content: "View detailed analytics for your courses in the dashboard.",
        link: "/teacher/analytics",
        isRead: false,
      });
    }
  });

  const createdNotifications = await Notification.insertMany(notifications);
  console.log(`✅ Created ${createdNotifications.length} notifications`);
  return createdNotifications;
};

// Seed Live Sessions
const seedLiveSessions = async (courses, teachers, students) => {
  console.log("\n🎥 Seeding Live Sessions...");

  const sessions = [];

  courses.forEach((course, courseIndex) => {
    const teacher = teachers.find(
      (t) => t._id.toString() === course.teacherId.toString()
    );

    if (teacher) {
      // Past session
      sessions.push({
        courseId: course._id,
        hostId: teacher._id,
        title: `${course.title} - Introduction Session`,
        description: "Welcome session covering course overview and objectives.",
        scheduledAt: new Date(Date.now() - 86400000 * (7 + courseIndex)),
        participants: students.slice(0, 3 + (courseIndex % 3)).map((s) => ({
          userId: s._id,
          joinedAt: new Date(
            Date.now() - 86400000 * (7 + courseIndex) + 300000
          ),
          leftAt: new Date(Date.now() - 86400000 * (7 + courseIndex) + 3600000),
          isVideoOn: true,
          isAudioOn: true,
        })),
        recordingUrl: `https://res.cloudinary.com/demo/video/upload/v1/sessions/session${courseIndex}.mp4`,
        status: "ended",
        startedAt: new Date(Date.now() - 86400000 * (7 + courseIndex)),
        endedAt: new Date(Date.now() - 86400000 * (7 + courseIndex) + 3600000),
        duration: 60,
      });

      // Upcoming session
      if (courseIndex < 5) {
        sessions.push({
          courseId: course._id,
          hostId: teacher._id,
          title: `${course.title} - Q&A Session`,
          description:
            "Live Q&A session to answer your questions and discuss advanced topics.",
          scheduledAt: new Date(Date.now() + 86400000 * (3 + courseIndex)),
          participants: [],
          recordingUrl: null,
          status: "scheduled",
          duration: 60,
        });
      }
    }
  });

  const createdSessions = await LiveSession.insertMany(sessions);
  console.log(`✅ Created ${createdSessions.length} live sessions`);
  return createdSessions;
};

// Seed Analytics
const seedAnalytics = async (courses) => {
  console.log("\n📈 Seeding Analytics...");

  const analytics = [];

  courses.forEach((course, courseIndex) => {
    // Generate analytics for last 10 days
    for (let i = 0; i < 10; i++) {
      const date = new Date(Date.now() - 86400000 * i);
      const baseStudents = 10 + courseIndex * 5;

      analytics.push({
        courseId: course._id,
        date: date,
        totalStudents: baseStudents + i,
        activeStudents: Math.floor(
          (baseStudents + i) * (0.6 + Math.random() * 0.3)
        ),
        completionRate: Math.round(20 + Math.random() * 60),
        averageScore: Math.round(70 + Math.random() * 25),
        totalLessons: 15 + courseIndex * 3,
        completedLessons: Math.floor(
          (15 + courseIndex * 3) * (0.4 + Math.random() * 0.4)
        ),
        totalProgress: Math.floor(
          (baseStudents + i) * (15 + courseIndex * 3) * 0.6
        ),
        newEnrollments: i === 0 ? Math.floor(Math.random() * 5) : 0,
        totalViews: Math.floor(Math.random() * 100) + 50,
        averageWatchTime: Math.floor(300 + Math.random() * 600), // 5-15 minutes
      });
    }
  });

  const createdAnalytics = await Analytics.insertMany(analytics);
  console.log(`✅ Created ${createdAnalytics.length} analytics records`);
  return createdAnalytics;
};

// Seed Media
const seedMedia = async (lessons, teachers) => {
  console.log("\n🎬 Seeding Media...");

  const media = [];

  lessons.forEach((lesson, lessonIndex) => {
    // Video media
    if (lesson.videoUrl) {
      media.push({
        lessonId: lesson._id,
        type: "video",
        url: lesson.videoUrl,
        filename: `lesson-video-${lessonIndex}.mp4`,
        size: 15000000 + Math.floor(Math.random() * 50000000), // 15-65 MB
        uploadedBy: teachers[lessonIndex % teachers.length]._id,
      });
    }

    // Resource media
    if (lesson.resources && lesson.resources.length > 0) {
      lesson.resources.forEach((resource, resourceIndex) => {
        media.push({
          lessonId: lesson._id,
          type: "resource",
          url: resource.url,
          filename: `${resource.name.replace(/\s+/g, "-").toLowerCase()}.${
            resource.type
          }`,
          size: 500000 + Math.floor(Math.random() * 2000000), // 0.5-2.5 MB
          uploadedBy: teachers[lessonIndex % teachers.length]._id,
        });
      });
    }
  });

  const createdMedia = await Media.insertMany(media);
  console.log(`✅ Created ${createdMedia.length} media records`);
  return createdMedia;
};

// Update Course enrollments and reviews
const updateCourseData = async (courses, students) => {
  console.log("\n🔄 Updating Course Data...");

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];

    // Enroll students
    const enrolledStudents = students.slice(0, 3 + (i % 4)).map((s) => s._id);

    // Add reviews
    const reviews = students.slice(0, 2 + (i % 3)).map((student, index) => ({
      userId: student._id,
      rating: 4 + Math.floor(Math.random() * 2), // 4-5 stars
      comment: [
        "Excellent course! Very well structured and easy to follow.",
        "Great content and practical examples. Highly recommended!",
        "The instructor explains concepts clearly. Learned a lot!",
      ][index % 3],
      createdAt: new Date(Date.now() - 86400000 * (index + 1)),
    }));

    course.enrolledStudents = enrolledStudents;
    course.reviews = reviews;
    course.totalReviews = reviews.length;

    await course.save();
  }

  console.log("✅ Course data updated");
};

// Update User Profile course references
const updateUserProfiles = async (courses, students, teachers) => {
  console.log("\n🔄 Updating User Profiles...");

  // Update student profiles
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const profile = await UserProfile.findOne({ userId: student._id });

    if (profile) {
      profile.enrolledCourses = courses
        .filter((c) =>
          c.enrolledStudents.some(
            (id) => id.toString() === student._id.toString()
          )
        )
        .map((c) => c._id);
      await profile.save();
    }
  }

  // Update teacher profiles
  for (let i = 0; i < teachers.length; i++) {
    const teacher = teachers[i];
    const profile = await UserProfile.findOne({ userId: teacher._id });

    if (profile) {
      profile.teachingCourses = courses
        .filter((c) => c.teacherId.toString() === teacher._id.toString())
        .map((c) => c._id);
      await profile.save();
    }
  }

  console.log("✅ User profiles updated");
};

// Main seed function - Add 30 new courses only
// Enhanced seed function to add 50 more lessons, quizzes, discussions, comments, questions
const seedEnhancedData = async () => {
  console.log(
    "\n📚 Adding Enhanced Data: 50 Lessons, Quizzes, Discussions, Comments, Questions...\n"
  );

  // Get all existing data
  const allCourses = await Course.find();
  const allChapters = await Chapter.find();
  const allUsers = await User.find();
  const allStudents = allUsers.filter((u) => u.role === "student");
  const allTeachers = allUsers.filter((u) => u.role === "teacher");

  if (allCourses.length === 0) {
    console.log("⚠️ No courses found. Please run initial seed first.");
    return;
  }

  const newLessons = [];
  const newQuizzes = [];
  const newQuestions = [];
  const newDiscussions = [];
  const newComments = [];

  // Add 50 lessons distributed across existing chapters
  console.log("\n📖 Adding 50 new lessons...");
  for (let i = 0; i < 50; i++) {
    const randomChapter =
      allChapters[Math.floor(Math.random() * allChapters.length)];
    const lastLesson = await Lesson.find({ chapterId: randomChapter._id })
      .sort({ order: -1 })
      .limit(1);
    const order = lastLesson.length > 0 ? lastLesson[0].order + 1 : 1;

    const lesson = await Lesson.create({
      chapterId: randomChapter._id,
      title: `Advanced Lesson ${i + 1}: ${generateLessonTitle()}`,
      content: `<h2>Welcome to Advanced Lesson ${
        i + 1
      }</h2><p>This comprehensive lesson covers advanced concepts and practical applications. You'll learn through hands-on examples and real-world scenarios.</p><h3>Key Topics:</h3><ul><li>Core concepts and fundamentals</li><li>Best practices and patterns</li><li>Common pitfalls to avoid</li><li>Practical exercises</li></ul><p>By the end of this lesson, you'll have a solid understanding of the topic and be able to apply it in your projects.</p>`,
      isPreview: Math.random() < 0.2, // 20% are preview
      order,
      videoUrl: `https://example.com/videos/lesson-${i + 1}.mp4`,
      duration: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
    });
    newLessons.push(lesson);
  }
  console.log(`✅ Created ${newLessons.length} new lessons`);

  // Add 50 quizzes distributed across courses
  console.log("\n❓ Adding 50 new quizzes...");
  for (let i = 0; i < 50; i++) {
    const randomCourse =
      allCourses[Math.floor(Math.random() * allCourses.length)];
    const randomLesson =
      newLessons[Math.floor(Math.random() * newLessons.length)];

    const quiz = await Quiz.create({
      courseId: randomCourse._id,
      lessonId: randomLesson._id,
      title: `Quiz ${i + 1}: ${generateQuizTitle()}`,
      description: `Test your knowledge on the concepts covered in this section. This quiz contains multiple-choice questions to assess your understanding.`,
      passingScore: 70 + Math.floor(Math.random() * 20), // 70-90%
      timeLimit: Math.floor(Math.random() * 20) + 10, // 10-30 minutes
      attemptsAllowed: Math.floor(Math.random() * 3) + 1, // 1-3 attempts
      isPublished: true,
    });
    newQuizzes.push(quiz);
  }
  console.log(`✅ Created ${newQuizzes.length} new quizzes`);

  // Add 50 questions (distributed 200 total questions across 50 quizzes = 4 per quiz)
  console.log("\n❓ Adding 200 new questions (4 per quiz)...");
  for (const quiz of newQuizzes) {
    for (let j = 0; j < 4; j++) {
      const questionType = ["multiple_choice", "true_false"][
        Math.floor(Math.random() * 2)
      ];

      let questionData = {
        quizId: quiz._id,
        questionText: generateQuestionText(j + 1),
        type: questionType,
        explanation: `This is the correct answer because it follows the principles we discussed. The other options are incorrect due to various reasons explained in the lesson.`,
      };

      if (questionType === "multiple_choice") {
        questionData.options = [
          "Option A - Correct answer",
          "Option B - Incorrect answer",
          "Option C - Incorrect answer",
          "Option D - Incorrect answer",
        ];
        questionData.correctOption = 0; // First option is correct
      } else {
        // true_false question
        questionData.correctBoolean = Math.random() < 0.5; // Randomly true or false
      }

      const question = await Question.create(questionData);
      newQuestions.push(question);
    }
  }
  console.log(`✅ Created ${newQuestions.length} new questions`);

  // Add 30 discussions distributed across courses
  console.log("\n💬 Adding 30 new discussions...");
  for (let i = 0; i < 30; i++) {
    const randomCourse =
      allCourses[Math.floor(Math.random() * allCourses.length)];
    const randomStudent =
      allStudents[Math.floor(Math.random() * allStudents.length)];

    const discussion = await Discussion.create({
      courseId: randomCourse._id,
      userId: randomStudent._id,
      title: generateDiscussionTitle(i + 1),
      content: `I have a question about this topic. ${generateDiscussionContent()}. Can someone help me understand this better? I've tried several approaches but I'm still confused about the best practices.`,
      isPinned: Math.random() < 0.1, // 10% are pinned
      views: Math.floor(Math.random() * 200),
      likes: [], // Initialize empty likes array
    });
    newDiscussions.push(discussion);
  }
  console.log(`✅ Created ${newDiscussions.length} new discussions`);

  // Add 90 comments (3 per discussion)
  console.log("\n💭 Adding 90 new comments (3 per discussion)...");
  for (const discussion of newDiscussions) {
    for (let j = 0; j < 3; j++) {
      const randomUser =
        j === 0
          ? allTeachers[Math.floor(Math.random() * allTeachers.length)] // First comment from teacher
          : allUsers[Math.floor(Math.random() * allUsers.length)];

      const comment = await Comment.create({
        discussionId: discussion._id,
        userId: randomUser._id,
        content: generateCommentContent(j + 1),
        parentId: null, // Top-level comments
        likes: [], // Initialize empty likes array
      });
      newComments.push(comment);
    }
  }
  console.log(`✅ Created ${newComments.length} new comments`);

  return {
    lessons: newLessons,
    quizzes: newQuizzes,
    questions: newQuestions,
    discussions: newDiscussions,
    comments: newComments,
  };
};

// Helper functions for generating realistic content
const generateLessonTitle = () => {
  const titles = [
    "Deep Dive into Core Concepts",
    "Practical Implementation Guide",
    "Advanced Techniques and Patterns",
    "Real-World Case Studies",
    "Performance Optimization Strategies",
    "Security Best Practices",
    "Testing and Debugging",
    "Design Patterns and Architecture",
    "Integration and Deployment",
    "Troubleshooting Common Issues",
  ];
  return titles[Math.floor(Math.random() * titles.length)];
};

const generateQuizTitle = () => {
  const titles = [
    "Fundamentals Assessment",
    "Advanced Concepts Test",
    "Practical Application Quiz",
    "Knowledge Check",
    "Comprehensive Review",
    "Skills Evaluation",
    "Module Completion Test",
    "Concept Mastery Quiz",
  ];
  return titles[Math.floor(Math.random() * titles.length)];
};

const generateQuestionText = (num) => {
  const questions = [
    `What is the primary benefit of using this approach in production environments?`,
    `Which of the following best describes the correct implementation pattern?`,
    `In what scenario would you choose this solution over alternatives?`,
    `What are the key considerations when implementing this feature?`,
    `Which statement about this concept is TRUE?`,
  ];
  return questions[Math.floor(Math.random() * questions.length)];
};

const generateDiscussionTitle = (num) => {
  const titles = [
    "Best practices for implementing this feature?",
    "Struggling with understanding this concept",
    "How to optimize performance in this scenario?",
    "Question about the assignment requirements",
    "Alternative approaches to solve this problem",
    "Clarification needed on lecture topic",
    "Real-world application examples?",
    "Debugging help needed",
    "Recommended resources for deeper learning?",
    "Project implementation guidance",
  ];
  return titles[Math.floor(Math.random() * titles.length)];
};

const generateDiscussionContent = () => {
  const content = [
    "I read through the materials but some parts are still unclear",
    "Has anyone successfully implemented this in a real project",
    "Looking for practical examples beyond what was covered",
    "The documentation mentions this but I need more context",
    "Would appreciate any tips from experienced developers",
  ];
  return content[Math.floor(Math.random() * content.length)];
};

const generateCommentContent = (num) => {
  if (num === 1) {
    return `Great question! Let me clarify this for you. The key thing to understand is that you need to consider multiple factors. First, look at the requirements carefully. Then, break down the problem into smaller parts. Feel free to ask if you need more details.`;
  } else {
    const comments = [
      `I had the same issue! What helped me was going back to the fundamentals and practicing more.`,
      `Thanks for asking this, I was wondering about the same thing. The previous answer really helped me understand it better.`,
      `Have you tried looking at the example in the lesson materials? That cleared things up for me.`,
      `I found this helpful resource that explains it well: [link]. Hope it helps!`,
      `Just wanted to add that in my experience, this approach works best when you also consider...`,
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }
};

const generateTags = () => {
  const allTags = [
    "question",
    "help-needed",
    "discussion",
    "best-practices",
    "troubleshooting",
    "project",
    "assignment",
    "optimization",
    "debugging",
  ];
  const numTags = Math.floor(Math.random() * 3) + 1;
  const tags = [];
  for (let i = 0; i < numTags; i++) {
    const tag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
};

const seedDatabase = async () => {
  try {
    console.log("\n🌱 Enhanced Database Seeding...\n");
    console.log("=".repeat(50));

    await connectDB();
    await clearDatabase(); // This now does nothing - keeps existing data

    // Get existing teachers from database
    const existingTeachers = await User.find({ role: "teacher" });

    if (existingTeachers.length === 0) {
      console.log(
        "⚠️ No teachers found in database. Please run initial seed first."
      );
      process.exit(1);
    }

    console.log(`\n✅ Found ${existingTeachers.length} existing teachers`);

    // Add enhanced data (50 lessons, quizzes, discussions, comments, questions)
    const enhancedData = await seedEnhancedData();

    // Get all counts
    const totalCourses = await Course.countDocuments();
    const totalChapters = await Chapter.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalQuizzes = await Quiz.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const totalDiscussions = await Discussion.countDocuments();
    const totalComments = await Comment.countDocuments();

    console.log("\n" + "=".repeat(50));
    console.log("\n✅ Enhanced data added successfully!");
    console.log("\n📊 New Content Summary:");
    console.log(`   - New Lessons: ${enhancedData.lessons.length}`);
    console.log(`   - New Quizzes: ${enhancedData.quizzes.length}`);
    console.log(`   - New Questions: ${enhancedData.questions.length}`);
    console.log(`   - New Discussions: ${enhancedData.discussions.length}`);
    console.log(`   - New Comments: ${enhancedData.comments.length}`);
    console.log("\n📈 Total Database Content:");
    console.log(`   - Total Courses: ${totalCourses}`);
    console.log(`   - Total Chapters: ${totalChapters}`);
    console.log(`   - Total Lessons: ${totalLessons}`);
    console.log(`   - Total Quizzes: ${totalQuizzes}`);
    console.log(`   - Total Questions: ${totalQuestions}`);
    console.log(`   - Total Discussions: ${totalDiscussions}`);
    console.log(`   - Total Comments: ${totalComments}`);
    console.log("\n" + "=".repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
