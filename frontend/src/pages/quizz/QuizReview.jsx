import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import QuizQuestion from '../../components/quizz/QuizQuestion';
import { Button } from '../../components/common/Button';
import quizService from '../../services/quizService';
import './QuizReview.css';

/**
 * Quiz Review Page - Task 5.6
 * 
 * Displays quiz results after submission:
 * - Quiz results (score, percentage, pass/fail)
 * - Correct answers vs user answers
 * - Explanations for each question
 * - Question-by-question review
 * - Retake quiz button
 * - Previous attempts list
 * - Download certificate (if passed)
 */
const QuizReview = () => {
  const { quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuizReview();
    loadPreviousAttempts();
  }, [quizId, attemptId]);

  /**
   * Load quiz review data
   */
  const loadQuizReview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get quiz detail
      const quizData = await quizService.getQuizDetail(quizId);
      setQuiz(quizData);

      // Get result detail with answers and explanations
      const resultData = await quizService.getQuizResult(quizId, attemptId);
      setResult(resultData);
      
      // Process questions with user answers and correct answers
      const processedQuestions = quizData.questions.map((question, index) => {
        const userAnswer = resultData.answers.find(a => a.questionId === question.id);
        return {
          ...question,
          userAnswer: userAnswer?.answer || null,
          isCorrect: userAnswer?.isCorrect || false,
          pointsEarned: userAnswer?.pointsEarned || 0
        };
      });
      
      setQuestions(processedQuestions);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load quiz review:', err);
      setError('Không thể tải kết quả quiz. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  /**
   * Load previous attempts
   */
  const loadPreviousAttempts = async () => {
    try {
      const attemptsData = await quizService.getQuizAttempts(quizId);
      setAttempts(attemptsData || []);
    } catch (err) {
      console.error('Failed to load attempts:', err);
      // Don't show error for attempts, just continue
    }
  };

  /**
   * Handle retake quiz
   */
  const handleRetakeQuiz = () => {
    // Navigate to quiz detail to start new attempt
    navigate(`/quiz/${quizId}`);
  };

  /**
   * Handle view previous attempt
   */
  const handleViewAttempt = (prevAttemptId) => {
    navigate(`/quiz/${quizId}/attempt/${prevAttemptId}`);
  };

  /**
   * Handle download certificate
   */
  const handleDownloadCertificate = async () => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await api.get(`/quizzes/${quizId}/certificates/${attemptId}`, {
      //   responseType: 'blob'
      // });
      // const blob = new Blob([response.data], { type: 'application/pdf' });
      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `certificate-${quiz.title}-${attemptId}.pdf`;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // window.URL.revokeObjectURL(url);
      
      // For now, show a message (in production, this would download PDF)
      alert(`Chứng chỉ cho "${quiz.title}" đang được tạo. Tính năng này sẽ được hoàn thiện khi backend sẵn sàng.`);
      console.log('Downloading certificate for quiz:', quizId, 'attempt:', attemptId);
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert('Không thể tải chứng chỉ. Vui lòng thử lại sau.');
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Format duration
   */
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="quiz-review-loading">
        <div className="loading-spinner"></div>
        <p>Loading kết quả quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-review-error">
        <p>{error}</p>
        <Button onClick={() => navigate(`/quiz/${quizId}`)}>
          Quay lại
        </Button>
      </div>
    );
  }

  if (!result || !quiz) {
    return (
      <div className="quiz-review-error">
        <p>Không tìm thấy kết quả quiz.</p>
        <Button onClick={() => navigate(`/quiz/${quizId}`)}>
          Quay lại
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const earnedPoints = questions.reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
  const correctCount = questions.filter(q => q.isCorrect).length;

  return (
    <div className="quiz-review-container">
      {/* Header Section - Results Summary */}
      <div className="quiz-review-header">
        <div className="review-header-content">
          <div className="breadcrumb">
            <button onClick={() => navigate(`/quiz/${quizId}`)} className="breadcrumb-link">
              ← Quay lại
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Kết quả Quiz</span>
          </div>

          <div className="quiz-title-section">
            <h1 className="quiz-title">{quiz.title}</h1>
            <p className="quiz-subtitle">
              Attempt #{result.attemptNumber} • {formatDate(result.submittedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Results Summary Card */}
      <div className={`results-summary-card ${result.isPassed ? 'passed' : 'failed'}`}>
        <div className="summary-content">
          <div className="score-display">
            <div className="score-circle">
              <div className="score-value">{result.percentage}%</div>
              <div className="score-label">Điểm số</div>
            </div>
            <div className="score-details">
              <div className="detail-item">
                <span className="detail-label">Đúng:</span>
                <span className="detail-value">{correctCount}/{questions.length}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Điểm:</span>
                <span className="detail-value">{earnedPoints}/{totalPoints}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Thời gian:</span>
                <span className="detail-value">{result.timeUsed || 'N/A'} phút</span>
              </div>
            </div>
          </div>

          <div className="result-status">
            {result.isPassed ? (
              <div className="status-badge passed">
                <span className="status-icon">✅</span>
                <span className="status-text">ĐÃ ĐẠT</span>
              </div>
            ) : (
              <div className="status-badge failed">
                <span className="status-icon">❌</span>
                <span className="status-text">CHƯA ĐẠT</span>
              </div>
            )}
            <p className="passing-requirement">
              Điểm đạt: {quiz.passingScore}% (Cần {Math.ceil((quiz.passingScore / 100) * questions.length)}/{questions.length} câu đúng)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="result-actions">
            {result.isPassed && (
              <Button
                variant="primary"
                onClick={handleDownloadCertificate}
                className="certificate-btn"
              >
                📜 Tải Chứng Chỉ
              </Button>
            )}
            {attempts.length < quiz.attemptsAllowed && (
              <Button
                variant="secondary"
                onClick={handleRetakeQuiz}
                className="retake-btn"
              >
                🔄 Làm Lại
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate(`/quiz/${quizId}`)}
            >
              Xem Chi Tiết Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="question-navigator-section">
        <div className="nav-header">
          <h3>Xem lại từng câu hỏi</h3>
          <div className="nav-stats">
            <span className="stat-item correct">
              ✓ {correctCount} đúng
            </span>
            <span className="stat-item incorrect">
              ✗ {questions.length - correctCount} sai
            </span>
          </div>
        </div>
        <div className="nav-buttons">
          {questions.map((q, index) => {
            const isCurrent = index === currentQuestionIndex;
            return (
              <button
                key={q.id}
                className={`nav-btn ${isCurrent ? 'active' : ''} ${q.isCorrect ? 'correct' : 'incorrect'}`}
                onClick={() => setCurrentQuestionIndex(index)}
                title={`Câu ${index + 1}: ${q.isCorrect ? 'Đúng' : 'Sai'}`}
              >
                {index + 1}
                {q.isCorrect ? ' ✓' : ' ✗'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Review Section */}
      <div className="question-review-section">
        <div className="review-main">
          <QuizQuestion
            question={{
              ...currentQuestion,
              // Add user answer and correct answer for review
              userAnswer: currentQuestion.userAnswer,
              correctAnswer: currentQuestion.type === 'multiple_choice' 
                ? currentQuestion.options?.find(o => o.isCorrect)?.id
                : currentQuestion.correctAnswer
            }}
            questionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            currentAnswer={currentQuestion.userAnswer}
            onAnswerChange={() => {}} // Disabled in review mode
            showExplanation={true}
            isReviewMode={true}
          />

          {/* Question Result Info */}
          <div className={`question-result-info ${currentQuestion.isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="result-header">
              <span className="result-icon">
                {currentQuestion.isCorrect ? '✓' : '✗'}
              </span>
              <span className="result-text">
                {currentQuestion.isCorrect ? 'Câu trả lời đúng' : 'Câu trả lời sai'}
              </span>
              <span className="result-points">
                {currentQuestion.pointsEarned}/{currentQuestion.points || 1} điểm
              </span>
            </div>
            {currentQuestion.explanation && (
              <div className="explanation-box">
                <strong>Giải thích:</strong>
                <p>{currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="review-navigation">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            ← Câu trước
          </Button>
          <div className="nav-info">
            Câu {currentQuestionIndex + 1} / {questions.length}
          </div>
          <Button
            variant="primary"
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
          >
            Câu sau →
          </Button>
        </div>
      </div>

      {/* Previous Attempts Section */}
      {attempts.length > 1 && (
        <div className="previous-attempts-section">
          <h2 className="section-title">Các lần làm trước</h2>
          <div className="attempts-list">
            {attempts
              .filter(a => a.id !== attemptId)
              .map((attempt) => (
                <div key={attempt.id} className="attempt-card">
                  <div className="attempt-info">
                    <div className="attempt-number">
                      Attempt #{attempt.attemptNumber}
                    </div>
                    <div className="attempt-date">
                      {formatDate(attempt.submittedAt)}
                    </div>
                  </div>
                  <div className="attempt-score">
                    <span className={`score-badge ${attempt.isPassed ? 'passed' : 'failed'}`}>
                      {attempt.percentage}%
                    </span>
                  </div>
                  <div className="attempt-actions">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleViewAttempt(attempt.id)}
                    >
                      Xem lại
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizReview;

