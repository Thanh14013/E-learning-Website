import React from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import QuizzList from '../../components/quizz/QuizzList';
import './QuizDemo.css';

const QuizDemo = () => {
  return (
    <AuthProvider>
      <div className="quiz-demo-page">
        <div className="demo-header">
          <h1>Quiz List Demo</h1>
          <p>This page demonstrates the Quiz List functionality with all required features:</p>
          <ul className="feature-list">
            <li>✅ Display all quizzes for course</li>
            <li>✅ Show quiz metadata (title, duration, passing score)</li>
            <li>✅ Show user attempts + scores</li>
            <li>✅ Show quiz status (not started, in progress, completed)</li>
            <li>✅ Add start/continue button</li>
            <li>✅ Show best score</li>
            <li>✅ Add quiz details link</li>
          </ul>
        </div>

        <QuizzList courseId="demo-course-123" />
      </div>
    </AuthProvider>
  );
};

export default QuizDemo;