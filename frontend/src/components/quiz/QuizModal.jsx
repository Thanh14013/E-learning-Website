import React, { useState, useEffect, useRef } from 'react';
import styles from './QuizModal.module.css';

const QuizModal = ({ quiz, attemptsLeft, onStart, onSubmit, onClose, isReviewMode = false, userAnswers = {} }) => {
    // If review mode, default to 'review' view directly
    const [step, setStep] = useState(isReviewMode ? 'review' : 'confirm');
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState(isReviewMode ? userAnswers : {});
    const timerRef = useRef(null);

    useEffect(() => {
        if (quiz?.timeLimit) {
            setTimeLeft(quiz.timeLimit * 60); // minutes to seconds
        }
        return () => clearInterval(timerRef.current);
    }, [quiz]);

    useEffect(() => {
        if (isReviewMode) {
            setStep('review');
            setAnswers(userAnswers);
        }
    }, [isReviewMode, userAnswers]);

    useEffect(() => {
        if (step === 'taking' && timeLeft > 0 && !isReviewMode) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (step === 'taking' && timeLeft === 0 && quiz.timeLimit && !isReviewMode) {
            handleSubmit();
        }
        return () => clearInterval(timerRef.current);
    }, [step, timeLeft, quiz, isReviewMode]);

    const handleStart = () => {
        if (attemptsLeft <= 0 && !isReviewMode) return;
        setStep('taking');
        onStart?.();
    };

    const handleAnswerChange = (questionId, optionIndex) => {
        if (isReviewMode) return;
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleSubmit = () => {
        clearInterval(timerRef.current);
        onSubmit?.(answers);
        onClose();
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!quiz) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{quiz.title} {isReviewMode ? '(Review)' : ''}</h2>
                    {step === 'taking' && quiz.timeLimit > 0 && !isReviewMode && (
                        <div className={`${styles.timer} ${timeLeft < 60 ? styles.timerLow : ''}`}>
                            Time Left: {formatTime(timeLeft)}
                        </div>
                    )}
                    <button className={styles.closeBtn} onClick={onClose} disabled={step === 'taking' && timeLeft > 0}>&times;</button>
                </div>

                <div className={styles.content}>
                    {step === 'confirm' && !isReviewMode && (
                        <div className={styles.confirmState}>
                            <p>Are you sure you want to start this quiz?</p>
                            <div className={styles.stats}>
                                <div className={styles.statItem}>
                                    <span>Questions</span>
                                    <strong>{quiz.questions?.length || 0}</strong>
                                </div>
                                <div className={styles.statItem}>
                                    <span>Time Limit</span>
                                    <strong>{quiz.timeLimit ? `${quiz.timeLimit} mins` : 'No Limit'}</strong>
                                </div>
                                <div className={styles.statItem}>
                                    <span>Attempts Left</span>
                                    <strong className={attemptsLeft > 0 ? styles.positive : styles.negative}>
                                        {attemptsLeft}
                                    </strong>
                                </div>
                            </div>

                            {attemptsLeft > 0 ? (
                                <button className={styles.startBtn} onClick={handleStart}>
                                    Start Quiz
                                </button>
                            ) : (
                                <div className={styles.noAttempts}>
                                    You have used all your attempts for this quiz.
                                </div>
                            )}
                        </div>
                    )}

                    {(step === 'taking' || step === 'review') && (
                        <div className={styles.takingState}>
                            {quiz.questions?.map((q, index) => {
                                const options = (q.options && q.options.length > 0)
                                    ? q.options
                                    : (q.type === 'true_false' ? ['True', 'False'] : []);

                                // Determine styles for Review Mode
                                const correctIndex = q.type === 'true_false'
                                    ? (q.correctBoolean ? 0 : 1) // 0=True, 1=False logic 
                                    : q.correctOption;

                                return (
                                    <div key={q._id || index} className={styles.questionBlock}>
                                        <div className={styles.questionText}>
                                            <span className={styles.qIndex}>{index + 1}.</span> {q.question}
                                        </div>
                                        <div className={styles.options}>
                                            {options.map((opt, optIdx) => {
                                                const isSelected = answers[q._id] === optIdx;
                                                // In review mode: highlight correct green, wrong red
                                                const isCorrect = isReviewMode && optIdx === correctIndex;
                                                const isWrong = isReviewMode && isSelected && !isCorrect;

                                                let labelClass = styles.optionLabel;
                                                if (isReviewMode) {
                                                    labelClass += ` ${styles.readOnlyOption}`;
                                                    if (isCorrect) labelClass += ` ${styles.correctOption}`;
                                                    if (isWrong) labelClass += ` ${styles.wrongOption}`;
                                                }

                                                return (
                                                    <label key={optIdx} className={labelClass}>
                                                        <input
                                                            type="radio"
                                                            name={`q-${q._id || index}`}
                                                            value={optIdx}
                                                            checked={isSelected}
                                                            onChange={() => handleAnswerChange(q._id, optIdx)}
                                                            disabled={isReviewMode}
                                                        />
                                                        <span className={styles.optionText}>{opt}</span>
                                                        {isCorrect && <span className={styles.iconCheck}>✓</span>}
                                                        {isWrong && <span className={styles.iconCross}>✗</span>}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {isReviewMode && q.explanation && (
                                            <div className={`${styles.explanation} ${styles.show}`}>
                                                <strong>Teacher's Explanation:</strong> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {step === 'taking' && !isReviewMode && (
                    <div className={styles.footer}>
                        <button className={styles.submitBtn} onClick={handleSubmit}>
                            Submit Quiz
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizModal;
