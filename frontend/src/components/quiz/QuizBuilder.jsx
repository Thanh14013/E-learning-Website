import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
export default function QuizBuilder({ courseId, quizId = null, onClose }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Quiz metadata
    const [quizData, setQuizData] = useState({
        title: '',
        courseId: courseId || '',
        lessonId: '',
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

    // Load existing quiz if editing
    useEffect(() => {
        if (quizId) {
            loadQuiz();
        }
    }, [quizId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/quizzes/${quizId}`);
            const quiz = response.data.quiz;

            setQuizData({
                title: quiz.title,
                courseId: quiz.courseId._id || quiz.courseId,
                lessonId: quiz.lessonId?._id || quiz.lessonId || '',
                duration: quiz.duration,
                passingScore: quiz.passingScore,
                attemptsAllowed: quiz.attemptsAllowed,
                isPublished: quiz.isPublished
            });

            setQuestions(quiz.questions || []);
        } catch (error) {
            console.error('Error loading quiz:', error);
            toastService.error('Không thể tải quiz');
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
            toastService.error('Vui lòng nhập tiêu đề quiz');
            return;
        }

        if (questions.length === 0) {
            toastService.error('Vui lòng thêm ít nhất 1 câu hỏi');
            return;
        }

        try {
            setSaving(true);

            if (quizId) {
                // Update existing quiz
                await api.put(`/quizzes/${quizId}`, quizData);
                toastService.success('Đã cập nhật quiz thành công');
            } else {
                // Create new quiz
                const response = await api.post('/quizzes', quizData);
                const newQuizId = response.data.quiz._id;

                // Create questions for the new quiz
                for (const question of questions) {
                    await api.post(`/questions/quiz/${newQuizId}`, question);
                }

                toastService.success('Đã tạo quiz thành công');
            }

            if (onClose) {
                onClose();
            } else {
                navigate('/teacher/courses');
            }
        } catch (error) {
            console.error('Error saving quiz:', error);
            toastService.error('Lỗi khi lưu quiz');
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
        if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
            setQuestions(prev => prev.filter((_, i) => i !== index));
            toastService.success('Đã xóa câu hỏi');
        }
    };

    const handleSaveQuestion = (questionData) => {
        if (editingQuestion !== null && editingQuestion.index !== undefined) {
            // Edit existing question
            setQuestions(prev => prev.map((q, i) =>
                i === editingQuestion.index ? questionData : q
            ));
            toastService.success('Đã cập nhật câu hỏi');
        } else {
            // Add new question
            setQuestions(prev => [...prev, questionData]);
            toastService.success('Đã thêm câu hỏi');
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
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.quizBuilder}>
            <div className={styles.header}>
                <h2>{quizId ? 'Chỉnh sửa Quiz' : 'Tạo Quiz mới'}</h2>
                <div className={styles.headerActions}>
                    <Button variant="secondary" onClick={onClose || (() => navigate(-1))}>
                        Hủy
                    </Button>
                    <Button onClick={handleSaveQuiz} disabled={saving}>
                        {saving ? 'Đang lưu...' : 'Lưu Quiz'}
                    </Button>
                </div>
            </div>

            {/* Quiz Metadata */}
            <div className={styles.section}>
                <h3>Thông tin Quiz</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Tiêu đề Quiz *</label>
                        <Input
                            value={quizData.title}
                            onChange={(e) => handleQuizDataChange('title', e.target.value)}
                            placeholder="Nhập tiêu đề quiz"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Thời gian (phút)</label>
                        <Input
                            type="number"
                            min="1"
                            max="600"
                            value={quizData.duration}
                            onChange={(e) => handleQuizDataChange('duration', parseInt(e.target.value))}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Điểm đạt (%)</label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={quizData.passingScore}
                            onChange={(e) => handleQuizDataChange('passingScore', parseInt(e.target.value))}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Số lần làm bài</label>
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
                            <span>Công khai quiz</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3>Câu hỏi ({questions.length})</h3>
                    <Button onClick={handleAddQuestion}>+ Thêm câu hỏi</Button>
                </div>

                {questions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên!</p>
                    </div>
                ) : (
                    <div className={styles.questionsList}>
                        {questions.map((question, index) => (
                            <div key={index} className={styles.questionItem}>
                                <div className={styles.questionNumber}>Q{index + 1}</div>
                                <div className={styles.questionContent}>
                                    <h4>{question.question}</h4>
                                    <span className={styles.questionType}>{getQuestionTypeLabel(question.type)}</span>
                                    <span className={styles.questionPoints}>{question.points || 1} điểm</span>
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
            toastService.error('Vui lòng nhập câu hỏi');
            return;
        }

        if (questionData.type === 'multiple_choice') {
            if (questionData.options.some(opt => !opt.trim())) {
                toastService.error('Vui lòng điền đầy đủ các đáp án');
                return;
            }
            if (!questionData.correctAnswer) {
                toastService.error('Vui lòng chọn đáp án đúng');
                return;
            }
        }

        onSave(questionData);
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className={styles.questionModal}>
                <h3>{question ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}</h3>

                <div className={styles.formGroup}>
                    <label>Loại câu hỏi</label>
                    <select
                        value={questionData.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className={styles.select}
                    >
                        <option value="multiple_choice">Trắc nghiệm</option>
                        <option value="true_false">Đúng/Sai</option>
                        <option value="essay">Tự luận</option>
                        <option value="fill_blank">Điền vào chỗ trống</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Câu hỏi *</label>
                    <textarea
                        value={questionData.question}
                        onChange={(e) => handleChange('question', e.target.value)}
                        placeholder="Nhập câu hỏi..."
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
                        <label>Đáp án</label>
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
                                    placeholder={`Đáp án ${index + 1}`}
                                />
                                {questionData.options.length > 2 && (
                                    <button onClick={() => handleRemoveOption(index)} className={styles.removeBtn}>
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button variant="secondary" onClick={handleAddOption} size="small">
                            + Thêm đáp án
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
                            <option value="">-- Chọn --</option>
                            <option value="true">Đúng</option>
                            <option value="false">Sai</option>
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
                            placeholder="Nhập đáp án đúng..."
                        />
                    </div>
                )}

                <div className={styles.formGroup}>
                    <label>Giải thích (tùy chọn)</label>
                    <textarea
                        value={questionData.explanation}
                        onChange={(e) => handleChange('explanation', e.target.value)}
                        placeholder="Giải thích đáp án..."
                        rows="2"
                        className={styles.textarea}
                    />
                </div>

                <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSubmit}>Lưu</Button>
                </div>
            </div>
        </Modal>
    );
}

function getQuestionTypeLabel(type) {
    const labels = {
        multiple_choice: 'Trắc nghiệm',
        true_false: 'Đúng/Sai',
        essay: 'Tự luận',
        fill_blank: 'Điền chỗ trống'
    };
    return labels[type] || type;
}
