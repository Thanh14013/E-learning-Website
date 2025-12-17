import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from '../../services/toastService';
import styles from './LessonDetail.module.css';

const LessonDetail = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lesson, setLesson] = useState(null);
    const [course, setCourse] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [allLessons, setAllLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState([]);
    const [expandedQuizId, setExpandedQuizId] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState({});
    const [userAnswers, setUserAnswers] = useState({});
    const [quizScores, setQuizScores] = useState({});
    const [submittedQuizzes, setSubmittedQuizzes] = useState(new Set());
    const [completedQuizzes, setCompletedQuizzes] = useState(new Set());
    const [quizAttempts, setQuizAttempts] = useState({});
    const [activeAttemptIds, setActiveAttemptIds] = useState({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [courseProgress, setCourseProgress] = useState({ completedCount: 0, totalLessons: 0 });

    useEffect(() => {
        const fetchLessonData = async () => {
            setLoading(true);
            try {
                // Fetch lesson detail
                const lessonRes = await api.get(`/lessons/${lessonId}`);
                const lessonData = lessonRes.data.data;
                setLesson(lessonData);

                // Fetch course detail to get all chapters and lessons
                const courseRes = await api.get(`/courses/${courseId}`);
                const courseData = courseRes.data.data;
                setCourse(courseData);

                // Find current chapter
                const currentChapter = courseData.chapters?.find(ch =>
                    ch._id === lessonData.chapterId
                );
                setChapter(currentChapter);

                // Get all lessons from all chapters for navigation
                const allLessonsArray = [];
                courseData.chapters?.forEach(ch => {
                    ch.lessons?.forEach(l => {
                        allLessonsArray.push({ ...l, chapterId: ch._id, chapterTitle: ch.title });
                    });
                });
                setAllLessons(allLessonsArray);

                // Fetch quizzes for this lesson
                try {
                    const quizRes = await api.get(`/quizzes/lesson/${lessonId}`);
                    if (quizRes.data.data) {
                        const quizzesData = quizRes.data.data;
                        setQuizzes(quizzesData);
                        
                        // Check which quizzes are already completed
                        const completedSet = new Set();
                        const attemptsMap = {};
                        
                        for (const quiz of quizzesData) {
                            try {
                                const attemptsRes = await api.get(`/quizzes/${quiz._id}/attempts?limit=1`);
                                if (attemptsRes.data.attempts && attemptsRes.data.attempts.length > 0) {
                                    const lastAttempt = attemptsRes.data.attempts[0];
                                    attemptsMap[quiz._id] = lastAttempt;
                                    if (lastAttempt.isPassed) {
                                        completedSet.add(quiz._id);
                                        setQuizScores(prev => ({
                                            ...prev,
                                            [quiz._id]: {
                                                correct: lastAttempt.score,
                                                total: lastAttempt.score + (lastAttempt.percentage > 0 ? Math.round(lastAttempt.score * (100 / lastAttempt.percentage) - lastAttempt.score) : 0),
                                                answered: lastAttempt.score,
                                                percentage: lastAttempt.percentage,
                                                isPassed: lastAttempt.isPassed
                                            }
                                        }));
                                    }
                                }
                            } catch (err) {
                                console.log(`No attempts found for quiz ${quiz._id}`);
                            }
                        }
                        
                        setCompletedQuizzes(completedSet);
                        setQuizAttempts(attemptsMap);
                    }
                } catch (error) {
                    console.error('Failed to fetch quizzes:', error);
                }

                // Check if lesson is completed and get course progress
                try {
                    const progressRes = await api.get(`/progress/lesson/${lessonId}`);
                    setIsCompleted(progressRes.data?.progress?.isCompleted || false);
                    
                    // Fetch course progress to get completed count
                    const courseProgressRes = await api.get(`/progress/course/${courseId}`);
                    console.log('📊 Course Progress Response:', courseProgressRes.data);
                    if (courseProgressRes.data) {
                        setCourseProgress({
                            completedCount: courseProgressRes.data.completedLessons || 0,
                            totalLessons: courseProgressRes.data.totalLessons || 0
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch progress:', error);
                }

            } catch (error) {
                console.error('Failed to fetch lesson data:', error);
                if (error.response?.status === 403) {
                    toast.error('You must enroll in the course to view this lesson');
                    navigate(`/courses/${courseId}`);
                }
            } finally {
                setLoading(false);
            }
        };

        if (courseId && lessonId) {
            fetchLessonData();
        }
    }, [courseId, lessonId, navigate]);

    const handleQuizClick = async (quizId) => {
        if (expandedQuizId === quizId) {
            setExpandedQuizId(null);
            return;
        }

        try {
            // Fetch quiz questions
            const res = await api.get(`/quizzes/${quizId}`);
            const quizData = res.data.data || res.data;
            if (quizData.questions && quizData.questions.length > 0) {
                setQuizQuestions(prev => ({ ...prev, [quizId]: quizData.questions }));
                setExpandedQuizId(quizId);
                
                // Start a new attempt if not already started and not completed
                if (!activeAttemptIds[quizId] && !completedQuizzes.has(quizId)) {
                        try {
                        const attemptRes = await api.post(`/quizzes/${quiz._id}/start`);
                        setActiveAttemptIds(prev => ({
                            ...prev,
                            [quiz._id]: attemptRes.data.attemptId
                        }));
                        console.log('✅ Started quiz attempt:', attemptRes.data.attemptId);
                    } catch (err) {
                        console.error('Failed to start attempt:', err);
                        toast.error(err.response?.data?.message || 'Unable to start quiz');
                    }
                }
                } else {
                toast.error('This quiz has no questions yet');
                }
        } catch (error) {
            console.error('Failed to fetch quiz questions:', error);
            toast.error(error.response?.data?.message || 'Unable to load questions');
        }
    };

    const handleAnswerSelect = (quizId, questionId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [quizId]: {
                ...prev[quizId],
                [questionId]: answer
            }
        }));
    };

    const calculateQuizScore = (quizId, questions) => {
        const answers = userAnswers[quizId] || {};
        let correct = 0;
        let answered = 0;

        questions.forEach(q => {
            const userAnswer = answers[q._id];
            if (userAnswer !== undefined && userAnswer !== null) {
                answered++;
                if (q.type === 'multiple_choice' && userAnswer === q.correctOption) {
                    correct++;
                } else if (q.type === 'true_false' && userAnswer === q.correctBoolean) {
                    correct++;
                }
            }
        });

        const percentage = answered > 0 ? (correct / questions.length) * 100 : 0;
        
        // Don't calculate isPassed here - backend will provide the correct result
        // based on quiz.passingScore

        return percentage;
    };

    const checkQuizCompletion = () => {
        // Nếu không có quiz nào, cho phép hoàn thành
        if (quizzes.length === 0) return { canComplete: true, message: '' };

        // Check whether all quizzes are completed (based on completedQuizzes)
        const incompletedCount = quizzes.length - completedQuizzes.size;
        if (incompletedCount > 0) {
            return {
                canComplete: false,
                message: `You need to complete all ${quizzes.length} quizzes (there are ${incompletedCount} quizzes incomplete or not passed)`
            };
        }

        return { canComplete: true, message: '' };
    };

    const handleMarkComplete = async () => {
        console.log('🔘 Mark Complete clicked');
        console.log('   isCompleted:', isCompleted);
        console.log('   quizzes:', quizzes.length);
        console.log('   quizScores:', quizScores);

        if (isCompleted) {
            toast.info('B\u00e0i h\u1ecdc n\u00e0y \u0111\u00e3 ho\u00e0n th\u00e0nh');
            return;
        }

        const { canComplete, message } = checkQuizCompletion();
        console.log('   canComplete:', canComplete);
        console.log('   message:', message);

        if (!canComplete) {
            toast.error(message);
            return;
        }

        console.log('   Calling API...');
        try {
            const res = await api.post(`/progress/complete/${lessonId}`);
            console.log('✅ Mark Complete Response:', res.data);
            toast.success('🎉 Congratulations! You completed the lesson!');
            
            // Update UI immediately
            setIsCompleted(true);
            
            // Update course progress from response
            if (res.data.completedCount && res.data.totalLessons) {
                console.log('📊 Updating progress:', res.data.completedCount, '/', res.data.totalLessons);
                setCourseProgress({
                    completedCount: res.data.completedCount,
                    totalLessons: res.data.totalLessons
                });
            }
            
            // Refetch course progress to ensure accuracy
            try {
                const courseProgressRes = await api.get(`/progress/course/${courseId}`);
                console.log('🔄 Refetched Progress:', courseProgressRes.data);
                if (courseProgressRes.data) {
                    setCourseProgress({
                        completedCount: courseProgressRes.data.completedLessons || 0,
                        totalLessons: courseProgressRes.data.totalLessons || 0
                    });
                }
            } catch (err) {
                console.log('Failed to refetch progress:', err);
            }

            // Navigate to next lesson if available
            setTimeout(() => {
                const currentIndex = allLessons.findIndex(l => l._id === lessonId);
                if (currentIndex < allLessons.length - 1) {
                    const nextLesson = allLessons[currentIndex + 1];
                    navigate(`/courses/${courseId}/lessons/${nextLesson._id}`);
                }
            }, 1500);
        } catch (error) {
            console.error('Failed to mark complete:', error);
            toast.error(error.response?.data?.message || 'Unable to mark as complete');
        }
    };

    const navigateLesson = (direction) => {
        const currentIndex = allLessons.findIndex(l => l._id === lessonId);
        if (direction === 'prev' && currentIndex > 0) {
            const prevLesson = allLessons[currentIndex - 1];
            navigate(`/courses/${courseId}/lessons/${prevLesson._id}`);
        } else if (direction === 'next' && currentIndex < allLessons.length - 1) {
            const nextLesson = allLessons[currentIndex + 1];
            navigate(`/courses/${courseId}/lessons/${nextLesson._id}`);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading lesson...</p>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className={styles.errorContainer}>
                <h2>You must enroll to view this lesson</h2>
                <Link to={`/courses/${courseId}`} className="btn btn-primary">Back to course</Link>
            </div>
        );
    }

    const currentIndex = allLessons.findIndex(l => l._id === lessonId);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allLessons.length - 1;
    const primaryResource = lesson.resources?.[0];
    const relatedResources = lesson.resources?.slice(1) || [];

    return (
        <div className={styles.lessonPage}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <Link to="/courses">Courses</Link>
                <span>/</span>
                <Link to={`/courses/${courseId}`}>{course?.title}</Link>
                <span>/</span>
                <span>{chapter?.title}</span>
                <span>/</span>
                <span className={styles.current}>{lesson.title}</span>
            </div>

            <div className={styles.lessonContainer}>
                {/* Main Content */}
                <div className={styles.lessonMain}>
                    {/* Video or Media Section */}
                    {lesson.videoUrl && (
                        <div className={styles.videoContainer}>
                            <video
                                controls
                                className={styles.videoPlayer}
                                src={lesson.videoUrl}
                                poster={lesson.thumbnail}
                            >
                                Your browser does not support the video.
                            </video>
                        </div>
                    )}

                    {/* Lesson Info */}
                    <div className={styles.lessonHeader}>
                        <h1>{lesson.title}</h1>
                        {lesson.isPreview && (
                            <span className={styles.previewBadge}>Preview</span>
                        )}
                    </div>

                    {/* Lesson Content */}
                    <div className={styles.lessonContent}>
                        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />

                        {primaryResource && (
                            <div className={styles.overviewResources}>
                                <div className={styles.overviewDownload}>
                                    <div>
                                        <p className={styles.overviewLabel}>Overview Document</p>
                                        <p className={styles.overviewName}>{primaryResource.name}</p>
                                    </div>
                                    <a
                                        href={primaryResource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className={styles.overviewDownloadBtn}
                                    >
                                        ⬇ Download
                                    </a>
                                </div>

                                {relatedResources.length > 0 && (
                                    <div className={styles.relatedLinks}>
                                        <span className={styles.overviewLabel}>Related resources</span>
                                        <div className={styles.linkGrid}>
                                            {relatedResources.map((resource, idx) => (
                                                <a
                                                    key={resource._id || resource.url || idx}
                                                    href={resource.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.linkPill}
                                                >
                                                    {resource.name || resource.url}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resources Section */}
                    {lesson.resources && lesson.resources.length > 0 && (
                        <div className={styles.resourcesSection}>
                            <h3>📚 Learning Resources</h3>
                            <div className={styles.resourcesList}>
                                {lesson.resources.map((resource, index) => (
                                    <div key={index} className={styles.resourceItem}>
                                        <div className={styles.resourceInfo}>
                                            <span className={styles.resourceIcon}>
                                                {resource.type === 'pdf' && '📄'}
                                                {resource.type === 'ppt' && '📊'}
                                                {resource.type === 'doc' && '📝'}
                                                {resource.type === 'image' && '🖼️'}
                                            </span>
                                            <div className={styles.resourceDetails}>
                                                <span className={styles.resourceName}>{resource.name}</span>
                                                <span className={styles.resourceType}>{resource.type.toUpperCase()}</span>
                                            </div>
                                        </div>
                                        <a 
                                            href={resource.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className={`btn btn-sm btn-primary-student ${styles.downloadBtn}`}
                                            download
                                        >
                                            <span>⬇</span> Download
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quiz Section */}
                    {quizzes.length > 0 && (
                        <div className={styles.quizSection}>
                            <h3>📝 Quizzes</h3>
                            {quizzes.map(quiz => (
                                <div key={quiz._id} className={styles.quizCard}>
                                    <div
                                        className={styles.quizHeader}
                                        onClick={() => handleQuizClick(quiz._id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {completedQuizzes.has(quiz._id) && (
                                                <span style={{ color: '#28a745', fontSize: '20px' }}>✓</span>
                                            )}
                                            <h4>{quiz.title}</h4>
                                        </div>
                                        <span className={styles.quizToggle}>
                                            {expandedQuizId === quiz._id ? '▼' : '▶'}
                                        </span>
                                    </div>

                                    {expandedQuizId === quiz._id && quizQuestions[quiz._id] && (
                                        <div className={styles.quizContent}>
                                            {quizQuestions[quiz._id].map((question, idx) => (
                                                <div key={question._id} className={styles.questionCard}>
                                                    <p className={styles.questionText}>
                                                        {idx + 1}. {question.questionText}
                                                    </p>

                                                    {question.type === 'multiple_choice' && question.options && question.options.length > 0 && (
                                                        <div className={styles.optionsList}>
                                                            {question.options.map((option, optIdx) => (
                                                                <label key={optIdx} className={styles.optionLabel}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`question-${question._id}`}
                                                                        checked={userAnswers[quiz._id]?.[question._id] === optIdx}
                                                                        onChange={() => handleAnswerSelect(quiz._id, question._id, optIdx)}
                                                                    />
                                                                    <span>{option}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {question.type === 'true_false' && (
                                                        <div className={styles.optionsList}>
                                                            <label className={styles.optionLabel}>
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${question._id}`}
                                                                    checked={userAnswers[quiz._id]?.[question._id] === true}
                                                                    onChange={() => handleAnswerSelect(quiz._id, question._id, true)}
                                                                />
                                                                <span>True</span>
                                                            </label>
                                                            <label className={styles.optionLabel}>
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${question._id}`}
                                                                    checked={userAnswers[quiz._id]?.[question._id] === false}
                                                                    onChange={() => handleAnswerSelect(quiz._id, question._id, false)}
                                                                />
                                                                <span>False</span>
                                                            </label>
                                                        </div>
                                                    )}

                                                    {question.type === 'fill_blank' && (
                                                        <div className={styles.fillBlankInput}>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter your answer..."
                                                                value={userAnswers[quiz._id]?.[question._id] || ''}
                                                                onChange={(e) => handleAnswerSelect(quiz._id, question._id, e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            <button
                                                className={`btn ${completedQuizzes.has(quiz._id) ? 'btn-success' : 'btn-primary-student'}`}
                                                onClick={async () => {
                                                    const questions = quizQuestions[quiz._id];
                                                    const answers = userAnswers[quiz._id] || {};
                                                    const unansweredCount = questions.filter(q => answers[q._id] === undefined).length;

                                                    if (unansweredCount > 0) {
                                                        toast.warn(`You haven't answered ${unansweredCount} questions!`);
                                                        return;
                                                    }

                                                    const percentage = calculateQuizScore(quiz._id, questions);
                                                    
                                                    // Submit to backend
                                                    try {
                                                        // Use existing attemptId (already started when quiz was expanded)
                                                        const attemptId = activeAttemptIds[quiz._id];
                                                        
                                                        if (!attemptId) {
                                                            toast.error('Please close and reopen the quiz to restart');
                                                            return;
                                                        }
                                                        
                                                        // Prepare answers for backend
                                                        const formattedAnswers = questions.map(q => {
                                                            const userAnswer = answers[q._id];
                                                            const answer = { questionId: q._id };
                                                            
                                                            if (q.type === 'multiple_choice') {
                                                                answer.selectedOption = userAnswer;
                                                            } else if (q.type === 'true_false') {
                                                                answer.selectedBoolean = userAnswer;
                                                            } else if (q.type === 'fill_blank') {
                                                                answer.filledText = userAnswer;
                                                            }
                                                            
                                                            return answer;
                                                        });
                                                        
                                                        // Submit quiz
                                                        const submitRes = await api.post(`/quizzes/${quiz._id}/submit`, {
                                                            attemptId,
                                                            answers: formattedAnswers
                                                        });
                                                        
                                                        const result = submitRes.data;
                                                        
                                                        console.log('📊 Quiz Result:', result);
                                                        
                                                        // Update quiz scores with backend result
                                                        setQuizScores(prev => ({
                                                            ...prev,
                                                            [quiz._id]: {
                                                                correct: result.score,
                                                                total: result.totalQuestions,
                                                                answered: result.totalQuestions,
                                                                percentage: result.percentage,
                                                                isPassed: result.isPassed
                                                            }
                                                        }));
                                                        
                                                        // Mark as submitted
                                                        setSubmittedQuizzes(prev => new Set([...prev, quiz._id]));
                                                        
                                                        // Clear attemptId so a new one can be started if failed
                                                        setActiveAttemptIds(prev => {
                                                            const newAttempts = { ...prev };
                                                            delete newAttempts[quiz._id];
                                                            return newAttempts;
                                                        });
                                                        
                                                        if (result.isPassed) {
                                                            setCompletedQuizzes(prev => new Set([...prev, quiz._id]));
                                                            toast.success(`🎉 Scored ${result.percentage}%! You passed the quiz!`);
                                                        } else {
                                                            // Get quiz details to show correct passing score
                                                            const currentQuiz = quizzes.find(q => q._id === quiz._id);
                                                            const passingScore = currentQuiz?.passingScore || 70;
                                                            toast.error(`❌ Scored ${result.percentage}%. You need at least ${passingScore}% to pass. Close and reopen the quiz to try again.`);
                                                            // Close quiz to allow retry
                                                            setExpandedQuizId(null);
                                                        }
                                                        
                                                        // Auto complete lesson if all quizzes passed
                                                        setTimeout(async () => {
                                                            const { canComplete } = checkQuizCompletion();
                                                            if (canComplete && !isCompleted) {
                                                                try {
                                                                    const res = await api.post(`/progress/complete/${lessonId}`);
                                                                    setIsCompleted(true);
                                                                    toast.success('✅ Tự động hoàn thành bài học!');
                                                                    
                                                                    // Update progress immediately
                                                                    if (res.data.completedCount && res.data.totalLessons) {
                                                                        setCourseProgress({
                                                                            completedCount: res.data.completedCount,
                                                                            totalLessons: res.data.totalLessons
                                                                        });
                                                                    }
                                                                    
                                                                    // Refetch notifications
                                                                    try {
                                                                        await api.get('/notifications?page=1&limit=1');
                                                                    } catch (e) {
                                                                        console.log('Notification refetch failed:', e);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Auto complete failed:', err);
                                                                    toast.error('Unable to mark as complete');
                                                                }
                                                            }
                                                        }, 500);
                                                    } catch (error) {
                                                        console.error('Failed to submit quiz:', error);
                                                        toast.error(error.response?.data?.message || 'Unable to submit quiz');
                                                    }
                                                }}
                                                style={{ marginTop: '16px' }}
                                                disabled={completedQuizzes.has(quiz._id)}
                                            >
                                                {completedQuizzes.has(quiz._id) ? '✅ Completed' : 'Submit'}
                                            </button>

                                            {quizScores[quiz._id] && (
                                                <div className={styles.quizScore} style={{
                                                    marginTop: '12px',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    backgroundColor: quizScores[quiz._id].isPassed ? '#d4edda' : '#f8d7da',
                                                    color: quizScores[quiz._id].isPassed ? '#155724' : '#721c24',
                                                    fontWeight: 'bold'
                                                }}>
                                                    <div>📊 Kết quả: {quizScores[quiz._id].correct}/{quizScores[quiz._id].total} câu đúng</div>
                                                    <div>📈 Điểm: {quizScores[quiz._id].percentage.toFixed(1)}%</div>
                                                    <div>{quizScores[quiz._id].isPassed ? '✅ Passed' : `❌ Not passed (needs ≥${quiz.passingScore}%)`}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className={styles.lessonNavigation}>
                            <button
                            className={`btn ${styles.navBtn}`}
                            onClick={() => navigateLesson('prev')}
                            disabled={!hasPrev}
                        >
                            ← Previous lesson
                        </button>

                        {user && user.role === 'student' && (
                            <button
                                className={`btn ${isCompleted ? 'btn-success' : 'btn-primary-student'}`}
                                onClick={handleMarkComplete}
                                disabled={isCompleted}
                            >
                                {isCompleted ? '✓ Completed' : 'Mark complete'}
                            </button>
                        )}

                        <button
                            className={`btn ${styles.navBtn}`}
                            onClick={() => navigateLesson('next')}
                            disabled={!hasNext}
                        >
                            Next lesson →
                        </button>
                    </div>
                </div>

                {/* Sidebar - Course Content */}
                <aside className={styles.lessonSidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>Course Content</h3>
                        <Link to={`/courses/${courseId}`} className={styles.backLink}>
                            Back to Course
                        </Link>
                    </div>

                    <div className={styles.chaptersContainer}>
                        {course?.chapters?.map((ch) => (
                            <div key={ch._id} className={styles.chapterBlock}>
                                <h4 className={styles.chapterTitle}>{ch.title}</h4>
                                <ul className={styles.lessonsList}>
                                    {ch.lessons?.map((l) => (
                                        <li
                                            key={l._id}
                                            className={`${styles.lessonItem} ${l._id === lessonId ? styles.activeLesson : ''}`}
                                        >
                                            <Link to={`/courses/${courseId}/lessons/${l._id}`}>
                                                {l.isPreview && <span className={styles.previewIcon}>👁️</span>}
                                                {l.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default LessonDetail;
