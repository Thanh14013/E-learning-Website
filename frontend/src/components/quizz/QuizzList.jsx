import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './QuizzList.css';

const QuizzList = ({ courseId }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockQuizzes = [
        {
          id: 1,
          title: "JavaScript Fundamentals Quiz",
          description: "Test your knowledge of basic JavaScript concepts",
          duration: 30,
          passingScore: 70,
          totalQuestions: 20,
          attempts: [
            { id: 1, score: 85, completedAt: "2024-01-15T10:30:00Z", status: "completed" },
            { id: 2, score: 92, completedAt: "2024-01-20T14:15:00Z", status: "completed" }
          ],
          status: "completed",
          bestScore: 92,
          lastAttempt: "2024-01-20T14:15:00Z"
        },
        {
          id: 2,
          title: "React Components Quiz",
          description: "Understanding React components and lifecycle",
          duration: 45,
          passingScore: 75,
          totalQuestions: 25,
          attempts: [
            { id: 3, score: 68, completedAt: "2024-01-18T09:45:00Z", status: "completed" },
            { id: 4, score: null, completedAt: null, status: "in_progress" }
          ],
          status: "in_progress",
          bestScore: 68,
          lastAttempt: "2024-01-18T09:45:00Z"
        },
        {
          id: 3,
          title: "Node.js Backend Quiz",
          description: "Server-side JavaScript and Node.js concepts",
          duration: 60,
          passingScore: 80,
          totalQuestions: 30,
          attempts: [],
          status: "not_started",
          bestScore: null,
          lastAttempt: null
        }
      ];
      
      setQuizzes(mockQuizzes);
      setError(null);
    } catch (err) {
      setError('Failed to load quizzes');
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      not_started: { text: 'Not Started', className: 'status-not-started' },
      in_progress: { text: 'In Progress', className: 'status-in-progress' },
      completed: { text: 'Completed', className: 'status-completed' }
    };
    
    const config = statusConfig[status] || statusConfig.not_started;
    return (
      <span className={`status-badge ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getActionButton = (quiz) => {
    if (quiz.status === 'not_started') {
      return (
        <button 
          className="quiz-action-btn start-btn"
          onClick={() => handleStartQuiz(quiz.id)}
        >
          Start Quiz
        </button>
      );
    } else if (quiz.status === 'in_progress') {
      return (
        <button 
          className="quiz-action-btn continue-btn"
          onClick={() => handleContinueQuiz(quiz.id)}
        >
          Continue Quiz
        </button>
      );
    } else {
      return (
        <button 
          className="quiz-action-btn retake-btn"
          onClick={() => handleRetakeQuiz(quiz.id)}
        >
          Retake Quiz
        </button>
      );
    }
  };

  const handleStartQuiz = (quizId) => {
    console.log('Starting quiz:', quizId);
    // TODO: Navigate to quiz page
  };

  const handleContinueQuiz = (quizId) => {
    console.log('Continuing quiz:', quizId);
    // TODO: Navigate to quiz page with resume functionality
  };

  const handleRetakeQuiz = (quizId) => {
    console.log('Retaking quiz:', quizId);
    // TODO: Navigate to quiz page
  };

  const handleViewDetails = (quizId) => {
    console.log('Viewing quiz details:', quizId);
    // TODO: Navigate to quiz details page
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="quiz-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-list-error">
        <p>{error}</p>
        <button onClick={fetchQuizzes} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-list-container">
      <div className="quiz-list-header">
        <h2>Course Quizzes</h2>
        <p className="quiz-count">{quizzes.length} quiz{quizzes.length !== 1 ? 'es' : ''} available</p>
      </div>

      <div className="quiz-list">
        {quizzes.length === 0 ? (
          <div className="no-quizzes">
            <p>No quizzes available for this course.</p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-header">
                <div className="quiz-title-section">
                  <h3 className="quiz-title">{quiz.title}</h3>
                  <p className="quiz-description">{quiz.description}</p>
                </div>
                <div className="quiz-status">
                  {getStatusBadge(quiz.status)}
                </div>
              </div>

              <div className="quiz-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Duration:</span>
                  <span className="metadata-value">{formatDuration(quiz.duration)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Questions:</span>
                  <span className="metadata-value">{quiz.totalQuestions}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Passing Score:</span>
                  <span className="metadata-value">{quiz.passingScore}%</span>
                </div>
                {quiz.bestScore !== null && (
                  <div className="metadata-item">
                    <span className="metadata-label">Best Score:</span>
                    <span className={`metadata-value ${quiz.bestScore >= quiz.passingScore ? 'pass-score' : 'fail-score'}`}>
                      {quiz.bestScore}%
                    </span>
                  </div>
                )}
              </div>

              {quiz.attempts.length > 0 && (
                <div className="quiz-attempts">
                  <h4>Recent Attempts</h4>
                  <div className="attempts-list">
                    {quiz.attempts.slice(0, 3).map((attempt) => (
                      <div key={attempt.id} className="attempt-item">
                        <div className="attempt-info">
                          <span className="attempt-score">
                            {attempt.score !== null ? `${attempt.score}%` : 'In Progress'}
                          </span>
                          <span className="attempt-date">
                            {formatDate(attempt.completedAt)}
                          </span>
                        </div>
                        <span className={`attempt-status ${attempt.status}`}>
                          {attempt.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="quiz-actions">
                {getActionButton(quiz)}
                <button 
                  className="quiz-details-btn"
                  onClick={() => handleViewDetails(quiz.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuizzList;