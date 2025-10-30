/**
 * Progress Tracker Utility
 * Provides functions to calculate and manage course and lesson progress
 * Handles localStorage persistence and progress statistics
 */

/**
 * Calculate overall course progress from course structure
 * @param {Object} courseStructure - Course structure with chapters and lessons
 * @returns {Object} Progress statistics with completed, total, and percentage
 */
export const calculateCourseProgress = (courseStructure) => {
  if (!courseStructure || !courseStructure.chapters) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  let totalLessons = 0;
  let completedLessons = 0;

  // Iterate through all chapters and lessons
  courseStructure.chapters.forEach((chapter) => {
    if (chapter.lessons && Array.isArray(chapter.lessons)) {
      chapter.lessons.forEach((lesson) => {
        totalLessons++;

        // Check if lesson is completed from localStorage or lesson object
        const isCompleted = lesson.completed || isLessonCompleted(lesson.id);
        if (isCompleted) {
          completedLessons++;
        }
      });
    }
  });

  // Calculate percentage
  const percentage =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return {
    completed: completedLessons,
    total: totalLessons,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
  };
};

/**
 * Check if a specific lesson is completed
 * @param {string} lessonId - Lesson ID to check
 * @returns {boolean} Whether lesson is completed
 */
export const isLessonCompleted = (lessonId) => {
  try {
    const progressData = localStorage.getItem(`lesson-progress-${lessonId}`);
    if (!progressData) return false;

    const data = JSON.parse(progressData);
    return data.completed === true;
  } catch (error) {
    console.error("Error checking lesson completion:", error);
    return false;
  }
};

/**
 * Get lesson progress data
 * @param {string} lessonId - Lesson ID to get progress for
 * @returns {Object|null} Progress data or null if not found
 */
export const getLessonProgress = (lessonId) => {
  try {
    const progressData = localStorage.getItem(`lesson-progress-${lessonId}`);
    if (!progressData) return null;

    return JSON.parse(progressData);
  } catch (error) {
    console.error("Error getting lesson progress:", error);
    return null;
  }
};

/**
 * Save lesson progress to localStorage
 * @param {string} lessonId - Lesson ID
 * @param {Object} progressData - Progress data to save
 * @returns {boolean} Success status
 */
export const saveLessonProgress = (lessonId, progressData) => {
  try {
    const dataToSave = {
      ...progressData,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(
      `lesson-progress-${lessonId}`,
      JSON.stringify(dataToSave)
    );
    return true;
  } catch (error) {
    console.error("Error saving lesson progress:", error);
    return false;
  }
};

/**
 * Mark a lesson as completed
 * @param {string} lessonId - Lesson ID to mark complete
 * @param {number} duration - Total lesson duration in seconds
 * @returns {boolean} Success status
 */
export const markLessonAsCompleted = (lessonId, duration = 0) => {
  const progressData = {
    progress: 100,
    watchedTime: duration,
    completed: true,
    completedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  return saveLessonProgress(lessonId, progressData);
};

/**
 * Get total time spent on all lessons in a course
 * @param {Object} courseStructure - Course structure with chapters and lessons
 * @returns {number} Total time spent in seconds
 */
export const getTotalTimeSpent = (courseStructure) => {
  if (!courseStructure || !courseStructure.chapters) {
    return 0;
  }

  let totalTime = 0;

  courseStructure.chapters.forEach((chapter) => {
    if (chapter.lessons && Array.isArray(chapter.lessons)) {
      chapter.lessons.forEach((lesson) => {
        const progress = getLessonProgress(lesson.id);
        if (progress && progress.watchedTime) {
          totalTime += progress.watchedTime;
        }
      });
    }
  });

  return totalTime;
};

/**
 * Format time in hours, minutes, and seconds
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Update course structure with completed status from localStorage
 * @param {Object} courseStructure - Course structure to update
 * @returns {Object} Updated course structure
 */
export const updateCourseStructureWithProgress = (courseStructure) => {
  if (!courseStructure || !courseStructure.chapters) {
    return courseStructure;
  }

  // Create a deep copy to avoid mutating original
  const updatedStructure = JSON.parse(JSON.stringify(courseStructure));

  updatedStructure.chapters.forEach((chapter) => {
    if (chapter.lessons && Array.isArray(chapter.lessons)) {
      chapter.lessons.forEach((lesson) => {
        const progress = getLessonProgress(lesson.id);
        if (progress) {
          lesson.completed = progress.completed || false;
          lesson.progress = progress.progress || 0;
          lesson.watchedTime = progress.watchedTime || 0;
        }
      });
    }
  });

  return updatedStructure;
};

/**
 * Clear all progress data for a course
 * @param {Object} courseStructure - Course structure
 * @returns {boolean} Success status
 */
export const clearCourseProgress = (courseStructure) => {
  try {
    if (!courseStructure || !courseStructure.chapters) {
      return false;
    }

    courseStructure.chapters.forEach((chapter) => {
      if (chapter.lessons && Array.isArray(chapter.lessons)) {
        chapter.lessons.forEach((lesson) => {
          localStorage.removeItem(`lesson-progress-${lesson.id}`);
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Error clearing course progress:", error);
    return false;
  }
};

/**
 * Get next incomplete lesson in the course
 * @param {Object} courseStructure - Course structure
 * @returns {Object|null} Next incomplete lesson or null
 */
export const getNextIncompleteLesson = (courseStructure) => {
  if (!courseStructure || !courseStructure.chapters) {
    return null;
  }

  for (const chapter of courseStructure.chapters) {
    if (chapter.lessons && Array.isArray(chapter.lessons)) {
      for (const lesson of chapter.lessons) {
        if (!lesson.completed && !isLessonCompleted(lesson.id)) {
          return lesson;
        }
      }
    }
  }

  return null; // All lessons completed
};

/**
 * Calculate estimated time remaining for course
 * @param {Object} courseStructure - Course structure with duration info
 * @returns {number} Estimated time remaining in seconds
 */
export const getEstimatedTimeRemaining = (courseStructure) => {
  if (!courseStructure || !courseStructure.chapters) {
    return 0;
  }

  let remainingTime = 0;

  courseStructure.chapters.forEach((chapter) => {
    if (chapter.lessons && Array.isArray(chapter.lessons)) {
      chapter.lessons.forEach((lesson) => {
        const isCompleted = lesson.completed || isLessonCompleted(lesson.id);
        if (!isCompleted && lesson.duration) {
          // Parse duration string (e.g., "10 min" -> 600 seconds)
          const durationMatch = lesson.duration.match(/(\d+)/);
          if (durationMatch) {
            const minutes = parseInt(durationMatch[1]);
            remainingTime += minutes * 60;
          }
        }
      });
    }
  });

  return remainingTime;
};
