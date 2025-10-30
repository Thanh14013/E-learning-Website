import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './QuizDetail.css';

const QuizDetail = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    fetchQuizDetail();
  }, [quizId]);

  const fetchQuizDetail = async () => {
    try {
      setLoading(true);
      // Mock data following student UI patterns
      const mockQuiz = {
        id: quizId,
        title: "JavaScript Fundamentals Quiz",
        description: "Test your knowledge of basic JavaScript concepts including variables, functions, and DOM manipulation. This quiz covers essential topics that every JavaScript developer should know.",
        courseId: "course-1",
        courseTitle: "Complete JavaScript Course",
        duration: 30,
        passingScore: 70,
        attemptsAllowed: 3,
        totalQuestions: 20,
        difficulty: "Beginner",
        category: "Programming",
        isPublished: true,
        createdAt: "2024-01-10T08:00:00Z",
        instructions: [
          "Read each question carefully before answering",
          "You have 30 minutes to complete this quiz",
          "You can navigate between questions using the navigation panel",
          "Flag questions you want to review later",
          "Once submitted, you cannot make changes",
          "You can attempt this quiz up to 3 times"
        ],
        topics: [
          "Variables and Data Types",
          "Functions and Scope",
          "DOM Manipulation",
          "Event Handling",
          "Basic Algorithms"
        ]
      };

      const mockAttempts = [
        {
          id: 1,
          score: 85,
          percentage: 85,
          isPassed: true,
          attemptNumber: 1,
          startedAt: "2024-01-15T10:30:00Z",
          submittedAt: "2024-01-15T11:00:00Z",
          timeUsed: 28,
          correctAnswers: 17,
          totalQuestions: 20
        },
        {
          id: 2,
          score: 92,
          percentage: 92,
          isPassed: true,
          attemptNumber: 2,
          startedAt: "2024-01-20T14:15:00Z",
          submittedAt: "2024-01-20T14:42:00Z",
          timeUsed: 27,
          correctAnswers: 18,
          totalQuestions: 20
        }
      ];

      setQuiz(mockQuiz);
      setAttempts(mockAttempts);
      setError(null);
    } catch (err) {
      setError('Failed to load quiz details');
      console.error('Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    navigate(`/quiz/${quizId}/take`);
  };

  const handleViewAttempt = (attemptId) => {
    navigate(`/quiz/${quizId}/attempt/${attemptId}`);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Beginner': '#10B981',
      'Intermediate': '#F59E0B',
      'Advanced': '#EF4444'
    };
    return colors[difficulty] || colors['Beginner'];
  };

  const getAttemptStatus = (attempt) => {
    if (attempt.isPassed) {
      return { text: 'Passed', className: 'status-passed', icon: '✅' };
    } else {
      return { text: 'Failed', className: 'status-failed', icon: '❌' };
    }
  };

  if (loading) {
    return (
      <div className="quiz-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading quiz details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-detail-error">
        <p>{error}</p>
        <button onClick={fetchQuizDetail} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-detail-not-found">
        <h2>Quiz not found</h2>
        <p>The quiz you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/quizzes')} className="back-btn">
          Back to Quizzes
        </button>
      </div>
    );
  }

  const canTakeQuiz = attempts.length < quiz.attemptsAllowed;
  const bestAttempt = attempts.reduce((best, current) => 
    current.percentage > (best?.percentage || 0) ? current : best, null
  );

  return (
    <div className="quiz-detail-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button onClick={() => navigate('/quizzes')} className="breadcrumb-link">
          Quizzes
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{quiz.title}</span>
      </div>

      {/* Quiz Header */}
      <div className="quiz-header">
        <div className="quiz-header-content">
          <div className="quiz-title-section">
            <div className="quiz-badges">
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(quiz.difficulty) }}
              >
                {quiz.difficulty}
              </span>
              <span className="category-badge">{quiz.category}</span>
            </div>
            <h1 className="quiz-title">{quiz.title}</h1>
            <p className="quiz-description">{quiz.description}</p>
            <p className="course-info">From: <span className="course-title">{quiz.courseTitle}</span></p>
          </div>

          <div className="quiz-actions">
            {canTakeQuiz ? (
              <button 
                className="start-quiz-btn"
                onClick={handleStartQuiz}
              >
                <span className="btn-icon">🚀</span>
                Start Quiz
              </button>
            ) : (
              <div className="attempts-exhausted">
                <span className="exhausted-icon">⏰</span>
                <span>All attempts used</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Information Grid */}
      <div className="quiz-info-grid">
        <div className="info-card">
          <div className="info-icon">⏱️</div>
          <div className="info-content">
            <h3>Duration</h3>
            <p>{formatDuration(quiz.duration)}</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">❓</div>
          <div className="info-content">
            <h3>Questions</h3>
            <p>{quiz.totalQuestions} questions</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🎯</div>
          <div className="info-content">
            <h3>Passing Score</h3>
            <p>{quiz.passingScore}%</p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🔄</div>
          <div className="info-content">
            <h3>Attempts</h3>
            <p>{attempts.length}/{quiz.attemptsAllowed} used</p>
          </div>
        </div>

        {bestAttempt && (
          <div className="info-card best-score">
            <div className="info-icon">🏆</div>
            <div className="info-content">
              <h3>Best Score</h3>
              <p className="score-value">{bestAttempt.percentage}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="quiz-content">
        <div className="content-grid">
          {/* Instructions */}
          <div className="instructions-section">
            <h2 className="section-title">Instructions</h2>
            <div className="instructions-list">
              {quiz.instructions.map((instruction, index) => (
                <div key={index} className="instruction-item">
                  <span className="instruction-number">{index + 1}</span>
                  <span className="instruction-text">{instruction}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Topics Covered */}
          <div className="topics-section">
            <h2 className="section-title">Topics Covered</h2>
            <div className="topics-list">
              {quiz.topics.map((topic, index) => (
                <div key={index} className="topic-item">
                  <span className="topic-icon">📚</span>
                  <span className="topic-text">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Previous Attempts */}
        {attempts.length > 0 && (
          <div className="attempts-section">
            <h2 className="section-title">Previous Attempts</h2>
            <div className="attempts-list">
              {attempts.map((attempt) => {
                const status = getAttemptStatus(attempt);
                return (
                  <div key={attempt.id} className="attempt-card">
                    <div className="attempt-header">
                      <div className="attempt-info">
                        <h3>Attempt #{attempt.attemptNumber}</h3>
                        <p className="attempt-date">{formatDate(attempt.submittedAt)}</p>
                      </div>
                      <div className={`attempt-status ${status.className}`}>
                        <span className="status-icon">{status.icon}</span>
                        <span className="status-text">{status.text}</span>
                      </div>
                    </div>

                    <div className="attempt-metrics">
                      <div className="metric">
                        <span className="metric-label">Score</span>
                        <span className="metric-value">{attempt.percentage}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Correct</span>
                        <span className="metric-value">{attempt.correctAnswers}/{attempt.totalQuestions}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Time Used</span>
                        <span className="metric-value">{attempt.timeUsed} min</span>
                      </div>
                    </div>

                    <div className="attempt-actions">
                      <button 
                        className="view-attempt-btn"
                        onClick={() => handleViewAttempt(attempt.id)}
                      >
                        <span className="btn-icon">👁️</span>
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizDetail;
