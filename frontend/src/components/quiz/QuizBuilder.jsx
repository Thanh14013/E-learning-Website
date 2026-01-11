import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import styles from './QuizBuilder.module.css';

/**
 * Quiz Builder Component
 * Allows teachers to create and edit quizzes with questions
 * Supports: Multiple Choice, True/False, Essay, Fill-in-the-Blank
 */
export default function QuizBuilder({ courseId, quizId = null, lessonId = null, onClose }) {


    // Quiz metadata
    const [quizData, setQuizData] = useState({
        title: '',
        courseId: courseId || '',
        lessonId: lessonId || '',
        duration: 30,
        passingScore: 70,
        attemptsAllowed: 3,
        isPublished: false
    });

    // Questions
    const [questions, setQuestions] = useState([]);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // navigation helper from react-router
    const navigate = useNavigate();

    // Load existing quiz if editing
    useEffect(() => {
        if (quizId) {
            loadQuiz();
        }
    }, [quizId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/teacher/quizzes/${quizId}`);
            const quiz = response.data.data.quiz;

            setQuizData({
                title: quiz.title,
                courseId: quiz.courseId._id || quiz.courseId,
                lessonId: quiz.lessonId?._id || quiz.lessonId || '',
                duration: quiz.duration,
                passingScore: quiz.passingScore,
                attemptsAllowed: quiz.attemptsAllowed,
                isPublished: quiz.isPublished
            });

            setQuestions(response.data.data.questions || []);
        } catch (error) {
            console.error('Error loading quiz:', error);
            toastService.error('Unable to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleQuizDataChange = (field, value) => {
        setQuizData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveQuiz = async () => {
        // Validation
        if (!quizData.title.trim()) {
            toastService.error('Please enter quiz title');
            return;
        }

        if (questions.length === 0) {
            toastService.error('Please add at least 1 question');
            return;
        }

        try {
            setSaving(true);

            if (quizId) {
                // Update existing quiz
                await api.put(`/teacher/quizzes/${quizId}`, quizData);
                toastService.success('Quiz updated successfully');
            } else {
                // Create new quiz
                const response = await api.post('/teacher/quizzes', quizData);
                const newQuizId = response.data.quiz._id;

                // Create questions for the new quiz
                for (const q of questions) {
                    // Transform frontend data to backend format
                    const backendQuestion = {
                        quizId: newQuizId,
                        type: q.type,
                        questionText: q.question, // Map 'question' to 'questionText'
                        explanation: q.explanation,
                        order: q.order // If we supported manual order in frontend
                    };

                    if (q.type === 'multiple_choice') {
                        backendQuestion.options = q.options;
                        backendQuestion.correctOption = q.options.indexOf(q.correctAnswer);
                    } else if (q.type === 'true_false') {
                        // Ensure boolean
                        backendQuestion.correctBoolean = q.correctAnswer === 'true' || q.correctAnswer === true;
                    } else if (q.type === 'fill_blank') {
                        backendQuestion.correctText = q.correctAnswer;
                    }

                    await api.post(`/teacher/questions/quiz/${newQuizId}`, backendQuestion);
                }

                toastService.success('Quiz created successfully');
            }

            if (onClose) {
                onClose();
            } else {
                navigate('/teacher/courses');
            }
        } catch (error) {
            console.error('Error saving quiz:', error);
            toastService.error('Error saving quiz');
        } finally {
            setSaving(false);
        }
    };

    const handleAddQuestion = () => {
        setEditingQuestion(null);
        setShowQuestionModal(true);
    };

    const handleEditQuestion = (index) => {
        setEditingQuestion({ ...questions[index], index });
        setShowQuestionModal(true);
    };

    const handleDeleteQuestion = (index) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            setQuestions(prev => prev.filter((_, i) => i !== index));
            toastService.success('Question deleted');
        }
    };

    const handleSaveQuestion = (questionData) => {
        if (editingQuestion !== null && editingQuestion.index !== undefined) {
            // Edit existing question
            setQuestions(prev => prev.map((q, i) =>
                i === editingQuestion.index ? questionData : q
            ));
            toastService.success('Question updated');
        } else {
            // Add new question
            setQuestions(prev => [...prev, questionData]);
            toastService.success('Question added');
        }
        setShowQuestionModal(false);
    };

    const handleMoveQuestion = (index, direction) => {
        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= questions.length) return;

        [newQuestions[index], newQuestions[targetIndex]] =
            [newQuestions[targetIndex], newQuestions[index]];

        setQuestions(newQuestions);
    };

    if (loading) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.quizBuilder}>
            <div className={styles.header}>
                <h2>{quizId ? 'Edit Quiz' : 'Create New Quiz'}</h2>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={onClose || (() => navigate(-1))}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveQuiz} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Quiz'}
                    </Button>
                </div>
            </div>

            {/* Quiz Metadata */}
            <div className={styles.section}>
                <h3>Quiz Information</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Quiz Title *</label>
                        <Input
                            value={quizData.title}
                            onChange={(e) => handleQuizDataChange('title', e.target.value)}
                            placeholder="Enter quiz title"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Duration (minutes)</label>
                        <Input
                            type="number"
                            min="1"
                            max="600"
                            value={quizData.duration}
                            onChange={(e) => handleQuizDataChange('duration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Passing Score (%)</label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={quizData.passingScore}
                            onChange={(e) => handleQuizDataChange('passingScore', parseInt(e.target.value))}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Attempts Allowed</label>
                        <Input
                            type="number"
                            min="1"
                            max="10"
                            value={quizData.attemptsAllowed}
                            onChange={(e) => handleQuizDataChange('attemptsAllowed', parseInt(e.target.value))}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={quizData.isPublished}
                                onChange={(e) => handleQuizDataChange('isPublished', e.target.checked)}
                            />
                            <span>Make quiz public</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3>Questions ({questions.length})</h3>
                    <Button onClick={handleAddQuestion}>+ Add question</Button>
                </div>

                {questions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No questions yet. Add your first question!</p>
                    </div>
                ) : (
                    <div className={styles.questionsList}>
                        {questions.map((question, index) => (
                            <div key={index} className={styles.questionItem}>
                                <div className={styles.questionNumber}>Q{index + 1}</div>
                                <div className={styles.questionContent}>
                                    <h4>{question.question}</h4>
                                    <span className={styles.questionType}>{getQuestionTypeLabel(question.type)}</span>
                                    <span className={styles.questionPoints}>{question.points || 1} pts</span>
                                </div>
                                <div className={styles.questionActions}>
                                    <button onClick={() => handleMoveQuestion(index, 'up')} disabled={index === 0}>
                                        ↑
                                    </button>
                                    <button onClick={() => handleMoveQuestion(index, 'down')} disabled={index === questions.length - 1}>
                                        ↓
                                    </button>
                                    <button onClick={() => handleEditQuestion(index)}>✏️</button>
                                    <button onClick={() => handleDeleteQuestion(index)} className={styles.deleteBtn}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Question Modal */}
            {showQuestionModal && (
                <QuestionModal
                    question={editingQuestion}
                    onSave={handleSaveQuestion}
                    onClose={() => setShowQuestionModal(false)}
                />
            )}
        </div>
    );
}

// Question Modal Component
function QuestionModal({ question, onSave, onClose }) {
    const [questionData, setQuestionData] = useState(
        question || {
            type: 'multiple_choice',
            question: '',
            points: 1,
            options: ['', '', '', ''],
            correctAnswer: '',
            explanation: ''
        }
    );

    const handleChange = (field, value) => {
        setQuestionData(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...questionData.options];
        newOptions[index] = value;
        setQuestionData(prev => ({ ...prev, options: newOptions }));
    };

    const handleAddOption = () => {
        setQuestionData(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const handleRemoveOption = (index) => {
        setQuestionData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = () => {
        if (!questionData.question.trim()) {
            toastService.error('Please enter a question');
            return;
        }

        if (questionData.type === 'multiple_choice') {
            if (questionData.options.some(opt => !opt.trim())) {
                toastService.error('Please fill in all options');
                return;
            }
            if (!questionData.correctAnswer) {
                toastService.error('Please select the correct answer');
                return;
            }
        }

        onSave(questionData);
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className={styles.questionModal}>
                <h3>{question ? 'Edit Question' : 'Add New Question'}</h3>

                <div className={styles.formGroup}>
                    <label>Question Type</label>
                    <select
                        value={questionData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className={styles.select}
                    >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                        <option value="essay">Essay</option>
                        <option value="fill_blank">Fill in the blank</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Question *</label>
                    <textarea
                        value={questionData.question}
                        onChange={(e) => handleChange('question', e.target.value)}
                        placeholder="Enter the question..."
                        rows="3"
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Điểm</label>
                    <Input
                        type="number"
                        min="1"
                        max="100"
                        value={questionData.points}
                        onChange={(e) => handleChange('points', parseInt(e.target.value))}
                    />
                </div>

                {/* Multiple Choice Options */}
                {questionData.type === 'multiple_choice' && (
                    <div className={styles.formGroup}>
                        <label>Options</label>
                        {questionData.options.map((option, index) => (
                            <div key={index} className={styles.optionRow}>
                                <input
                                    type="radio"
                                    name="correctAnswer"
                                    checked={questionData.correctAnswer === option}
                                    onChange={() => handleChange('correctAnswer', option)}
                                />
                                <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                />
                                {questionData.options.length > 2 && (
                                    <button onClick={() => handleRemoveOption(index)} className={styles.removeBtn}>
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button variant="secondary" onClick={handleAddOption} size="small">
                            + Add option
                        </Button>
                    </div>
                )}

                {/* True/False */}
                {questionData.type === 'true_false' && (
                    <div className={styles.formGroup}>
                        <label>Đáp án đúng</label>
                        <select
                            value={questionData.correctAnswer}
                            onChange={(e) => handleChange('correctAnswer', e.target.value)}
                            className={styles.select}
                        >
                            <option value="">-- Select --</option>
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    </div>
                )}

                {/* Fill in the blank */}
                {questionData.type === 'fill_blank' && (
                    <div className={styles.formGroup}>
                        <label>Đáp án đúng</label>
                        <Input
                            value={questionData.correctAnswer}
                            onChange={(e) => handleChange('correctAnswer', e.target.value)}
                            placeholder="Enter correct answer..."
                        />
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label>Explanation (optional)</label>
                    <textarea
                        value={questionData.explanation}
                        onChange={(e) => handleChange('explanation', e.target.value)}
                        placeholder="Giải thích đáp án..."
                        rows="2"
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save</Button>
                </div>
            </div>
        </Modal>
    );
}

function getQuestionTypeLabel(type) {
    const labels = {
        multiple_choice: 'Multiple Choice',
        true_false: 'True/False',
        essay: 'Essay',
        fill_blank: 'Fill in the blank'
    };
    return labels[type] || type;
}
