import React, { useState } from 'react';
import QuizQuestion from '../../components/quizz/QuizQuestion';
import './QuizQuestionDemo.css';

const QuizQuestionDemo = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);

  // Sample questions with all types
  const questions = [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What is the capital of France?',
      options: [
        { id: 'a', text: 'London', isCorrect: false },
        { id: 'b', text: 'Paris', isCorrect: true },
        { id: 'c', text: 'Berlin', isCorrect: false },
        { id: 'd', text: 'Madrid', isCorrect: false }
      ],
      points: 1,
      explanation: 'Paris is the capital and largest city of France.'
    },
    {
      id: 2,
      type: 'true_false',
      question: 'React is a JavaScript library for building user interfaces.',
      correctAnswer: 'true',
      points: 1,
      explanation: 'React is indeed a JavaScript library developed by Facebook for building user interfaces, particularly web applications.'
    },
    {
      id: 3,
      type: 'essay',
      question: 'Explain the concept of React hooks and provide examples of commonly used hooks.',
      points: 5,
      explanation: 'React hooks are functions that let you use state and other React features in functional components. Examples include useState, useEffect, useContext, etc.'
    },
    {
      id: 4,
      type: 'fill_blank',
      question: 'Fill in the blanks to complete the sentence.',
      text: 'React is a _ library for building _ interfaces.',
      blanks: ['JavaScript', 'user'],
      correctAnswers: ['JavaScript', 'user'],
      points: 2,
      explanation: 'React is a JavaScript library for building user interfaces.'
    },
    {
      id: 5,
      type: 'multiple_choice',
      question: 'Which of the following is NOT a JavaScript framework?',
      options: [
        { id: 'a', text: 'React', isCorrect: false },
        { id: 'b', text: 'Vue', isCorrect: false },
        { id: 'c', text: 'Angular', isCorrect: false },
        { id: 'd', text: 'Python', isCorrect: true }
      ],
      points: 1,
      explanation: 'Python is a programming language, not a JavaScript framework.'
    }
  ];

  const handleAnswerChange = (answer) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: answer
    });
  };

  const handleNavigate = (direction) => {
    if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === 'previous' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleBookmark = (questionIndex) => {
    setBookmarkedQuestions(prev => {
      if (prev.includes(questionIndex)) {
        return prev.filter(idx => idx !== questionIndex);
      } else {
        return [...prev, questionIndex];
      }
    });
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="quiz-question-demo">
      <div className="demo-header">
        <h1>Quiz Question Component Demo</h1>
        <p>This demo showcases all question types supported by the QuizQuestion component:</p>
        <ul className="feature-list">
          <li>✅ Multiple Choice Questions</li>
          <li>✅ True/False Questions</li>
          <li>✅ Essay Questions (Textarea)</li>
          <li>✅ Fill-in-the-Blank Questions</li>
          <li>✅ Question Navigation (Previous/Next)</li>
          <li>✅ Progress Indicator</li>
          <li>✅ Bookmark Feature</li>
        </ul>
      </div>

      <div className="demo-content">
        <QuizQuestion
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          currentAnswer={answers[currentQuestionIndex]}
          onAnswerChange={handleAnswerChange}
          onNavigate={handleNavigate}
          onBookmark={handleBookmark}
          bookmarkedQuestions={bookmarkedQuestions}
          showExplanation={false}
          isReviewMode={false}
        />

        <div className="demo-info">
          <h3>Question Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Type:</strong> {currentQuestion.type.replace('_', ' ').toUpperCase()}
            </div>
            <div className="info-item">
              <strong>Points:</strong> {currentQuestion.points}
            </div>
            <div className="info-item">
              <strong>Bookmarked:</strong> {bookmarkedQuestions.includes(currentQuestionIndex) ? 'Yes' : 'No'}
            </div>
            <div className="info-item">
              <strong>Answered:</strong> {answers[currentQuestionIndex] ? 'Yes' : 'No'}
            </div>
          </div>

          {answers[currentQuestionIndex] && (
            <div className="answer-preview">
              <strong>Your Answer:</strong>
              <pre>{JSON.stringify(answers[currentQuestionIndex], null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="question-navigator">
          <h3>Question Navigator</h3>
          <div className="nav-buttons">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={`nav-btn ${index === currentQuestionIndex ? 'active' : ''
                  } ${answers[index] ? 'answered' : ''
                  } ${bookmarkedQuestions.includes(index) ? 'bookmarked' : ''
                  }`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
                {bookmarkedQuestions.includes(index) && '🔖'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestionDemo;

