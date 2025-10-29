import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import './QuizQuestion.css';

const QuizQuestion = ({
  question,
  questionIndex,
  totalQuestions,
  currentAnswer,
  onAnswerChange,
  onNavigate,
  onBookmark,
  bookmarkedQuestions = [],
  showExplanation = false,
  isReviewMode = false
}) => {
  // Initialize state based on question type
  const getInitialAnswer = () => {
    if (currentAnswer !== undefined) {
      if (question.type === 'essay') {
        return typeof currentAnswer === 'string' ? currentAnswer : '';
      } else if (question.type === 'fill_blank') {
        return Array.isArray(currentAnswer) ? currentAnswer : (question.blanks?.map(() => '') || []);
      } else {
        return currentAnswer || '';
      }
    }
    
    // Default initialization
    if (question.type === 'fill_blank') {
      return question.blanks?.map(() => '') || [];
    }
    return '';
  };

  const [selectedAnswer, setSelectedAnswer] = useState(
    question.type !== 'essay' && question.type !== 'fill_blank' ? getInitialAnswer() : ''
  );
  const [essayAnswer, setEssayAnswer] = useState(
    question.type === 'essay' ? getInitialAnswer() : ''
  );
  const [fillBlankAnswers, setFillBlankAnswers] = useState(
    question.type === 'fill_blank' ? getInitialAnswer() : []
  );

  useEffect(() => {
    // Initialize answers based on currentAnswer prop and question type
    if (currentAnswer !== undefined) {
      if (question.type === 'essay') {
        setEssayAnswer(typeof currentAnswer === 'string' ? currentAnswer : '');
      } else if (question.type === 'fill_blank') {
        setFillBlankAnswers(Array.isArray(currentAnswer) ? currentAnswer : (question.blanks?.map(() => '') || []));
      } else {
        setSelectedAnswer(currentAnswer || '');
      }
    } else {
      // Reset when question changes or answer is cleared
      if (question.type === 'essay') {
        setEssayAnswer('');
      } else if (question.type === 'fill_blank') {
        setFillBlankAnswers(question.blanks?.map(() => '') || []);
      } else {
        setSelectedAnswer('');
      }
    }
  }, [currentAnswer, question.type, question.id]);

  const isBookmarked = bookmarkedQuestions.includes(questionIndex);

  const handleAnswerChange = (value) => {
    setSelectedAnswer(value);
    onAnswerChange(value);
  };

  const handleEssayChange = (value) => {
    setEssayAnswer(value);
    onAnswerChange(value);
  };

  const handleFillBlankChange = (index, value) => {
    const newAnswers = [...fillBlankAnswers];
    newAnswers[index] = value;
    setFillBlankAnswers(newAnswers);
    onAnswerChange(newAnswers);
  };

  const handlePrevious = () => {
    if (onNavigate) {
      onNavigate('previous');
    }
  };

  const handleNext = () => {
    if (onNavigate) {
      onNavigate('next');
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark(questionIndex);
    }
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="quiz-question-options">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className={`quiz-option-label ${
                  selectedAnswer === option.id || selectedAnswer === index.toString()
                    ? 'selected'
                    : ''
                } ${
                  isReviewMode && option.isCorrect
                    ? 'correct'
                    : ''
                } ${
                  isReviewMode && 
                  (selectedAnswer === option.id || selectedAnswer === index.toString()) &&
                  !option.isCorrect
                    ? 'incorrect'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  value={option.id || index.toString()}
                  checked={
                    selectedAnswer === option.id || selectedAnswer === index.toString()
                  }
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={isReviewMode}
                  className="quiz-option-input"
                />
                <span className="quiz-option-text">{option.text}</span>
                {isReviewMode && option.isCorrect && (
                  <span className="correct-indicator">✓ Correct</span>
                )}
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="quiz-question-options quiz-true-false">
            {[
              { value: 'true', label: 'True' },
              { value: 'false', label: 'False' }
            ].map((option) => (
              <label
                key={option.value}
                className={`quiz-option-label quiz-tf-option ${
                  selectedAnswer === option.value ? 'selected' : ''
                } ${
                  isReviewMode && question.correctAnswer === option.value
                    ? 'correct'
                    : ''
                } ${
                  isReviewMode &&
                  selectedAnswer === option.value &&
                  question.correctAnswer !== option.value
                    ? 'incorrect'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  value={option.value}
                  checked={selectedAnswer === option.value}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  disabled={isReviewMode}
                  className="quiz-option-input"
                />
                <span className="quiz-option-text">{option.label}</span>
                {isReviewMode && question.correctAnswer === option.value && (
                  <span className="correct-indicator">✓ Correct</span>
                )}
              </label>
            ))}
          </div>
        );

      case 'essay':
        return (
          <div className="quiz-question-essay">
            <textarea
              value={essayAnswer}
              onChange={(e) => handleEssayChange(e.target.value)}
              placeholder="Type your answer here..."
              className="quiz-essay-textarea"
              disabled={isReviewMode}
              rows={8}
            />
            {isReviewMode && question.explanation && (
              <div className="quiz-explanation">
                <strong>Expected Answer:</strong>
                <p>{question.explanation}</p>
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="quiz-question-fill-blank">
            <div className="fill-blank-instructions">
              <p>Fill in the blanks with the correct answers:</p>
            </div>
            {question.blanks?.map((blank, index) => (
              <div key={index} className="fill-blank-item">
                <label className="fill-blank-label">
                  Blank {index + 1}:
                </label>
                <input
                  type="text"
                  value={fillBlankAnswers[index] || ''}
                  onChange={(e) => handleFillBlankChange(index, e.target.value)}
                  placeholder="Enter your answer"
                  className="fill-blank-input"
                  disabled={isReviewMode}
                />
                {isReviewMode && question.correctAnswers?.[index] && (
                  <div className="fill-blank-review">
                    <span className={`review-result ${
                      (fillBlankAnswers[index] || '').toLowerCase().trim() ===
                      question.correctAnswers[index].toLowerCase().trim()
                        ? 'correct'
                        : 'incorrect'
                    }`}>
                      {fillBlankAnswers[index] ? (
                        <>
                          Your answer: "{fillBlankAnswers[index]}"
                          <br />
                          Correct answer: "{question.correctAnswers[index]}"
                        </>
                      ) : (
                        <>Correct answer: "{question.correctAnswers[index]}"</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return <div className="quiz-question-unknown">Unknown question type</div>;
    }
  };

  return (
    <div className="quiz-question-container">
      {/* Question Header */}
      <div className="quiz-question-header">
        <div className="quiz-question-meta">
          <span className="quiz-question-number">
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          {question.points && (
            <span className="quiz-question-points">
              {question.points} {question.points === 1 ? 'point' : 'points'}
            </span>
          )}
        </div>
        <div className="quiz-question-actions">
          {onBookmark && (
            <button
              onClick={handleBookmark}
              className={`quiz-bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
            >
              {isBookmarked ? '🔖' : '🔖'}
              <span className="bookmark-text">
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quiz-question-progress">
        <div
          className="quiz-progress-bar"
          style={{
            width: `${((questionIndex + 1) / totalQuestions) * 100}%`
          }}
        />
      </div>

      {/* Question Content */}
      <div className="quiz-question-content">
        <h3 className="quiz-question-title">{question.question}</h3>
        
        {question.type === 'fill_blank' && question.text && (
          <div className="fill-blank-text">
            {question.text.split(/_+/).map((part, index, array) => (
              <React.Fragment key={index}>
                {part}
                {index < array.length - 1 && (
                  <span className="blank-placeholder">
                    {index + 1}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {renderQuestionContent()}

        {/* Explanation (in review mode) */}
        {isReviewMode && question.explanation && question.type !== 'essay' && (
          <div className="quiz-explanation">
            <strong>Explanation:</strong>
            <p>{question.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="quiz-question-navigation">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={questionIndex === 0}
          className="quiz-nav-btn"
        >
          ← Previous
        </Button>

        <div className="quiz-navigation-info">
          <span className="quiz-progress-text">
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>

        <Button
          variant="primary"
          onClick={handleNext}
          disabled={questionIndex === totalQuestions - 1}
          className="quiz-nav-btn"
        >
          Next →
        </Button>
      </div>

      {/* Answer Status (for review mode) */}
      {isReviewMode && (
        <div className={`quiz-answer-status ${
          question.userAnswer === question.correctAnswer ||
          (Array.isArray(question.userAnswer) &&
           Array.isArray(question.correctAnswer) &&
           JSON.stringify(question.userAnswer) === JSON.stringify(question.correctAnswer))
            ? 'correct'
            : 'incorrect'
        }`}>
          {question.userAnswer === question.correctAnswer ||
          (Array.isArray(question.userAnswer) &&
           Array.isArray(question.correctAnswer) &&
           JSON.stringify(question.userAnswer) === JSON.stringify(question.correctAnswer))
            ? '✓ Correct Answer'
            : '✗ Incorrect Answer'}
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;

