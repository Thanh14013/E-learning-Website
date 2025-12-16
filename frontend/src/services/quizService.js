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
};

export default quizService;
