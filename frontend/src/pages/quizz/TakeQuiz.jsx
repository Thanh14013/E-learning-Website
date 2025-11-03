import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import QuizQuestion from '../../components/quizz/QuizQuestion';
import QuizTimer from '../../components/quizz/QuizTimer';
import SaveStatusIndicator from '../../components/quizz/SaveStatusIndicator';
import useQuizAutoSave from '../../hooks/useQuizAutoSave';
import quizService from '../../services/quizService';
import './TakeQuiz.css';

/**
 * TakeQuiz Page Component
 * 
 * Page for taking a quiz with auto-save functionality
 * Features:
 * - Auto-save answers as user progresses
 * - Save to local state + backend periodically
 * - Handle connection loss gracefully
 * - Sync when connection restored
 * - Show save status indicator
 */
const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startedAt, setStartedAt] = useState(null);

  // Use auto-save hook
  const {
    answers,
    updateAnswer,
    saveStatus,
    syncAnswers,
    isOnline,
    getAllAnswers,
    lastSaveTime
  } = useQuizAutoSave(quizId, attemptId, 30000); // Save every 30 seconds

  // Load quiz and start attempt
  useEffect(() => {
    startQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (!startedAt || !quiz) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      const remaining = (quiz.duration * 60) - elapsed;
      
      setTimeRemaining(Math.max(0, remaining));

      // Auto-submit when time expires
      if (remaining <= 0) {
        handleSubmitQuiz();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, quiz]);

  /**
   * Start quiz attempt
   */
  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if there's a saved attempt in localStorage
      const savedAttempt = localStorage.getItem(`quiz_${quizId}_attempt`);
      if (savedAttempt) {
        const parsed = JSON.parse(savedAttempt);
        if (parsed.attemptId && !parsed.submitted) {
          // Resume existing attempt
          await resumeAttempt(parsed.attemptId);
          return;
        }
      }

      // Start new attempt
      const response = await quizService.startQuiz(quizId);
      
      setQuiz(response.quiz);
      setQuestions(response.questions);
      setAttemptId(response.attemptId);
      setStartedAt(response.startedAt);
      setTimeRemaining(response.quiz.duration * 60);
      
      // Save attempt info to localStorage
      localStorage.setItem(`quiz_${quizId}_attempt`, JSON.stringify({
        attemptId: response.attemptId,
        startedAt: response.startedAt,
        submitted: false
      }));

      setLoading(false);
    } catch (err) {
      console.error('Failed to start quiz:', err);
      setError('Không thể bắt đầu bài quiz. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  /**
   * Resume existing attempt
   */
  const resumeAttempt = async (existingAttemptId) => {
    try {
      // Load quiz details
      const quizData = await quizService.getQuizDetail(quizId);
      setQuiz(quizData);

      // Get saved answers
      const savedData = await quizService.getSavedAnswers(quizId, existingAttemptId);
      
      setAttemptId(existingAttemptId);
      setQuestions(quizData.questions);
      setStartedAt(savedData.startedAt || new Date().toISOString());
      
      // Calculate remaining time
      if (savedData.startedAt && quizData.duration) {
        const elapsed = Math.floor((Date.now() - new Date(savedData.startedAt).getTime()) / 1000);
        const remaining = (quizData.duration * 60) - elapsed;
        setTimeRemaining(Math.max(0, remaining));
      } else {
        setTimeRemaining(quizData.duration * 60);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to resume attempt:', err);
      // If resume fails, start new attempt
      await startQuiz();
    }
  };

  /**
   * Handle answer change
   */
  const handleAnswerChange = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      updateAnswer(currentQuestion.id, answer);
    }
  };

  /**
   * Navigate to next/previous question
   */
  const handleNavigate = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'previous' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  /**
   * Handle bookmark toggle
   */
  const handleBookmark = (questionIndex) => {
    setBookmarkedQuestions(prev => {
      if (prev.includes(questionIndex)) {
        return prev.filter(idx => idx !== questionIndex);
      } else {
        return [...prev, questionIndex];
      }
    });
  };

  /**
   * Submit quiz
   */
  const handleSubmitQuiz = async () => {
    try {
      // Final save before submission
      await syncAnswers();
      
      const allAnswers = getAllAnswers();
      
      // Submit quiz
      const result = await quizService.submitQuiz(quizId, attemptId, allAnswers);
      
      // Clear localStorage
      localStorage.removeItem(`quiz_${quizId}_attempt`);
      localStorage.removeItem(`quiz_${quizId}_attempt_${attemptId}_answers`);
      
      // Navigate to results page
      navigate(`/quiz/${quizId}/result/${attemptId}`, {
        state: { result }
      });
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError('Không thể nộp bài. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="take-quiz-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="take-quiz-error">
        <p>{error}</p>
        <button onClick={() => navigate('/quizzes')} className="back-btn">
          Quay lại
        </button>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="take-quiz-error">
        <p>Không tìm thấy quiz hoặc câu hỏi.</p>
        <button onClick={() => navigate('/quizzes')} className="back-btn">
          Quay lại
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id];

  return (
    <div className="take-quiz-container">
      {/* Header */}
      <div className="take-quiz-header">
        <div className="quiz-info">
          <h1>{quiz.title}</h1>
          <p className="quiz-subtitle">
            Câu hỏi {currentQuestionIndex + 1} / {questions.length}
          </p>
        </div>

        <div className="quiz-controls">
          <QuizTimer
            timeRemaining={timeRemaining}
            duration={quiz.duration * 60}
            onTimeExpire={handleSubmitQuiz}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quiz-overall-progress">
        <div
          className="progress-bar-fill"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Navigator */}
      <div className="question-navigator">
        <div className="nav-buttons">
          {questions.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
            const isBookmarked = bookmarkedQuestions.includes(index);
            
            return (
              <button
                key={q.id}
                className={`nav-btn ${index === currentQuestionIndex ? 'active' : ''} ${
                  isAnswered ? 'answered' : ''
                } ${isBookmarked ? 'bookmarked' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
                title={`Câu ${index + 1}${isAnswered ? ' - Đã trả lời' : ''}`}
              >
                {index + 1}
                {isBookmarked && ' 🔖'}
              </button>
            );
          })}
        </div>
        <div className="nav-legend">
          <span className="legend-item">
            <span className="legend-dot answered"></span> Đã trả lời
          </span>
          <span className="legend-item">
            <span className="legend-dot active"></span> Đang xem
          </span>
          <span className="legend-item">
            <span className="legend-dot bookmarked"></span> Đã đánh dấu
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="take-quiz-content">
        <QuizQuestion
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          currentAnswer={currentAnswer}
          onAnswerChange={handleAnswerChange}
          onNavigate={handleNavigate}
          onBookmark={handleBookmark}
          bookmarkedQuestions={bookmarkedQuestions}
          showExplanation={false}
          isReviewMode={false}
        />
      </div>

      {/* Submit Button */}
      <div className="take-quiz-footer">
        <div className="answered-count">
          Đã trả lời: {Object.keys(answers).filter(key => 
            answers[key] !== undefined && answers[key] !== ''
          ).length} / {questions.length}
        </div>
        <button
          className="submit-quiz-btn"
          onClick={handleSubmitQuiz}
          disabled={!attemptId}
        >
          Nộp bài
        </button>
      </div>

      {/* Save Status Indicator */}
      <SaveStatusIndicator
        status={saveStatus}
        isOnline={isOnline}
        lastSaveTime={lastSaveTime}
      />
    </div>
  );
};

export default TakeQuiz;

