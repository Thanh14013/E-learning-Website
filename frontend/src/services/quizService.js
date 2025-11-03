import api from './api';

/**
 * Quiz Service - API calls for quiz-related operations
 */

const quizService = {
  /**
   * Start a quiz attempt
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Quiz questions and attempt ID
   */
  startQuiz: async (quizId) => {
    const response = await api.post(`/quizzes/${quizId}/start`);
    return response.data;
  },

  /**
   * Save quiz answers (auto-save)
   * @param {string} quizId - Quiz ID
   * @param {string} attemptId - Attempt ID
   * @param {Object} answers - Answers object { questionId: answer }
   * @returns {Promise} Saved answers
   */
  saveAnswers: async (quizId, attemptId, answers) => {
    try {
      const response = await api.put(`/quizzes/${quizId}/attempts/${attemptId}/answers`, {
        answers
      });
      return response.data;
    } catch (error) {
      // Throw error để component xử lý
      throw error;
    }
  },

  /**
   * Get saved answers for a quiz attempt
   * @param {string} quizId - Quiz ID
   * @param {string} attemptId - Attempt ID
   * @returns {Promise} Saved answers
   */
  getSavedAnswers: async (quizId, attemptId) => {
    const response = await api.get(`/quizzes/${quizId}/attempts/${attemptId}/answers`);
    return response.data;
  },

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
      answers
    });
    return response.data;
  },

  /**
   * Get quiz attempts history
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Attempts list
   */
  getAttempts: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  /**
   * Get quiz details
   * @param {string} quizId - Quiz ID
   * @returns {Promise} Quiz details
   */
  getQuizDetail: async (quizId) => {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  }
};

export default quizService;

