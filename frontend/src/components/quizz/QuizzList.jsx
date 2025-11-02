import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './QuizzList.css';

const QuizzList = ({ courseId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      // Enhanced mock data following teacher UI patterns
      const mockQuizzes = [
        {
          id: 1,
          title: "JavaScript Fundamentals Quiz",
          description: "Test your knowledge of basic JavaScript concepts including variables, functions, and DOM manipulation",
          duration: 30,
          passingScore: 70,
          totalQuestions: 20,
          attempts: [
            { id: 1, score: 85, completedAt: "2024-01-15T10:30:00Z", status: "completed" },
            { id: 2, score: 92, completedAt: "2024-01-20T14:15:00Z", status: "completed" }
          ],
          status: "completed",
          bestScore: 92,
          lastAttempt: "2024-01-20T14:15:00Z",
          category: "Programming",
          difficulty: "Beginner",
          isPublished: true,
          createdAt: "2024-01-10T08:00:00Z"
        },
        {
          id: 2,
          title: "React Components Quiz",
          description: "Understanding React components, lifecycle methods, hooks, and state management",
          duration: 45,
          passingScore: 75,
          totalQuestions: 25,
          attempts: [
            { id: 3, score: 68, completedAt: "2024-01-18T09:45:00Z", status: "completed" },
            { id: 4, score: null, completedAt: null, status: "in_progress" }
          ],
          status: "in_progress",
          bestScore: 68,
          lastAttempt: "2024-01-18T09:45:00Z",
          category: "Programming",
          difficulty: "Intermediate",
          isPublished: true,
          createdAt: "2024-01-12T10:30:00Z"
        },
        {
          id: 3,
          title: "Node.js Backend Quiz",
          description: "Server-side JavaScript, Express.js, MongoDB, and RESTful API development",
          duration: 60,
          passingScore: 80,
          totalQuestions: 30,
          attempts: [],
          status: "not_started",
          bestScore: null,
          lastAttempt: null,
          category: "Programming",
          difficulty: "Advanced",
          isPublished: true,
          createdAt: "2024-01-14T14:20:00Z"
        },
        {
          id: 4,
          title: "CSS Grid & Flexbox Quiz",
          description: "Modern CSS layout techniques including Grid and Flexbox properties",
          duration: 25,
          passingScore: 65,
          totalQuestions: 15,
          attempts: [
            { id: 5, score: 78, completedAt: "2024-01-16T16:30:00Z", status: "completed" }
          ],
          status: "completed",
          bestScore: 78,
          lastAttempt: "2024-01-16T16:30:00Z",
          category: "Design",
          difficulty: "Intermediate",
          isPublished: true,
          createdAt: "2024-01-11T09:15:00Z"
        },
        {
          id: 5,
          title: "Database Design Quiz",
          description: "SQL queries, database normalization, and relationship design",
          duration: 40,
          passingScore: 70,
          totalQuestions: 22,
          attempts: [],
          status: "not_started",
          bestScore: null,
          lastAttempt: null,
          category: "Programming",
          difficulty: "Intermediate",
          isPublished: false,
          createdAt: "2024-01-13T11:45:00Z"
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

  // Filter and sort quizzes
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quiz.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'duration':
        return a.duration - b.duration;
      case 'difficulty':
        { const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]; }
      case 'created':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      not_started: { text: 'Not Started', className: 'status-not-started', icon: '⏳' },
      in_progress: { text: 'In Progress', className: 'status-in-progress', icon: '🔄' },
      completed: { text: 'Completed', className: 'status-completed', icon: '✅' }
    };
    
    const config = statusConfig[status] || statusConfig.not_started;
    return (
      <span className={`status-badge ${config.className}`}>
        <span className="status-icon">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty) => {
    const difficultyConfig = {
      'Beginner': { className: 'difficulty-beginner', color: '#10B981' },
      'Intermediate': { className: 'difficulty-intermediate', color: '#F59E0B' },
      'Advanced': { className: 'difficulty-advanced', color: '#EF4444' }
    };
    
    const config = difficultyConfig[difficulty] || difficultyConfig['Beginner'];
    return (
      <span className={`difficulty-badge ${config.className}`} style={{ backgroundColor: config.color }}>
        {difficulty}
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
    // Navigate to quiz detail page to start quiz
    navigate(`/quiz/${quizId}`);
  };

  const handleContinueQuiz = (quizId) => {
    // Navigate to quiz detail page (will show continue option)
    navigate(`/quiz/${quizId}`);
  };

  const handleRetakeQuiz = (quizId) => {
    // Navigate to quiz detail page to retake
    navigate(`/quiz/${quizId}`);
  };

  const handleViewDetails = (quizId) => {
    // Navigate to quiz detail page
    navigate(`/quiz/${quizId}`);
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
      {/* Header Section */}
      <div className="quiz-list-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Course Quizzes</h1>
            <p className="page-subtitle">
              Test your knowledge and track your progress with interactive quizzes
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{quizzes.length}</span>
              <span className="stat-label">Total Quizzes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{quizzes.filter(q => q.status === 'completed').length}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{quizzes.filter(q => q.status === 'in_progress').length}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
        </div>
      </div>

     {/* Filters and Search */}
<div className="quiz-filters">
  <div className="filters-row">
    <div className="search-container col-70">
      <input
        type="text"
        placeholder="Search quizzes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      <span className="search-icon">🔍</span>
    </div>

    <div className="filter-group col-15">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="filter-select"
      >
        <option value="all">All Status</option>
        <option value="not_started">Not Started</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
    </div>

    <div className="filter-group col-15">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="filter-select"
      >
        <option value="title">Sort by Title</option>
        <option value="duration">Sort by Duration</option>
        <option value="difficulty">Sort by Difficulty</option>
        <option value="created">Sort by Created Date</option>
      </select>
    </div>
  </div>
</div>


      {/* Quiz Grid */}
      <div className="quiz-grid">
        {sortedQuizzes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No quizzes found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          sortedQuizzes.map((quiz) => (
            <div key={quiz.id} className={`quiz-card ${!quiz.isPublished ? 'draft' : ''}`}>
              {/* Quiz Header */}
              <div className="quiz-card-header">
                <div className="quiz-title-section">
                  <div className="quiz-badges">
                    {getDifficultyBadge(quiz.difficulty)}
                    {!quiz.isPublished && <span className="draft-badge">Draft</span>}
                  </div>
                  <h3 className="quiz-title">{quiz.title}</h3>
                  <p className="quiz-description">{quiz.description}</p>
                </div>
                <div className="quiz-status-section">
                  {getStatusBadge(quiz.status)}
                </div>
              </div>

              {/* Quiz Metrics */}
              <div className="quiz-metrics">
                <div className="metric-grid">
                  <div className="metric-item">
                    <div className="metric-icon">⏱️</div>
                    <div className="metric-content">
                      <span className="metric-value">{formatDuration(quiz.duration)}</span>
                      <span className="metric-label">Duration</span>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon">❓</div>
                    <div className="metric-content">
                      <span className="metric-value">{quiz.totalQuestions}</span>
                      <span className="metric-label">Questions</span>
                    </div>
                  </div>
                  
                  <div className="metric-item">
                    <div className="metric-icon">🎯</div>
                    <div className="metric-content">
                      <span className="metric-value">{quiz.passingScore}%</span>
                      <span className="metric-label">Passing Score</span>
                    </div>
                  </div>

                  {quiz.bestScore !== null && (
                    <div className="metric-item">
                      <div className="metric-icon">🏆</div>
                      <div className="metric-content">
                        <span className={`metric-value ${quiz.bestScore >= quiz.passingScore ? 'pass' : 'fail'}`}>
                          {quiz.bestScore}%
                        </span>
                        <span className="metric-label">Best Score</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Attempts */}
              {quiz.attempts.length > 0 && (
                <div className="quiz-attempts">
                  <h4 className="attempts-title">Recent Attempts</h4>
                  <div className="attempts-list">
                    {quiz.attempts.slice(0, 2).map((attempt) => (
                      <div key={attempt.id} className="attempt-item">
                        <div className="attempt-score">
                          {attempt.score !== null ? `${attempt.score}%` : 'In Progress'}
                        </div>
                        <div className="attempt-date">
                          {formatDate(attempt.completedAt)}
                        </div>
                        <div className={`attempt-status ${attempt.status}`}>
                          {attempt.status === 'completed' ? '✓' : '⏳'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz Actions */}
              <div className="quiz-actions">
                {getActionButton(quiz)}
                <button 
                  className="quiz-details-btn"
                  onClick={() => handleViewDetails(quiz.id)}
                >
                  <span className="btn-icon">👁️</span>
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