import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toastService from '../../services/toastService';
import styles from './CourseEditor.module.css';

const CourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    level: 'beginner',
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
  const [editingChapter, setEditingChapter] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  
  // Auto-save
  const autoSaveTimerRef = useRef(null);
  const lastSavedRef = useRef(null);
  const savingRef = useRef(false);
  
  const categories = ['Programming', 'Design', 'Business', 'Language', 'Other'];
  const levels = [
    { value: 'beginner', label: 'Cơ bản' },
    { value: 'intermediate', label: 'Trung bình' },
    { value: 'advanced', label: 'Nâng cao' },
  ];
  
  // Load course data
  const loadCourseData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load course details
      const courseRes = await api.get(`/courses/${courseId}`);
      const courseData = courseRes.data.data || courseRes.data;
      setCourse(courseData);
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        category: courseData.category || 'Other',
        level: courseData.level || 'beginner',
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
      
      // Expand first chapter by default
      if (chaptersWithLessons.length > 0) {
        setExpandedChapters(new Set([chaptersWithLessons[0]._id]));
      }
    } catch (error) {
      console.error('Load course error:', error);
      toastService.error('Không thể tải dữ liệu khóa học');
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
      
      await api.put(`/courses/${courseId}`, formData);
      
      lastSavedRef.current = currentData;
      setAutoSaveStatus('saved');
      
      // Upload thumbnail if changed
      if (thumbnailFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('thumbnail', thumbnailFile);
        await api.post(`/courses/${courseId}/thumbnail`, formDataUpload, {
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
      toastService.error('Vui lòng chọn file ảnh');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toastService.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }
    
    setThumbnailFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
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
        await api.put(`/chapters/${editingChapter._id}`, chapterData);
        toastService.success('Đã cập nhật chương');
      } else {
        await api.post('/chapters', { ...chapterData, courseId });
        toastService.success('Đã thêm chương mới');
      }
      await loadCourseData();
      setShowChapterModal(false);
    } catch (error) {
      console.error('Save chapter error:', error);
      toastService.error('Không thể lưu chương');
    }
  };
  
  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương này? Tất cả bài học trong chương cũng sẽ bị xóa.')) {
      return;
    }
    
    try {
      await api.delete(`/chapters/${chapterId}`);
      toastService.success('Đã xóa chương');
      await loadCourseData();
    } catch (error) {
      console.error('Delete chapter error:', error);
      toastService.error('Không thể xóa chương');
    }
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
        await api.put(`/lessons/${editingLesson._id}`, lessonData);
        toastService.success('Đã cập nhật bài học');
      } else {
        await api.post('/lessons', { ...lessonData, chapterId: dragOverChapter });
        toastService.success('Đã thêm bài học mới');
      }
      await loadCourseData();
      setShowLessonModal(false);
      setDragOverChapter(null);
    } catch (error) {
      console.error('Save lesson error:', error);
      toastService.error('Không thể lưu bài học');
    }
  };
  
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này?')) {
      return;
    }
    
    try {
      await api.delete(`/lessons/${lessonId}`);
      toastService.success('Đã xóa bài học');
      await loadCourseData();
    } catch (error) {
      console.error('Delete lesson error:', error);
      toastService.error('Không thể xóa bài học');
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
      await api.put('/chapters/reorder', { chapters: reorderedIds });
      
      toastService.success('Đã sắp xếp lại chương');
      await loadCourseData();
    } catch (error) {
      console.error('Reorder chapters error:', error);
      toastService.error('Không thể sắp xếp lại chương');
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
        await api.put(`/lessons/${draggedLessonId}`, {
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
            api.put(`/lessons/${lesson._id}`, { order: index + 1 })
          );
        });
      } else {
        // Different chapters
        updatedSourceLessons.forEach((lesson, index) => {
          updatePromises.push(
            api.put(`/lessons/${lesson._id}`, { order: index + 1 })
          );
        });
        updatedTargetLessons.forEach((lesson, index) => {
          updatePromises.push(
            api.put(`/lessons/${lesson._id}`, {
              order: index + 1,
              chapterId: targetChapterId,
            })
          );
        });
      }
      
      await Promise.all(updatePromises);
      
      toastService.success('Đã sắp xếp lại bài học');
      await loadCourseData();
    } catch (error) {
      console.error('Reorder lesson error:', error);
      toastService.error('Không thể sắp xếp lại bài học');
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
  
  // Publish course
  const handlePublish = async () => {
    try {
      setSaving(true);
      await api.put(`/courses/${courseId}/publish`);
      toastService.success('Đã xuất bản khóa học');
      await loadCourseData();
    } catch (error) {
      console.error('Publish error:', error);
      toastService.error(error.response?.data?.message || 'Không thể xuất bản khóa học');
    } finally {
      setSaving(false);
    }
  };
  
  // Check permissions
  useEffect(() => {
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      toastService.error('Chỉ giáo viên mới có thể truy cập trang này');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <Loading size="large" text="Đang tải dữ liệu..." />
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <h2>Không tìm thấy khóa học</h2>
          <Button onClick={() => navigate('/teacher/courses')}>Quay lại</Button>
        </div>
      </div>
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
            ← Quay lại
          </button>
          <h1 className={styles.title}>Chỉnh sửa khóa học</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.autoSaveStatus}>
            {autoSaveStatus === 'saving' && <span>Đang lưu...</span>}
            {autoSaveStatus === 'saved' && <span className={styles.saved}>Đã lưu</span>}
            {autoSaveStatus === 'error' && <span className={styles.error}>Lỗi lưu</span>}
          </div>
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
            Lưu bản nháp
          </Button>
          <Button variant="primary" onClick={handlePublish} disabled={saving || course.isPublished}>
            {course.isPublished ? 'Đã xuất bản' : 'Xuất bản'}
          </Button>
        </div>
      </div>
      
      <div className={styles.content}>
        {/* Left Panel - Course Details */}
        <div className={styles.leftPanel}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Thông tin khóa học</h2>
            
            <div className={styles.formGroup}>
              <Input
                name="title"
                label="Tiêu đề khóa học"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Nhập tiêu đề khóa học"
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Mô tả khóa học
                <span className={styles.required}>*</span>
              </label>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Nhập mô tả chi tiết về khóa học..."
                className={styles.quillEditor}
              />
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh mục
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
                  Cấp độ
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
              <label className={styles.label}>Ảnh bìa khóa học</label>
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
                  <p>Click để chọn ảnh</p>
                  <p className={styles.dropzoneHint}>JPG, PNG, GIF (tối đa 5MB)</p>
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
          </div>
        </div>
        
        {/* Right Panel - Course Structure */}
        <div className={styles.rightPanel}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Cấu trúc khóa học</h2>
              <Button variant="primary" size="small" onClick={handleAddChapter}>
                + Thêm chương
              </Button>
            </div>
            
            {chapters.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Chưa có chương nào. Hãy thêm chương đầu tiên!</p>
              </div>
            ) : (
              <div className={styles.chaptersList}>
                {chapters.map((chapter) => (
                  <div
                    key={chapter._id}
                    className={`${styles.chapterItem} ${
                      dragOverChapter === chapter._id ? styles.dragOver : ''
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
                          {chapter.lessons?.length || 0} bài học
                        </span>
                      </div>
                      <div className={styles.chapterActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleEditChapter(chapter)}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleDeleteChapter(chapter._id)}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    {expandedChapters.has(chapter._id) && (
                      <div className={styles.lessonsList}>
                        {chapter.lessons?.map((lesson) => (
                          <div
                            key={lesson._id}
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
                                <span className={styles.lessonBadge}>📹 Có video</span>
                              )}
                              {lesson.resources?.length > 0 && (
                                <span className={styles.lessonBadge}>
                                  📎 {lesson.resources.length} tài liệu
                                </span>
                              )}
                            </div>
                            <div className={styles.lessonActions}>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleEditLesson(lesson)}
                                title="Chỉnh sửa"
                              >
                                ✏️
                              </button>
                              <button
                                className={styles.actionButton}
                                onClick={() => handleDeleteLesson(lesson._id)}
                                title="Xóa"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          className={styles.addLessonButton}
                          onClick={() => handleAddLesson(chapter._id)}
                        >
                          + Thêm bài học
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
      {showChapterModal && (
        <ChapterModal
          chapter={editingChapter}
          onSave={handleSaveChapter}
          onClose={() => {
            setShowChapterModal(false);
            setEditingChapter(null);
          }}
        />
      )}
      
      {/* Lesson Modal */}
      {showLessonModal && (
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
      )}
    </div>
  );
};

// Chapter Modal Component
const ChapterModal = ({ chapter, onSave, onClose }) => {
  const [title, setTitle] = useState(chapter?.title || '');
  const [saving, setSaving] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toastService.error('Vui lòng nhập tên chương');
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
          <h3>{chapter ? 'Chỉnh sửa chương' : 'Thêm chương mới'}</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tên chương
              <span className={styles.required}>*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên chương"
              required
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
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
  });
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingResources, setUploadingResources] = useState(false);
  const videoInputRef = useRef(null);
  const resourceInputRef = useRef(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastService.error('Vui lòng nhập tên bài học');
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };
  
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      toastService.error('Vui lòng chọn file video');
      return;
    }
    
    if (file.size > 500 * 1024 * 1024) {
      toastService.error('Kích thước video không được vượt quá 500MB');
      return;
    }
    
    if (!lesson?._id) {
      toastService.error('Vui lòng lưu bài học trước khi upload video');
      return;
    }
    
    try {
      setUploadingVideo(true);
      const formDataUpload = new FormData();
      formDataUpload.append('video', file);
      
      await api.post(`/lessons/${lesson._id}/video`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toastService.success('Đã upload video thành công');
      if (onUploadComplete) {
        await onUploadComplete();
      }
      onClose();
    } catch (error) {
      console.error('Upload video error:', error);
      toastService.error('Không thể upload video');
    } finally {
      setUploadingVideo(false);
    }
  };
  
  const handleResourceUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (!lesson?._id) {
      toastService.error('Vui lòng lưu bài học trước khi upload tài liệu');
      return;
    }
    
    try {
      setUploadingResources(true);
      const formDataUpload = new FormData();
      files.forEach((file) => {
        formDataUpload.append('files', file);
      });
      
      await api.post(`/lessons/${lesson._id}/resource`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toastService.success(`Đã upload ${files.length} tài liệu thành công`);
      if (onUploadComplete) {
        await onUploadComplete();
      }
      onClose();
    } catch (error) {
      console.error('Upload resources error:', error);
      toastService.error('Không thể upload tài liệu');
    } finally {
      setUploadingResources(false);
    }
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{lesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tên bài học
              <span className={styles.required}>*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Nhập tên bài học"
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
              placeholder="Nhập nội dung bài học..."
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
              <span>Cho phép xem trước (Preview)</span>
            </label>
          </div>
          
          {lesson?._id && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload video</label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className={styles.fileInput}
                  disabled={uploadingVideo}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                >
                  {uploadingVideo ? 'Đang upload...' : 'Chọn video'}
                </Button>
                {lesson.videoUrl && (
                  <p className={styles.uploadedFile}>✓ Đã có video</p>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>Upload tài liệu</label>
                <input
                  ref={resourceInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleResourceUpload}
                  className={styles.fileInput}
                  disabled={uploadingResources}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resourceInputRef.current?.click()}
                  disabled={uploadingResources}
                >
                  {uploadingResources ? 'Đang upload...' : 'Chọn tài liệu'}
                </Button>
                {lesson.resources?.length > 0 && (
                  <p className={styles.uploadedFile}>
                    ✓ Đã có {lesson.resources.length} tài liệu
                  </p>
                )}
              </div>
            </>
          )}
          
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseEditor;

