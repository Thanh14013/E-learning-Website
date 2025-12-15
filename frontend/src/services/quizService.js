import api from "./api";

/**
 * Quiz Service - API calls for quiz-related operations
 */

const quizService = {
  /**
   * Get quiz result detail
   * @param {string} quizId - Quiz ID
   * @param {string} attemptId - Attempt ID
   * @returns {Promise} Quiz result with answers and explanations
   */
  getQuizResult: async (quizId, attemptId) => {
    const response = await api.get(`/quizzes/${quizId}/results/${attemptId}`);
    return response.data;
  },

  /**
   * Start a quiz attempt
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Quiz questions and attempt ID
   */
  startQuiz: async (quizId) => {
    const response = await api.post(`/quizzes/${quizId}/start`);
    return response.data;
  },

  // Note: Backend doesn't support auto-save during quiz
  // Answers are only saved when quiz is submitted

  /**
   * Submit quiz
   * @param {string} quizId - Quiz ID
   * @param {string} attemptId - Attempt ID
   * @param {Object} answers - All answers
   * @returns {Promise} Quiz results
   */
  submitQuiz: async (quizId, attemptId, answers) => {
    const response = await api.post(`/quizzes/${quizId}/submit`, {
      attemptId,
      answers,
    });
    return response.data;
  },

  /**
   * Get quiz attempts history
   * @param {string} quizId - Quiz ID
   * @returns {Promise} List of attempts
   */
  getQuizAttempts: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  /**
   * Get quiz detail
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Quiz details
   */
  getQuizDetail: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  },

  /**
   * Get mock quiz data (for development/testing)
   * @param {string} quizId - Quiz ID
   * @returns {Object} Mock quiz data
   */
  getMockQuizData: (quizId) => {
    return {
      id: quizId,
      title: "JavaScript Fundamentals Quiz",
      description: "Test your knowledge of basic JavaScript concepts",
      duration: 30,
      passingScore: 70,
      attemptsAllowed: 3,
      questions: [
        {
          id: "q1",
          type: "multiple_choice",
          question: "What is the capital of France?",
          options: [
            { id: "a", text: "London", isCorrect: false },
            { id: "b", text: "Paris", isCorrect: true },
            { id: "c", text: "Berlin", isCorrect: false },
            { id: "d", text: "Madrid", isCorrect: false },
          ],
          points: 1,
          explanation: "Paris is the capital and largest city of France.",
        },
        {
          id: "q2",
          type: "true_false",
          question:
            "React is a JavaScript library for building user interfaces.",
          correctAnswer: "true",
          points: 1,
          explanation:
            "React is indeed a JavaScript library developed by Facebook for building user interfaces.",
        },
        {
          id: "q3",
          type: "essay",
          question: "Explain the concept of React hooks and provide examples.",
          points: 5,
          explanation:
            "React hooks are functions that let you use state and other React features in functional components. Examples include useState, useEffect, useContext, etc.",
        },
        {
          id: "q4",
          type: "fill_blank",
          question: "Fill in the blanks to complete the sentence.",
          text: "React is a _ library for building _ interfaces.",
          blanks: ["JavaScript", "user"],
          correctAnswers: ["JavaScript", "user"],
          points: 2,
          explanation:
            "React is a JavaScript library for building user interfaces.",
        },
        {
          id: "q5",
          type: "multiple_choice",
          question: "Which of the following is NOT a JavaScript framework?",
          options: [
            { id: "a", text: "React", isCorrect: false },
            { id: "b", text: "Vue", isCorrect: false },
            { id: "c", text: "Angular", isCorrect: false },
            { id: "d", text: "Python", isCorrect: true },
          ],
          points: 1,
          explanation:
            "Python is a programming language, not a JavaScript framework.",
        },
      ],
    };
  },
};

export default quizService;
