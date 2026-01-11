import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import { useDiscussions } from '../../contexts/DiscussionContext';
import api from '../../services/api';
import toast from '../../services/toastService';
import styles from './courseDetail.module.css';
import CourseContentAccordion from '../../components/course/CourseContentAccordion.jsx';
import DiscussionModal from '../../components/discussion/DiscussionModal.jsx';
import DiscussionForm from '../../components/course/DiscussionForm.jsx';
import SessionForm from '../../components/course/SessionForm.jsx';
import { useNavigate } from 'react-router-dom';


// --- Các Icon SVG ---
const CheckIcon = () => <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>;
const VideoIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z" /></svg>;
const CertificateIcon = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6zM3 8.207V13.5A.5.5 0 0 0 3.5 14h9a.5.5 0 0 0 .5-.5V8.207l-5-5-4 4z" /></svg>;
const StarIcon = ({ filled }) => (
  <svg width="24" height="24" fill={filled ? "#fbbf24" : "none"} stroke={filled ? "#fbbf24" : "currentColor"} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// --- Rating Component ---
const CourseRating = ({ courseId, isEnrolled, currentRating, totalReviews, userReview, onRatingSubmit }) => {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState(userReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(userReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const hasAlreadyRated = !!userReview;

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error('Please log in to submit a rating');
      return;
    }
    if (!isEnrolled) {
      toast.error('You must be enrolled in the course to submit a rating');
      return;
    }
    if (userRating === 0) {
      toast.error('Please select a star rating before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/courses/${courseId}/review`, {
        rating: userRating,
        comment: comment.trim() || undefined,
      });
      toast.success('Rating submitted successfully');
      // Update parent component with new rating data
      if (onRatingSubmit) {
        onRatingSubmit(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.ratingSection}>
      <h3>Course Rating</h3>
      <div className={styles.currentRating}>
        <div className={styles.ratingDisplay}>
          <span className={styles.ratingNumber}>{currentRating?.toFixed(1) || '0.0'}</span>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon key={star} filled={star <= Math.round(currentRating || 0)} />
            ))}
          </div>
          <span className={styles.reviewCount}>({totalReviews || 0} reviews)</span>
        </div>
      </div>

      {isEnrolled && user && (
        <div className={styles.ratingForm}>
          <h4>{hasAlreadyRated ? 'Your Rating (Already Submitted)' : 'Your Rating'}</h4>
          <div className={styles.starRating}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={styles.starButton}
                onMouseEnter={() => !hasAlreadyRated && setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => !hasAlreadyRated && setUserRating(star)}
                disabled={hasAlreadyRated}
                style={{ cursor: hasAlreadyRated ? 'default' : 'pointer', opacity: hasAlreadyRated ? 0.7 : 1 }}
              >
                <StarIcon filled={star <= (hoverRating || userRating)} />
              </button>
            ))}
          </div>
          {hasAlreadyRated && userReview.comment && (
            <div className={styles.existingComment}>
              <p><strong>Your comment:</strong> {userReview.comment}</p>
              <p style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                Submitted on {new Date(userReview.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {!hasAlreadyRated && (
            <>
              <textarea
                className={styles.commentInput}
                placeholder="Your comment (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <button
                className="btn btn-primary-student"
                onClick={handleSubmitRating}
                disabled={submitting || userRating === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENT CON CHO SIDEBAR ---
const CourseSidebar = ({ course, isEnrolled, onEnroll }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const loadSessions = async () => {
      if (!isEnrolled || !course?._id) return;
      setLoadingSessions(true);
      try {
        const [resScheduled, resLive] = await Promise.all([
          api.get(`/sessions/course/${course._id}?status=scheduled&limit=20`),
          api.get(`/sessions/course/${course._id}?status=live&limit=5`)
        ]);

        let allSessions = [];
        if (resLive.data?.success) {
          allSessions = [...allSessions, ...resLive.data.data];
        }
        if (resScheduled.data?.success) {
          allSessions = [...allSessions, ...resScheduled.data.data];
        }

        // Sort: Live first, then by date asc
        allSessions.sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (a.status !== 'live' && b.status === 'live') return 1;
          return new Date(a.scheduledAt) - new Date(b.scheduledAt);
        });

        setUpcomingSessions(allSessions.slice(0, 6));
      } catch (err) {
        console.error('Failed to load live sessions', err);
      } finally {
        setLoadingSessions(false);
      }
    };

    loadSessions();
  }, [course?._id, isEnrolled]);

  return (
    <div className={styles.sidebarCard}>
      <div className={styles.sidebarImage}>
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ backgroundColor: '#667eea', width: '100%', height: '100%' }} />
        )}
      </div>
      <div className={styles.sidebarContent}>
        {user && user.role === 'student' ? (
          isEnrolled ? (
            <button className={styles.enrolledButton} disabled>✓ Enrolled</button>
          ) : (
            <button className={`btn btn-primary-student ${styles.enrollButton}`} onClick={() => onEnroll(course._id)}>
              Enroll in Course
            </button>
          )
        ) : (
          <p className="text-center">Log in to enroll in the course.</p>
        )}

        <h4 className={styles.includesTitle}>This Course Includes</h4>
        <ul className={styles.includesList}>
          <li><VideoIcon /> {course.metadata?.totalHours || 0} hours of video</li>
          {course.metadata?.hasCertificate && <li><CertificateIcon /> Completion Certificate</li>}
          <li>📚 {course.level || 'Beginner'} level</li>
          <li>📂 {course.category || 'General'}</li>
        </ul>

        {/* Teacher Info in Sidebar */}
        {course.teacherId && (
          <div className={styles.teacherSection} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            <h4 className={styles.includesTitle}>Instructor</h4>
            <div className={styles.teacherCard}>
              <div className={styles.teacherAvatar}>
                {course.teacherId.avatar ? (
                  <img src={course.teacherId.avatar} alt={course.teacherId.fullName} />
                ) : (
                  <div className={styles.avatarIcon}>👤</div>
                )}
              </div>
              <div className={styles.teacherDetails}>
                <h5>{course.teacherId.fullName}</h5>
                <p className={styles.teacherRole}>{course.teacherId.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Live Schedule Moved to Bottom */}
        {isEnrolled && (
          <div className={styles.liveSchedule} style={{ marginTop: '1rem' }}>
            <div className={styles.liveScheduleHeader}>
              <span>📅 Online Schedule</span>
              {loadingSessions && <span className={styles.liveScheduleHint}>Loading...</span>}
            </div>
            {(!loadingSessions && upcomingSessions.length === 0) && (
              <p className={styles.liveScheduleEmpty}>No upcoming live sessions.</p>
            )}
            <div className={styles.liveScheduleList}>
              {upcomingSessions.map((session) => (
                <div
                  key={session._id}
                  className={`${styles.liveScheduleItem} ${ session.status === 'live' ? styles.liveItem : ''}`}
                  onClick={() => {
                    if (session.status === 'live') navigate(`/session/${session._id}`);
                  }}
                >
                  <div className={styles.liveScheduleDate}>
                    {session.status === 'live' ? (
                      <span style={{ color: '#e53e3e', fontWeight: 'bold' }}>LIVE</span>
                    ) : (
                      new Date(session.scheduledAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
                    )}
                  </div>
                  <div className={styles.liveScheduleInfo}>
                    <div className={styles.liveScheduleTitle} style={session.status === 'live' ? { color: '#e53e3e' } : {}}>{session.title}</div>
                    <div className={styles.liveScheduleMeta}>
                      ⏰ {new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {session.status === 'live' && (
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ padding: '2px 8px', fontSize: '0.7rem', marginLeft: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/session/${session._id}`);
                      }}
                    >
                      JOiN
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Live Sessions Component ---

const LiveSessionsSection = ({ courseId, isHost }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduler, setShowScheduler] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const navigate = useNavigate();

  const fetchSessions = async () => {
    try {
      setLoading(true);
      // Fetch upcoming and live sessions
      const response = await api.get(`/sessions/course/${courseId}?status=scheduled&limit=10`);
      if (response.data.success) {
        setSessions(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchSessions();
    }
  }, [courseId]);

  const handleJoinSession = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  const handleStartSession = async (sessionId) => {
    // First ensure session is started in backend if needed, or just join as host
    // Ideally we call start endpoint
    try {
      await api.put(`/teacher/sessions/${sessionId}/start`);
      navigate(`/session/${sessionId}`);
    } catch (err) {
      console.error("Failed to start session", err);
      toast.error("Could not start session");
    }
  };

  return (
    <div className={styles.sectionBox}>
      <div className={styles.sectionHeader}>
        <h3>📅 Live Sessions</h3>
        {isHost && (
          <button
            className="btn btn-primary"
            onClick={() => setShowScheduler(true)}
            style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
          >
            + Schedule Session
          </button>
        )}
      </div>

      {loading && <p>Loading sessions...</p>}

      {!loading && sessions.length === 0 && (
        <p className={styles.noContent}>No upcoming live sessions scheduled.</p>
      )}

      {!loading && sessions.length > 0 && (
        <div className={styles.sessionsGrid}>
          {sessions.map(session => (
            <div key={session._id} className={styles.sessionCard}>
              <div className={styles.sessionIcon}>🎥</div>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionTitle}>{session.title}</div>
                <div className={styles.sessionTime}>
                  📆 {new Date(session.scheduledAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {' '}at{' '}
                  {new Date(session.scheduledAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                {session.description && (
                  <div className={styles.sessionDescription}>{session.description}</div>
                )}
                <div className={styles.sessionHost}>
                  Host: {session.hostId?.fullName || 'Instructor'}
                </div>
              </div>
              <div className={styles.sessionActions}>
                <div className={styles.sessionBadge}>
                  {session.status === 'live' ? '🔴 Live' : '⏰ Scheduled'}
                </div>

                {session.status === 'live' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleJoinSession(session._id)}
                  >
                    Join Now
                  </button>
                )}

                {session.status === 'scheduled' && isHost && (
                  <>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleStartSession(session._id)}
                    >
                      Start
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ marginLeft: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                      onClick={() => {
                        setEditingSession(session);
                        setShowScheduler(true);
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showScheduler && (
        <SessionForm
          courseId={courseId}
          session={editingSession}
          onSuccess={() => {
            setShowScheduler(false);
            setEditingSession(null);
            fetchSessions();
          }}
          onCancel={() => {
            setShowScheduler(false);
            setEditingSession(null);
          }}
        />
      )}
    </div>
  );
};

// --- COMPONENT CHÍNH ---
const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { myCourses, enrollCourse } = useCourses();
  const { discussions: contextDiscussions, joinCourseRoom, leaveCourseRoom } = useDiscussions();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
  const [discussionPage, setDiscussionPage] = useState(1);
  const discussionsPerPage = 5;

  // Join socket room for real-time updates
  useEffect(() => {
    if (user && courseId) {
      joinCourseRoom(courseId);
      return () => leaveCourseRoom();
    }
  }, [user, courseId, joinCourseRoom, leaveCourseRoom]);

  // Sync context discussions with local state - MERGE instead of overwrite
  useEffect(() => {
    if (contextDiscussions.length > 0) {
      setDiscussions(prev => {
        // Create a map of existing discussions
        const existingIds = new Set(prev.map(d => d._id));
        // Add new discussions from context that don't exist locally
        const newDiscussions = contextDiscussions.filter(d => !existingIds.has(d._id));
        return [...newDiscussions, ...prev];
      });
    }
  }, [contextDiscussions]);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const courseRes = await api.get(`/courses/${courseId}`);
        const courseData = courseRes.data.data;
        setCourse(courseData);
        setModules(courseData.chapters || []);
        setDiscussions(courseData.discussions || []);

        // Fetch progress if enrolled
        if (user && myCourses.some(c => c._id === courseId)) {
          try {
            const progressRes = await api.get(`/progress/course/${courseId}`);
            setCourse(prev => ({
              ...prev,
              progressData: progressRes.data
            }));
          } catch (err) {
            console.log('Progress not available');
          }
        }
      } catch (error) {
        console.error("Failed to fetch course data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId, user, myCourses]);

  const isEnrolled = myCourses.some(c => c._id === courseId);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please log in to enroll in the course');
      return;
    }

    if (isEnrolling) return;

    try {
      setIsEnrolling(true);
      console.log('🎓 Enrolling in course:', courseId);

      const response = await enrollCourse(courseId);
      console.log('✅ Enroll response:', response);

      // Check if response has success flag
      if (response && response.success !== false) {
        toast.success(response.message || 'Course enrolled successfully!');

        // Reload page to show updated enrollment status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(response.message || 'Enroll failed');
      }
    } catch (error) {
      console.error('❌ Enrollment failed:', error);
      // Extract error message properly
      const errorMsg = error.response?.data?.message
        || error.message
        || 'Unable to enroll in course';
      toast.error(errorMsg);
      setIsEnrolling(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: 'var(--spacing-5)' }}>Loading...</div>;
  if (!course) return <div className="container" style={{ padding: 'var(--spacing-5)' }}>Course not found.</div>;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.headerContainer}>
        <div className={styles.headerContent}>
          <h1>{course.title || course.name}</h1>
          <p>{course.description}</p>
          <div className={styles.metaInfo}>
            {course.bestseller && <span className="badge badge-warning">Bestseller</span>}
            <div className={styles.ratingInfo}>
              <span className={styles.avg}>{course.rating?.toFixed(1) || '0.0'}</span>
              <StarIcon filled={true} />
              <span className={styles.count}>({course.totalReviews || 0} ratings)</span>
            </div>

          </div>
        </div>
      </header>

      <div className={styles.pageLayout}>
        <main className={styles.mainContent}>
          {/* Course Stats */}
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>👥</span>
              <div>
                <div className={styles.statValue}>{course.enrolledStudents?.length || 0}</div>
                <div className={styles.statLabel}>Students Enrolled</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📚</span>
              <div>
                <div className={styles.statValue}>{modules.length || 0}</div>
                <div className={styles.statLabel}>Chapters</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>📝</span>
              <div>
                <div className={styles.statValue}>
                  {modules.reduce((total, mod) => total + (mod.lessons?.length || 0), 0)}
                </div>
                <div className={styles.statLabel}>Lessons</div>
              </div>
            </div>
          </div>

          {/* What you'll learn */}
          {course.highlights && course.highlights.length > 0 && (
            <div className={styles.sectionBox}>
              <h3>What you'll learn</h3>
              <ul className={styles.highlightsGrid}>
                {course.highlights.map((item, index) => (
                  <li key={index}><CheckIcon /> <span>{item}</span></li>
                ))}
              </ul>
            </div>
          )}
          {/* Course Description */}
          {
            course.description && (
              <div className={styles.sectionBox}>
                <h3>Course Description</h3>
                <p className={styles.description}>{course.description}</p>
              </div>
            )
          }

          {/* Progress Bar - Only for enrolled students - RIGHT AFTER DESCRIPTION */}
          {isEnrolled && course.progressData && (
            <div className={styles.sectionBox}>
              <h3>Your Progress</h3>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressText}>
                    {course.progressData.completedLessons || 0} / {course.progressData.totalLessons || 0} lessons completed
                  </span>
                  <span className={styles.progressPercent}>
                    {course.progressData.progressPercentage || 0}%
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${course.progressData.progressPercentage || 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Sessions - Only for enrolled students OR Host */}
          {(isEnrolled || (user && course && (user._id === course.teacherId || user._id === course.teacherId?._id))) && (
            <LiveSessionsSection
              courseId={courseId}
              isHost={user && course && (user._id === course.teacherId || user._id === course.teacherId?._id)}
            />
          )}

          {/* Course Content */}

          <div className={styles.sectionBox}>
            <h3>Course Content</h3>
            {modules.length > 0 ? (
              <CourseContentAccordion modules={modules} courseId={course._id} />
            ) : (
              <p className={styles.noContent}>No course content available</p>
            )}
          </div>

          {/* Rating Section */}
          <CourseRating
            courseId={courseId}
            isEnrolled={isEnrolled}
            currentRating={course.rating}
            totalReviews={course.totalReviews}
            userReview={course.userReview}
            onRatingSubmit={(data) => {
              // Update course state with new rating data
              if (data?.data?.course) {
                setCourse(prev => ({
                  ...prev,
                  rating: data.data.course.rating,
                  totalReviews: data.data.course.totalReviews,
                  userReview: data.data.review
                }));
              }
            }}
          />

          {/* Discussions Section */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <h3>💬 Discussions & Q&A</h3>
              {isEnrolled && (
                <button
                  className="btn btn-primary-student"
                  onClick={() => setShowCreateDiscussion(true)}
                  style={{ marginLeft: 'auto' }}
                >
                  + New Discussion
                </button>
              )}
            </div>
            {discussions.length > 0 ? (
              <>
                <div className={styles.discussionsList}>
                  {discussions.slice((discussionPage - 1) * discussionsPerPage, discussionPage * discussionsPerPage).map((discussion) => (
                    <div
                      key={discussion._id}
                      className={styles.discussionCard}
                      onClick={() => setSelectedDiscussionId(discussion._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h4 className={styles.discussionTitle}>{discussion.title}</h4>
                      <p className={styles.discussionPreview}>
                        {discussion.content?.substring(0, 120)}{discussion.content?.length > 120 ? '...' : ''}
                      </p>
                      <div className={styles.discussionFooter}>
                        <div className={styles.author}>
                          <div className={styles.avatar}></div>
                          <span className={styles.authorName}>
                            {discussion.userId?.fullName || 'Anonymous'}
                          </span>
                          <span className={styles.timestamp}>
                            • {new Date(discussion.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {discussions.length > discussionsPerPage && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => setDiscussionPage(p => Math.max(1, p - 1))}
                      disabled={discussionPage === 1}
                    >
                      ← Previous
                    </button>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Page {discussionPage} of {Math.ceil(discussions.length / discussionsPerPage)}
                    </span>
                    <button
                      className="btn btn-outline"
                      onClick={() => setDiscussionPage(p => Math.min(Math.ceil(discussions.length / discussionsPerPage), p + 1))}
                      disabled={discussionPage >= Math.ceil(discussions.length / discussionsPerPage)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noDiscussions}>
                <p>No discussions yet. Be the first to start a conversation!</p>
              </div>
            )}
          </div>
        </main>

        <aside className={styles.sidebar}>
          <CourseSidebar course={course} isEnrolled={isEnrolled} onEnroll={handleEnroll} />
        </aside>
      </div>

      {/* Create Discussion Modal */}
      {showCreateDiscussion && (
        <div className="modal-overlay" onClick={() => setShowCreateDiscussion(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <DiscussionForm
              courseId={courseId}
              onSuccess={(newDiscussion) => {
                setShowCreateDiscussion(false);
                // Update discussions list realtime
                setDiscussions(prev => [newDiscussion, ...prev]);
              }}
              onCancel={() => setShowCreateDiscussion(false)}
            />
          </div>
        </div>
      )}

      {/* Discussion Detail Modal */}
      {selectedDiscussionId && (
        <DiscussionModal
          discussionId={selectedDiscussionId}
          isEnrolled={isEnrolled}
          onClose={() => setSelectedDiscussionId(null)}
          onEnroll={handleEnroll}
          courseTeacherId={course?.teacherId?._id || course?.teacherId}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;