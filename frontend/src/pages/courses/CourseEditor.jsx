import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmDialogContext';
import api from '../../services/api';
import toastService from '../../services/toastService';
import QuizBuilder from '../../components/quiz/QuizBuilder';
import styles from './CourseEditor.module.css';

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useConfirm();

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    level: 'beginner',
    highlights: [],
  });

  // Thumbnail
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Drag and drop
  const [draggedChapter, setDraggedChapter] = useState(null);
  const [draggedLesson, setDraggedLesson] = useState(null);
  const [dragOverChapter, setDragOverChapter] = useState(null);
  const [dragOverLesson, setDragOverLesson] = useState(null);

  // Modals
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null); // { quizId, lessonId }

  // Auto-save
  const autoSaveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const savingRef = useRef(false);

  const categories = [
    "Programming", "Frontend", "Full Stack", "Backend", "DevOps",
    "Nodejs", "Reactjs", "Java", "Python", "C++",
    "Data Science", "Machine Learning", "Cloud Computing", "Cybersecurity",
    "Mobile Development", "Other"
  ].sort();
  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ];

  // Load course data
  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);

      // Load course details
      const courseRes = await api.get(`/teacher/courses/${courseId}`);
      const courseData = courseRes.data.data || courseRes.data;
      setCourse(courseData);
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        category: courseData.category || 'Other',
        level: courseData.level || 'beginner',
        highlights: courseData.highlights || [],
      });

      if (courseData.thumbnail) {
        setThumbnailPreview(courseData.thumbnail);
      }

      // Load chapters with lessons
      // The course detail API should return all chapters and lessons for teachers
      const courseDetail = courseRes.data.data || courseRes.data;
      const chaptersData = courseDetail.chapters || [];

      // Use chapters from course detail response
      // For teachers, all lessons should be visible
      const chaptersWithLessons = chaptersData.map(ch => ({
        ...ch,
        lessons: (ch.lessons || []).sort((a, b) => a.order - b.order)
      })).sort((a, b) => a.order - b.order);

      setChapters(chaptersWithLessons);

      setChapters(chaptersWithLessons);

      // Load quizzes
      try {
        const quizzesRes = await api.get(`/teacher/quizzes/course/${courseId}`);
        setQuizzes(quizzesRes.data.data || []);
      } catch (err) {
        console.error('Failed to load quizzes:', err);
      }

      // Expand first chapter by default
      if (chaptersWithLessons.length > 0) {
        setExpandedChapters(new Set([chaptersWithLessons[0]._id]));
      }
    } catch (error) {
      console.error('Load course error:', error);
      toastService.error('Unable to load course data');
      navigate('/teacher/courses');
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!course || savingRef.current) return;

    const currentData = JSON.stringify(formData);
    if (currentData === lastSavedRef.current) {
      return; // No changes
    }

    try {
      setAutoSaveStatus('saving');
      savingRef.current = true;
      setSaving(true);

      await api.put(`/teacher/courses/${courseId}`, formData);

      lastSavedRef.current = currentData;
      setAutoSaveStatus('saved');

      // Upload thumbnail if changed
      if (thumbnailFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('thumbnail', thumbnailFile);
        await api.post(`/teacher/courses/${courseId}/thumbnail`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setThumbnailFile(null);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [course, courseId, formData, thumbnailFile]);

  useEffect(() => {
    if (!course || loading || savingRef.current) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, course, loading, saving, handleAutoSave]);

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleThumbnailSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastService.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastService.error('Image size must not exceed 5MB');
      return;
    }

    setThumbnailFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Highlights management
  const handleAddHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, '']
    }));
  };

  const handleHighlightChange = (index, value) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData(prev => ({ ...prev, highlights: newHighlights }));
  };

  const handleRemoveHighlight = (index) => {
    const newHighlights = formData.highlights.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, highlights: newHighlights }));
  };

  // Chapter management
  const handleAddChapter = () => {
    setEditingChapter(null);
    setShowChapterModal(true);
  };

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setShowChapterModal(true);
  };

  const handleSaveChapter = async (chapterData) => {
    try {
      if (editingChapter) {
        await api.put(`/teacher/chapters/${editingChapter._id}`, chapterData);
        toastService.success('Chapter updated');
      } else {
        await api.post('/teacher/chapters', { ...chapterData, courseId });
        toastService.success('Added new chapter');
      }
      await loadCourseData();
      setShowChapterModal(false);
    } catch (error) {
      console.error('Save chapter error:', error);
      toastService.error('Unable to save chapter');
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    const isConfirmed = await confirm('Are you sure you want to delete this chapter? All lessons in the chapter will also be deleted.', { type: 'danger', title: 'Delete Chapter', confirmText: 'Delete' });
    if (!isConfirmed) {
      return;
    }

    try {
      await api.delete(`/teacher/chapters/${chapterId}`);
      toastService.success('Chapter deleted');
      await loadCourseData();
    } catch (error) {
      console.error('Delete chapter error:', error);
      toastService.error('Unable to delete chapter');
    }
  };

  // Quiz management
  const handleAddQuiz = (lessonId) => {
    setEditingQuiz({ lessonId, quizId: null });
    setShowQuizBuilder(true);
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz({ lessonId: quiz.lessonId, quizId: quiz._id });
    setShowQuizBuilder(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    const isConfirmed = await confirm('Are you sure you want to delete this quiz?', { type: 'danger', title: 'Delete Quiz', confirmText: 'Delete' });
    if (!isConfirmed) return;
    try {
      await api.delete(`/teacher/quizzes/${quizId}`);
      toastService.success('Quiz deleted');
      loadCourseData();
    } catch (error) {
      console.error('Delete quiz error:', error);
      toastService.error('Unable to delete quiz');
    }
  };

  const handleQuizBuilderClose = () => {
    setShowQuizBuilder(false);
    setEditingQuiz(null);
    loadCourseData(); // Reload to get updated quizzes
  };

  // Lesson management
  const handleAddLesson = (chapterId) => {
    setEditingLesson(null);
    setDragOverChapter(chapterId);
    setShowLessonModal(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setShowLessonModal(true);
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (editingLesson) {
        await api.put(`/teacher/lessons/${editingLesson._id}`, lessonData);
        toastService.success('Lesson updated');
      } else {
        await api.post('/teacher/lessons', { ...lessonData, chapterId: dragOverChapter });
        toastService.success('Added new lesson');
      }
      await loadCourseData();
      setShowLessonModal(false);
      setDragOverChapter(null);
    } catch (error) {
      console.error('Save lesson error:', error);
      toastService.error('Unable to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    const isConfirmed = await confirm('Are you sure you want to delete this lesson?', { type: 'danger', title: 'Delete Lesson', confirmText: 'Delete' });
    if (!isConfirmed) {
      return;
    }

    try {
      await api.delete(`/teacher/lessons/${lessonId}`);
      toastService.success('Lesson deleted');
      await loadCourseData();
    } catch (error) {
      console.error('Delete lesson error:', error);
      toastService.error('Unable to delete lesson');
    }
  };

  // Drag and drop for chapters
  const handleChapterDragStart = (e, chapterId) => {
    setDraggedChapter(chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleChapterDragOver = (e, chapterId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverChapter(chapterId);
  };

  const handleChapterDrop = async (e, targetChapterId) => {
    e.preventDefault();

    if (!draggedChapter || draggedChapter === targetChapterId) {
      setDraggedChapter(null);
      setDragOverChapter(null);
      return;
    }

    try {
      const chapterIds = chapters.map((ch) => ch._id);
      const draggedIndex = chapterIds.indexOf(draggedChapter);
      const targetIndex = chapterIds.indexOf(targetChapterId);

      // Reorder array
      const reordered = [...chapters];
      const [removed] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, removed);

      // Update order
      const reorderedIds = reordered.map((ch) => ch._id);
      await api.put('/teacher/chapters/reorder', { chapters: reorderedIds });

      toastService.success('Chapters reordered');
      await loadCourseData();
    } catch (error) {
      console.error('Reorder chapters error:', error);
      toastService.error('Unable to reorder chapters');
    } finally {
      setDraggedChapter(null);
      setDragOverChapter(null);
    }
  };

  // Drag and drop for lessons
  const handleLessonDragStart = (e, lessonId, chapterId) => {
    setDraggedLesson({ lessonId, chapterId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLessonDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleLessonDrop = async (e, targetLessonId, targetChapterId) => {
    e.preventDefault();

    if (!draggedLesson) return;

    const { lessonId: draggedLessonId, chapterId: sourceChapterId } = draggedLesson;

    if (draggedLessonId === targetLessonId) {
      setDraggedLesson(null);
      return;
    }

    try {
      const sourceChapter = chapters.find((ch) => ch._id === sourceChapterId);
      const targetChapter = chapters.find((ch) => ch._id === targetChapterId);

      if (!sourceChapter || !targetChapter) return;

      // If moving to different chapter, update chapterId
      if (sourceChapterId !== targetChapterId) {
        await api.put(`/teacher/lessons/${draggedLessonId}`, {
          chapterId: targetChapterId,
        });
      }

      // Reorder lessons
      const sourceLessons = sourceChapter.lessons || [];
      const targetLessons = targetChapter.lessons || [];

      const draggedLessonObj = sourceLessons.find((l) => l._id === draggedLessonId);
      if (!draggedLessonObj) return;

      // Remove from source
      const updatedSourceLessons = sourceLessons.filter((l) => l._id !== draggedLessonId);

      // Add to target
      const targetIndex = targetLessons.findIndex((l) => l._id === targetLessonId);
      const updatedTargetLessons = [...targetLessons];
      updatedTargetLessons.splice(targetIndex, 0, draggedLessonObj);

      // Update orders
      const updatePromises = [];

      if (sourceChapterId === targetChapterId) {
        // Same chapter reorder
        updatedTargetLessons.forEach((lesson, index) => {
          updatePromises.push(
            api.put(`/teacher/lessons/${lesson._id}`, { order: index + 1 })
          );
        });
      } else {
        // Different chapters
        updatedSourceLessons.forEach((lesson, index) => {
          updatePromises.push(
            api.put(`/teacher/lessons/${lesson._id}`, { order: index + 1 })
          );
        });
        updatedTargetLessons.forEach((lesson, index) => {
          updatePromises.push(
            api.put(`/teacher/lessons/${lesson._id}`, {
              order: index + 1,
              chapterId: targetChapterId,
            })
          );
        });
      }

      await Promise.all(updatePromises);

      toastService.success('Lessons reordered');
      await loadCourseData();
    } catch (error) {
      console.error('Reorder lesson error:', error);
      toastService.error('Unable to reorder lessons');
    } finally {
      setDraggedLesson(null);
    }
  };

  // Toggle chapter expansion
  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  // Save draft manually
  const handleSaveDraft = async () => {
    await handleAutoSave();
  };

  // Submit course for review
  const handlePublish = async () => {
    try {
      setSaving(true);
      await api.put(`/teacher/courses/${courseId}/submit`);
      toastService.success('Course submitted for review');
      navigate('/teacher/courses');
    } catch (error) {
      console.error('Submit error:', error);
      toastService.error(error.response?.data?.message || 'Unable to submit course');
    } finally {
      setSaving(false);
    }
  };

  // Check permissions
  useEffect(() => {
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      toastService.error('Only teachers can access this page');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <Loading size="large" text="Loading data..." />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>Course not found</h2>
          <Button onClick={() => navigate('/teacher/courses')}>Back</Button>
        </div>
      </div>
    );
  }

  if (showQuizBuilder) {
    return (
      <QuizBuilder
        courseId={courseId}
        lessonId={editingQuiz?.lessonId}
        quizId={editingQuiz?.quizId}
        onClose={handleQuizBuilderClose}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backButton}
            onClick={() => navigate('/teacher/courses')}
          >
            ← Back
          </button>
          <h1 className={styles.title}>Edit Course</h1>
        </div>
        <div className={styles.headerRight}>


          {course.approvalStatus === 'rejected' && (
            <Button variant="primary" onClick={handlePublish} disabled={saving}>
              Resubmit
            </Button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Left Panel - Course Details */}
        <div className={styles.leftPanel}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Course Information</h2>

            <div className={styles.formGroup}>
              <Input
                name="title"
                label="Course title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter course title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Course Description
                <span className={styles.required}>*</span>
              </label>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Enter detailed course description..."
                className={styles.quillEditor}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Category
                  <span className={styles.required}>*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Level
                  <span className={styles.required}>*</span>
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Course cover image</label>
              {thumbnailPreview ? (
                <div className={styles.thumbnailPreview}>
                  <img src={thumbnailPreview} alt="Thumbnail" />
                  <button
                    className={styles.removeThumbnail}
                    onClick={() => {
                      setThumbnailPreview(null);
                      setThumbnailFile(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  className={styles.thumbnailDropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={styles.dropzoneIcon}>📷</div>
                  <p>Click to choose image</p>
                  <p className={styles.dropzoneHint}>JPG, PNG, GIF (max 5MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleThumbnailSelect(e.target.files[0])}
                className={styles.fileInput}
              />
            </div>

            {/* Highlights Section */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>What you'll learn</h2>
              <Button variant="outline" size="small" onClick={handleAddHighlight}>
                + Add Item
              </Button>
            </div>
            <div className={styles.formGroup}>
              {formData.highlights.map((highlight, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <Input
                    value={highlight}
                    onChange={(e) => handleHighlightChange(index, e.target.value)}
                    placeholder="e.g. Build full-stack apps"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => handleRemoveHighlight(index)}
                    style={{ minWidth: '40px', padding: '0 10px' }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              {formData.highlights.length === 0 && (
                <p style={{ color: '#666', fontStyle: 'italic', fontSize: '0.9rem' }}>Add key learning outcomes to attract students.</p>
              )}
            </div>



          </div>
        </div>

        {/* Right Panel - Course Structure */}
        <div className={styles.rightPanel}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Course structure</h2>
              <Button variant="primary" size="small" onClick={handleAddChapter}>
                + Add chapter
              </Button>
            </div>

            {chapters.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No chapters yet. Add the first chapter!</p>
              </div>
            ) : (
              <div className={styles.chaptersList}>
                {chapters.map((chapter) => (
                  <div
                    key={chapter._id}
                    className={`${styles.chapterItem} ${dragOverChapter === chapter._id ? styles.dragOver : ''
                      }`}
                    draggable
                    onDragStart={(e) => handleChapterDragStart(e, chapter._id)}
                    onDragOver={(e) => handleChapterDragOver(e, chapter._id)}
                    onDrop={(e) => handleChapterDrop(e, chapter._id)}
                    onDragEnd={() => {
                      setDraggedChapter(null);
                      setDragOverChapter(null);
                    }}
                  >
                    <div className={styles.chapterHeader}>
                      <div className={styles.chapterDragHandle}>☰</div>
                      <button
                        className={styles.chapterToggle}
                        onClick={() => toggleChapter(chapter._id)}
                      >
                        {expandedChapters.has(chapter._id) ? '▼' : '▶'}
                      </button>
                      <div className={styles.chapterInfo}>
                        <h3 className={styles.chapterTitle}>{chapter.title}</h3>
                        <span className={styles.chapterMeta}>
                          {chapter.lessons?.length || 0} lessons
                        </span>
                      </div>
                      <div className={styles.chapterActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleEditChapter(chapter)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleDeleteChapter(chapter._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {expandedChapters.has(chapter._id) && (
                      <div className={styles.lessonsList}>
                        {chapter.lessons?.map((lesson) => (
                          <React.Fragment key={lesson._id}>
                            <div
                              className={styles.lessonItem}
                              draggable
                              onDragStart={(e) =>
                                handleLessonDragStart(e, lesson._id, chapter._id)
                              }
                              onDragOver={handleLessonDragOver}
                              onDrop={(e) =>
                                handleLessonDrop(e, lesson._id, chapter._id)
                              }
                              onDragEnd={() => setDraggedLesson(null)}
                            >
                              <div className={styles.lessonDragHandle}>☰</div>
                              <div className={styles.lessonInfo}>
                                <h4 className={styles.lessonTitle}>{lesson.title}</h4>
                                {lesson.videoUrl && (
                                  <span className={styles.lessonBadge}>📹 Has video</span>
                                )}
                                {lesson.resources?.length > 0 && (
                                  <span className={styles.lessonBadge}>
                                    📎 {lesson.resources.length} resources
                                  </span>
                                )}
                              </div>
                              <div className={styles.lessonActions}>
                                <button
                                  className={styles.actionButton}
                                  onClick={() => handleAddQuiz(lesson._id)}
                                  title="Add Quiz"
                                >
                                  ❓
                                </button>
                                <button
                                  className={styles.actionButton}
                                  onClick={() => handleEditLesson(lesson)}
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  className={styles.actionButton}
                                  onClick={() => handleDeleteLesson(lesson._id)}
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Render Quizzes for this Lesson */}
                            {
                              quizzes
                                .filter(q => q.lessonId === lesson._id)
                                .map(quiz => (
                                  <div key={quiz._id} className={styles.quizItem}>
                                    <div className={styles.quizInfo}>
                                      <span className={styles.quizIcon}>❓</span>
                                      <span className={styles.quizTitle}>{quiz.title}</span>
                                      <span className={styles.quizMeta}>{quiz.duration} min • {quiz.passingScore}% pass</span>
                                    </div>
                                    <div className={styles.quizActions}>
                                      <button
                                        className={styles.actionButton}
                                        onClick={() => handleEditQuiz(quiz)}
                                        title="Edit Quiz"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        className={styles.actionButton}
                                        onClick={() => handleDeleteQuiz(quiz._id)}
                                        title="Delete Quiz"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))
                            }
                          </React.Fragment>
                        ))}
                        <button
                          className={styles.addLessonButton}
                          onClick={() => handleAddLesson(chapter._id)}
                        >
                          + Add lesson
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Modal */}
      {
        showChapterModal && (
          <ChapterModal
            chapter={editingChapter}
            onSave={handleSaveChapter}
            onClose={() => {
              setShowChapterModal(false);
              setEditingChapter(null);
            }}
          />
        )
      }

      {/* Lesson Modal */}
      {
        showLessonModal && (
          <LessonModal
            lesson={editingLesson}
            chapterId={dragOverChapter || editingLesson?.chapterId}
            onSave={handleSaveLesson}
            onClose={() => {
              setShowLessonModal(false);
              setEditingLesson(null);
              setDragOverChapter(null);
            }}
            onUploadComplete={loadCourseData}
          />
        )
      }
    </div >
  );
};

// Chapter Modal Component
const ChapterModal = ({ chapter, onSave, onClose }) => {
  const [title, setTitle] = useState(chapter?.title || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toastService.error('Please enter chapter name');
      return;
    }

    setSaving(true);
    try {
      await onSave({ title: title.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{chapter ? 'Edit chapter' : 'Add new chapter'}</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Chapter name
              <span className={styles.required}>*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chapter name"
              required
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lesson Modal Component
const LessonModal = ({ lesson, chapterId, onSave, onClose, onUploadComplete }) => {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    content: lesson?.content || '',
    isPreview: lesson?.isPreview || false,
    resources: lesson?.resources || [],
  });
  const [newLink, setNewLink] = useState({ name: '', url: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingResources, setUploadingResources] = useState(false);
  const videoInputRef = useRef(null);
  const resourceInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastService.error('Please enter lesson title');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving lesson:', error);
      toastService.error('Unable to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toastService.error('Please select a video file');
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      toastService.error('Video size must not exceed 2GB');
      return;
    }

    if (!lesson?._id) {
      toastService.error('Please save the lesson before uploading video');
      return;
    }

    try {
      setUploadingVideo(true);
      const formDataUpload = new FormData();
      formDataUpload.append('video', file);

      await api.post(`/lessons/${lesson._id}/video`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toastService.success('Video uploaded successfully');
      if (onUploadComplete) {
        await onUploadComplete();
      }
      onClose();
    } catch (error) {
      console.error('Upload video error:', error);
      toastService.error('Unable to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAddLink = () => {
    if (!newLink.name || !newLink.url) return;

    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { ...newLink, type: 'link' }]
    }));
    setNewLink({ name: '', url: '' });
  };

  const handleRemoveResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleResourceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!lesson?._id) {
      toastService.error('Please save the lesson before uploading resources');
      return;
    }

    try {
      setUploadingResources(true);
      const formDataUpload = new FormData();
      files.forEach((file) => {
        formDataUpload.append('files', file);
      });

      const response = await api.post(`/lessons/${lesson._id}/resource`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Add uploaded files to local state
      const newResources = response.data.resources.map(res => ({
        name: res.filename || 'Resource', // Or use original name if available in response
        url: res.url,
        type: 'pdf', // Default to pdf/doc type as defined in backend logic (or derive from extension)
      }));

      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, ...newResources]
      }));

      toastService.success(`Successfully uploaded ${files.length} resources`);
      if (onUploadComplete) {
        // We DON'T call onUploadComplete here to reload everything yet, 
        // because we want the user to see the added resources in the list and then click Save.
        // OR we can rely on the fact that upload endpoint already saved them to Media? 
        // BUT we need to save them to Lesson.resources. So we just update local state here.
      }

      // Reset input
      if (resourceInputRef.current) resourceInputRef.current.value = '';

    } catch (error) {
      console.error('Upload resources error:', error);
      toastService.error('Unable to upload resources');
    } finally {
      setUploadingResources(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{lesson ? 'Edit lesson' : 'Add new lesson'}</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Lesson title
              <span className={styles.required}>*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter lesson title"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nội dung bài học</label>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, content: value }))
              }
              placeholder="Enter lesson content..."
              className={styles.quillEditor}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.isPreview}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isPreview: e.target.checked }))
                }
              />
              <span>Allow preview</span>
            </label>
          </div>

          {lesson?._id && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload video</label>
                <div className={styles.videoUploadContainer}>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className={styles.fileInput}
                    disabled={uploadingVideo}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                  >
                    {uploadingVideo ? 'Uploading...' : 'Choose Video File'}
                  </Button>
                  {lesson.videoUrl && (
                    <div className={styles.resourceItem}>
                      <span>📹 Current Video</span>
                      <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>View</a>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Resources</label>

                {/* Resource List */}
                <div className={styles.resourceList}>
                  {formData.resources.map((res, index) => (
                    <div key={index} className={styles.resourceItem}>
                      <span className={styles.resourceIcon}>
                        {res.type === 'link' ? '🔗' : '📄'}
                      </span>
                      <div className={styles.resourceInfo}>
                        <div className={styles.resourceName}>{res.name}</div>
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>{res.url}</a>
                      </div>
                      <button
                        type="button"
                        className={styles.removeResourceBtn}
                        onClick={() => handleRemoveResource(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Resource Actions */}
                <div className={styles.resourceActions}>
                  {/* File Upload */}
                  <div className={styles.uploadAction}>
                    <input
                      ref={resourceInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleResourceUpload}
                      style={{ display: 'none' }}
                      disabled={uploadingResources}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resourceInputRef.current?.click()}
                      disabled={uploadingResources}
                      size="sm"
                    >
                      {uploadingResources ? 'Uploading...' : '+ Upload File'}
                    </Button>
                  </div>

                  {/* Add Link */}
                  <div className={styles.linkAction}>
                    <div className={styles.linkInputs}>
                      <Input
                        placeholder="Resource Title"
                        value={newLink.name}
                        onChange={e => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                        size="sm"
                      />
                      <Input
                        placeholder="URL (https://...)"
                        value={newLink.url}
                        onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                        size="sm"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleAddLink}
                        disabled={!newLink.name || !newLink.url}
                      >
                        Add Link
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditor;

