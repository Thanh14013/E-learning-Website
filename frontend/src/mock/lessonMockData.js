/**
 * Mock Data for Lesson Player
 * This file contains sample data for testing the lesson player functionality
 */

/**
 * Mock lesson data
 * In production, this would come from API calls
 */
export const mockLessonData = {
  "lesson-1": {
    id: "lesson-1",
    title: "Introduction to React Hooks",
    description:
      "Learn the fundamentals of React Hooks including useState, useEffect, and useContext. This lesson covers basic concepts and practical examples.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: 600, // 10 minutes in seconds
    views: 1250,
    content: `
      <h2>Introduction to React Hooks</h2>
      <p>React Hooks are functions that let you use state and other React features in functional components.</p>
      
      <h3>Key Concepts</h3>
      <ul>
        <li><strong>useState:</strong> Manage component state</li>
        <li><strong>useEffect:</strong> Handle side effects</li>
        <li><strong>useContext:</strong> Access context values</li>
        <li><strong>useRef:</strong> Reference DOM elements</li>
      </ul>
      
      <h3>Example: useState</h3>
      <pre><code>import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    &lt;div&gt;
      &lt;p&gt;Count: {count}&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;
        Increment
      &lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
      
      <h3>Best Practices</h3>
      <ol>
        <li>Only call hooks at the top level</li>
        <li>Only call hooks from React functions</li>
        <li>Use custom hooks to share logic</li>
      </ol>
    `,
    resources: [
      {
        id: "res-1",
        name: "React Hooks Cheat Sheet.pdf",
        type: "pdf",
        size: 2048000, // 2MB
        url: "https://example.com/resources/react-hooks-cheatsheet.pdf",
        description: "Complete reference guide for all React Hooks",
      },
      {
        id: "res-2",
        name: "Code Examples.zip",
        type: "zip",
        size: 5120000, // 5MB
        url: "https://example.com/resources/code-examples.zip",
        description: "Source code for all examples in this lesson",
      },
      {
        id: "res-3",
        name: "Presentation Slides.pptx",
        type: "pptx",
        size: 3072000, // 3MB
        url: "https://example.com/resources/slides.pptx",
        description: "PowerPoint presentation used in this lesson",
      },
    ],
  },
  "lesson-2": {
    id: "lesson-2",
    title: "Advanced State Management",
    description:
      "Deep dive into advanced state management patterns using useReducer and Context API.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: 720, // 12 minutes
    views: 980,
    content: `
      <h2>Advanced State Management</h2>
      <p>Learn how to manage complex state logic in React applications.</p>
      
      <h3>useReducer Hook</h3>
      <p>useReducer is an alternative to useState that's better suited for complex state logic.</p>
      
      <h3>Context API</h3>
      <p>Share data across component tree without prop drilling.</p>
    `,
    resources: [
      {
        id: "res-4",
        name: "State Management Guide.pdf",
        type: "pdf",
        size: 1536000,
        url: "https://example.com/resources/state-management.pdf",
      },
    ],
  },
  "lesson-3": {
    id: "lesson-3",
    title: "Custom Hooks",
    description:
      "Create reusable custom hooks to share logic across components.",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: 540, // 9 minutes
    views: 750,
    content: `
      <h2>Creating Custom Hooks</h2>
      <p>Custom hooks allow you to extract component logic into reusable functions.</p>
    `,
    resources: [],
  },
};

/**
 * Mock course structure data
 * Represents the complete course with chapters and lessons
 */
export const mockCourseStructure = {
  "course-1": {
    id: "course-1",
    title: "Complete React Development Course",
    instructor: "John Doe",
    chapters: [
      {
        id: "chapter-1",
        title: "React Fundamentals",
        order: 1,
        duration: "45 min",
        lessons: [
          {
            id: "lesson-1",
            title: "Introduction to React Hooks",
            type: "video",
            duration: "10 min",
            completed: false,
            locked: false,
          },
          {
            id: "lesson-2",
            title: "Advanced State Management",
            type: "video",
            duration: "12 min",
            completed: false,
            locked: false,
          },
          {
            id: "lesson-3",
            title: "Custom Hooks",
            type: "video",
            duration: "9 min",
            completed: false,
            locked: false,
          },
          {
            id: "quiz-1",
            title: "React Fundamentals Quiz",
            type: "quiz",
            duration: "15 min",
            completed: false,
            locked: false,
          },
        ],
      },
      {
        id: "chapter-2",
        title: "Component Architecture",
        order: 2,
        duration: "60 min",
        lessons: [
          {
            id: "lesson-4",
            title: "Component Composition",
            type: "video",
            duration: "15 min",
            completed: false,
            locked: false,
          },
          {
            id: "lesson-5",
            title: "Higher-Order Components",
            type: "video",
            duration: "18 min",
            completed: false,
            locked: false,
          },
          {
            id: "lesson-6",
            title: "Render Props Pattern",
            type: "video",
            duration: "12 min",
            completed: false,
            locked: false,
          },
          {
            id: "reading-1",
            title: "Architecture Best Practices",
            type: "reading",
            duration: "10 min",
            completed: false,
            locked: false,
          },
        ],
      },
      {
        id: "chapter-3",
        title: "Performance Optimization",
        order: 3,
        duration: "50 min",
        lessons: [
          {
            id: "lesson-7",
            title: "React.memo and useMemo",
            type: "video",
            duration: "14 min",
            completed: false,
            locked: true,
          },
          {
            id: "lesson-8",
            title: "Code Splitting",
            type: "video",
            duration: "16 min",
            completed: false,
            locked: true,
          },
          {
            id: "lesson-9",
            title: "Lazy Loading",
            type: "video",
            duration: "12 min",
            completed: false,
            locked: true,
          },
        ],
      },
      {
        id: "chapter-4",
        title: "Testing React Applications",
        order: 4,
        duration: "40 min",
        lessons: [
          {
            id: "lesson-10",
            title: "Unit Testing with Jest",
            type: "video",
            duration: "15 min",
            completed: false,
            locked: true,
          },
          {
            id: "lesson-11",
            title: "Testing React Components",
            type: "video",
            duration: "18 min",
            completed: false,
            locked: true,
          },
          {
            id: "quiz-2",
            title: "Final Assessment",
            type: "quiz",
            duration: "20 min",
            completed: false,
            locked: true,
          },
        ],
      },
    ],
  },
};

/**
 * Helper function to get lesson by ID
 * @param {string} lessonId - Lesson ID
 * @returns {Object|null} Lesson data or null
 */
export const getLessonById = (lessonId) => {
  return mockLessonData[lessonId] || null;
};

/**
 * Helper function to get course structure by ID
 * @param {string} courseId - Course ID
 * @returns {Object|null} Course structure or null
 */
export const getCourseById = (courseId) => {
  return mockCourseStructure[courseId] || null;
};

/**
 * Helper function to mark lesson as completed
 * @param {string} courseId - Course ID
 * @param {string} lessonId - Lesson ID
 */
export const markLessonCompleted = (courseId, lessonId) => {
  const course = mockCourseStructure[courseId];
  if (!course) return;

  course.chapters.forEach((chapter) => {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      lesson.completed = true;
    }
  });
};

/**
 * Helper function to get next lesson
 * @param {string} courseId - Course ID
 * @param {string} currentLessonId - Current lesson ID
 * @returns {Object|null} Next lesson or null
 */
export const getNextLesson = (courseId, currentLessonId) => {
  const course = mockCourseStructure[courseId];
  if (!course) return null;

  const allLessons = [];
  course.chapters.forEach((chapter) => {
    allLessons.push(...chapter.lessons);
  });

  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
    return allLessons[currentIndex + 1];
  }

  return null;
};

/**
 * Helper function to get previous lesson
 * @param {string} courseId - Course ID
 * @param {string} currentLessonId - Current lesson ID
 * @returns {Object|null} Previous lesson or null
 */
export const getPreviousLesson = (courseId, currentLessonId) => {
  const course = mockCourseStructure[courseId];
  if (!course) return null;

  const allLessons = [];
  course.chapters.forEach((chapter) => {
    allLessons.push(...chapter.lessons);
  });

  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  if (currentIndex > 0) {
    return allLessons[currentIndex - 1];
  }

  return null;
};
