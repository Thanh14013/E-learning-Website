import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import { useDiscussions } from '../../contexts/DiscussionContext';
import api from '../../services/api';
import toast from '../../services/toastService';
import DiscussionModal from '../../components/discussion/DiscussionModal.jsx';
import DiscussionForm from '../../components/course/DiscussionForm.jsx';
import styles from './LessonDetail.module.css';

const LessonDetail = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { myCourses } = useCourses();
    const { discussions: contextDiscussions, joinCourseRoom, leaveCourseRoom } = useDiscussions();
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

    // Discussion states
    const [discussions, setDiscussions] = useState([]);
    const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
    const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
    const [discussionPage, setDiscussionPage] = useState(1);
    const discussionsPerPage = 5;

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

    // Fetch discussions for this lesson
    const fetchLessonDiscussions = async () => {
        try {
            const response = await api.get(`/discussions/lesson/${lessonId}?page=1&limit=100`);
            if (response.data.success && response.data.data) {
                const allDiscussions = response.data.data.discussions || [];
                console.log('📥 Fetched discussions for lesson:', lessonId, allDiscussions.map(d => ({
                    id: d._id,
                    title: d.title,
                    lessonId: d.lessonId
                })));

                // STRICT FILTER: Only discussions with matching lessonId
                const lessonOnlyDiscussions = allDiscussions.filter(d =>
                    d.lessonId && d.lessonId.toString() === lessonId.toString()
                );

                // Sort by createdAt desc (newest first)
                const sortedDiscussions = lessonOnlyDiscussions.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );

                console.log('✅ Filtered lesson discussions:', sortedDiscussions.length);
                setDiscussions(sortedDiscussions);
            }
        } catch (error) {
            console.error('Failed to fetch lesson discussions:', error);
        }
    };

    useEffect(() => {
        if (lessonId) {
            fetchLessonDiscussions();
        }
    }, [lessonId]);

    // Sync context discussions with local state for this lesson
    useEffect(() => {
        if (contextDiscussions.length > 0) {
            setDiscussions(prev => {
                // STRICT: Only merge discussions that belong to THIS lesson (not null, not other lessons)
                const newDiscussions = contextDiscussions.filter(d =>
                    d.lessonId &&
                    d.lessonId.toString() === lessonId.toString() &&
                    !prev.find(p => p._id === d._id)
                );
                if (newDiscussions.length > 0) {
                    console.log('🔄 Merging new lesson discussions from socket:', newDiscussions.length);
                }
                return [...newDiscussions, ...prev];
            });
        }
    }, [contextDiscussions, lessonId]);

    // Join/leave course room for real-time updates
    useEffect(() => {
        if (courseId) {
            joinCourseRoom(courseId);
            return () => leaveCourseRoom(courseId);
        }
    }, [courseId, joinCourseRoom, leaveCourseRoom]);

    const handleQuizClick = async (quizId) => {
        // Check if quiz is already passed/completed - if so, don't allow reopening
        if (completedQuizzes.has(quizId)) {
            toast.info('✅ You have already passed this quiz');
            return;
        }

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

                // Start a new attempt if not already started (allow retaking if failed)
                if (!activeAttemptIds[quizId]) {
                    try {
                        const attemptRes = await api.post(`/quizzes/${quizId}/start`);
                        setActiveAttemptIds(prev => ({
                            ...prev,
                            [quizId]: attemptRes.data.attemptId
                        }));
                        console.log('✅ Started quiz attempt:', attemptRes.data.attemptId);
                    } catch (err) {
                        console.error('Failed to start attempt:', err);
                        const errorMsg = err.response?.data?.message || 'Unable to start quiz';
                        if (err.response?.status === 400 && errorMsg.includes('No attempts remaining')) {
                            toast.error(`❌ ${errorMsg}. You have used all ${err.response.data.attemptsAllowed || 'available'} attempts.`);
                        } else if (err.response?.status === 403) {
                            toast.error('🔒 You must be enrolled in this course to take the quiz');
                        } else {
                            toast.error(`❌ ${errorMsg}`);
                        }
                        setExpandedQuizId(null);
                        return;
                    }
                }
            } else {
                toast.error('📝 This quiz has no questions yet');
            }
        } catch (error) {
            console.error('Failed to fetch quiz questions:', error);
            const errorMsg = error.response?.data?.message || 'Unable to load questions';
            if (error.response?.status === 404) {
                toast.error('❌ Quiz not found');
            } else if (error.response?.status === 403) {
                toast.error('🔒 You do not have permission to view this quiz');
            } else {
                toast.error(`❌ ${errorMsg}`);
            }
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
            const errorMsg = error.response?.data?.message || 'Unable to mark as complete';
            if (error.response?.status === 404) {
                toast.error('❌ Lesson not found');
            } else if (error.response?.status === 403) {
                toast.error('🔒 You must be enrolled in this course to mark lessons complete');
            } else {
                toast.error(`❌ ${errorMsg}`);
            }
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
                                <div className={styles.overviewHeader}>
                                    <span className={styles.overviewIcon}>📚</span>
                                    <h3 className={styles.overviewTitle}>Reference Documentation</h3>
                                </div>
                                <div className={styles.referenceLinks}>
                                    <div className={styles.referenceItem}>
                                        <span className={styles.referenceLabel}>Reference:</span>
                                        <a
                                            href={primaryResource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.referenceLink}
                                        >
                                            {primaryResource.url}
                                        </a>
                                    </div>
                                    {relatedResources.length > 0 && (
                                        <div className={styles.referenceItem}>
                                            <span className={styles.referenceLabel}>Reference:</span>
                                            <a
                                                href={relatedResources[0].url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.referenceLink}
                                            >
                                                {relatedResources[0].url}
                                            </a>
                                        </div>
                                    )}
                                </div>
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
                                        style={{ cursor: completedQuizzes.has(quiz._id) ? 'not-allowed' : 'pointer' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {completedQuizzes.has(quiz._id) && (
                                                <span style={{ color: '#28a745', fontSize: '20px', fontWeight: 'bold' }}>✓</span>
                                            )}
                                            <h4 style={{ color: completedQuizzes.has(quiz._id) ? '#28a745' : 'inherit' }}>
                                                {quiz.title}
                                            </h4>
                                        </div>
                                        {!completedQuizzes.has(quiz._id) && (
                                            <span className={styles.quizToggle}>
                                                {expandedQuizId === quiz._id ? '▼' : '▶'}
                                            </span>
                                        )}
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
                                                    const unansweredCount = questions.filter(q => answers[q._id] === undefined || answers[q._id] === null || answers[q._id] === '').length;

                                                    if (unansweredCount > 0) {
                                                        toast.warn(`⚠️ Please answer all questions! You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}`);
                                                        return;
                                                    }

                                                    const percentage = calculateQuizScore(quiz._id, questions);

                                                    // Submit to backend
                                                    try {
                                                        // Use existing attemptId (already started when quiz was expanded)
                                                        const attemptId = activeAttemptIds[quiz._id];

                                                        if (!attemptId) {
                                                            toast.error('❌ Quiz session expired. Please close and reopen the quiz to start again.');
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
                                                            toast.success(`🎉 Congratulations! You scored ${result.percentage}% and passed the quiz!`);
                                                        } else {
                                                            // Get quiz details to show correct passing score
                                                            const currentQuiz = quizzes.find(q => q._id === quiz._id);
                                                            const passingScore = currentQuiz?.passingScore || 70;
                                                            toast.error(`📊 You scored ${result.percentage}%. Passing score is ${passingScore}%. Please close and reopen to try again.`);
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
                                                                    const errorMsg = err.response?.data?.message || 'Unable to mark lesson as complete';
                                                                    toast.error(`❌ ${errorMsg}`);
                                                                }
                                                            }
                                                        }, 500);
                                                    } catch (error) {
                                                        console.error('Failed to submit quiz:', error);
                                                        const errorMsg = error.response?.data?.message || 'Unable to submit quiz';
                                                        if (error.response?.status === 404) {
                                                            toast.error('❌ Quiz attempt not found. Please restart the quiz.');
                                                        } else if (error.response?.status === 403) {
                                                            toast.error('🔒 You do not have permission to submit this quiz.');
                                                        } else if (error.response?.status === 400 && errorMsg.includes('already submitted')) {
                                                            toast.error('⚠️ This quiz has already been submitted.');
                                                        } else {
                                                            toast.error(`❌ Failed to submit quiz: ${errorMsg}`);
                                                        }
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

                    {/* Discussion Section */}
                    <div className={styles.discussionSection} style={{ marginTop: '40px', borderTop: '2px solid #e0e0e0', paddingTop: '30px' }}>
                        <div className={styles.discussionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>💬 Lesson Discussion</h3>
                            {user && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowCreateDiscussion(true)}
                                    style={{ padding: '8px 16px' }}
                                >
                                    + New Discussion
                                </button>
                            )}
                        </div>

                        <div className={styles.discussionsList}>
                            {discussions.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                                    No discussions yet. Be the first to start a discussion!
                                </p>
                            ) : (
                                <>
                                    {discussions
                                        .slice((discussionPage - 1) * discussionsPerPage, discussionPage * discussionsPerPage)
                                        .map((discussion) => (
                                            <div
                                                key={discussion._id}
                                                className={styles.discussionCard}
                                                onClick={() => setSelectedDiscussionId(discussion._id)}
                                                style={{
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    padding: '15px',
                                                    marginBottom: '15px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    backgroundColor: discussion.isPinned ? '#fff9e6' : 'white'
                                                }}
                                            >
                                                {discussion.isPinned && (
                                                    <span style={{
                                                        backgroundColor: '#ffc107',
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        marginBottom: '8px',
                                                        display: 'inline-block'
                                                    }}>
                                                        📌 Pinned
                                                    </span>
                                                )}
                                                <h4 style={{ margin: '5px 0 10px', fontSize: '1.1rem' }}>{discussion.title}</h4>
                                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
                                                    {discussion.content.substring(0, 120)}
                                                    {discussion.content.length > 120 && '...'}
                                                </p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: '#888' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>👤 {discussion.userId?.fullName || 'Anonymous'}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#999' }}>
                                                        {new Date(discussion.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {discussions.length > discussionsPerPage && (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                                            <button
                                                onClick={() => setDiscussionPage(prev => Math.max(1, prev - 1))}
                                                disabled={discussionPage === 1}
                                                className="btn"
                                                style={{ padding: '6px 12px' }}
                                            >
                                                ← Previous
                                            </button>
                                            <span style={{ padding: '6px 12px', alignSelf: 'center' }}>
                                                Page {discussionPage} of {Math.ceil(discussions.length / discussionsPerPage)}
                                            </span>
                                            <button
                                                onClick={() => setDiscussionPage(prev => Math.min(Math.ceil(discussions.length / discussionsPerPage), prev + 1))}
                                                disabled={discussionPage >= Math.ceil(discussions.length / discussionsPerPage)}
                                                className="btn"
                                                style={{ padding: '6px 12px' }}
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Discussion Modal */}
                    {selectedDiscussionId && (
                        <DiscussionModal
                            discussionId={selectedDiscussionId}
                            isEnrolled={(() => {
                                const enrolled = myCourses.some(c => c._id === courseId);
                                console.log('🔍 Enrollment check for lesson discussion:', {
                                    courseId,
                                    myCourses: myCourses.map(c => c._id),
                                    enrolled
                                });
                                return enrolled;
                            })()}
                            onClose={() => setSelectedDiscussionId(null)}
                        />
                    )}

                    {/* Create Discussion Modal */}
                    {showCreateDiscussion && (
                        <div className="modal-overlay" onClick={() => setShowCreateDiscussion(false)}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                                <DiscussionForm
                                    courseId={courseId}
                                    lessonId={lessonId}
                                    onSuccess={(newDiscussion) => {
                                        setShowCreateDiscussion(false);
                                        toast.success('Discussion created successfully!');
                                        // Add new discussion to the beginning and refetch
                                        setDiscussions(prev => [newDiscussion, ...prev]);
                                        // Also refetch to ensure sync with server
                                        fetchLessonDiscussions();
                                    }}
                                    onCancel={() => setShowCreateDiscussion(false)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className={styles.lessonNavigation} style={{ marginTop: '30px' }}>
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
