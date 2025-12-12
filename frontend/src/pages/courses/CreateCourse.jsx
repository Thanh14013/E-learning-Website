import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import api from '../../services/api';
import toastService from '../../services/toastService';
import { useAuth } from '../../contexts/AuthContext';
import styles from './CreateCourse.module.css';

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

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

  // Form errors
  const [errors, setErrors] = useState({});

  // Categories and levels
  const categories = ['Programming', 'Design', 'Business', 'Language', 'Other'];
  const levels = [
    { value: 'beginner', label: 'Cơ bản' },
    { value: 'intermediate', label: 'Trung bình' },
    { value: 'advanced', label: 'Nâng cao' },
  ];

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề khóa học là bắt buộc';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Tiêu đề phải có ít nhất 3 ký tự';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Mô tả không được vượt quá 2000 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle description change (rich text editor)
  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
    // Clear error when user types
    if (errors.description) {
      setErrors((prev) => ({
        ...prev,
        description: '',
      }));
    }
  };

  // Handle thumbnail file select
  const handleThumbnailSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toastService.error('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastService.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setThumbnailFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleThumbnailSelect(file);
  };

  // Handle drag and drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleThumbnailSelect(file);
  };

  // Remove thumbnail
  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateForm()) {
        return;
      }
      setCurrentStep(2);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle save as draft
  const handleSaveDraft = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/courses', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
      });

      const courseId = response.data.data._id;

      // Upload thumbnail if exists
      if (thumbnailFile && courseId) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);

        await api.post(`/courses/${courseId}/thumbnail`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toastService.success('Đã lưu khóa học dưới dạng bản nháp');
      navigate(`/dashboard`);
    } catch (error) {
      console.error('Create course error:', error);
      toastService.error(error.response?.data?.message || 'Tạo khóa học thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Handle publish
  const handlePublish = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create course
      const response = await api.post('/courses', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
      });

      const courseId = response.data.data._id;

      // Upload thumbnail if exists
      if (thumbnailFile && courseId) {
        const formData = new FormData();
        formData.append('thumbnail', thumbnailFile);

        await api.post(`/courses/${courseId}/thumbnail`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Publish course
      try {
        await api.put(`/courses/${courseId}/publish`);
        toastService.success('Đã tạo và xuất bản khóa học thành công!');
        navigate(`/dashboard`);
      } catch (publishError) {
        // If publish fails (e.g., no chapters/lessons), still show success for course creation
        const publishMessage = publishError.response?.data?.message || 'Không thể xuất bản khóa học';
        toastService.warning(`Đã tạo khóa học nhưng: ${publishMessage}. Vui lòng thêm chương và bài học trước khi xuất bản.`);
        navigate(`/dashboard`);
      }
    } catch (error) {
      console.error('Publish course error:', error);
      toastService.error(error.response?.data?.message || 'Xuất bản khóa học thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is teacher
  if (user && user.role !== 'teacher' && user.role !== 'admin') {
    return (
      <div className={styles.container}>
        <div className={`${styles.errorMessage} ${styles.errorMessageCentered}`}>
          <h2>Không có quyền truy cập</h2>
          <p>Chỉ giáo viên và quản trị viên mới có thể tạo khóa học.</p>
          <Button onClick={() => navigate('/dashboard')}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Tạo khóa học mới</h1>
        <p className={styles.stepIndicator}>
          Bước {currentStep} / {totalSteps}
        </p>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <div className={styles.formContainer}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h2>Thông tin cơ bản</h2>

            <div className={styles.formGroup}>
              <Input
                name="title"
                label="Tiêu đề khóa học"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Nhập tiêu đề khóa học"
                error={errors.title}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Mô tả khóa học
                <span className={styles.requiredAsterisk}>*</span>
              </label>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Nhập mô tả chi tiết về khóa học..."
                className={styles.quillEditor}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ color: [] }, { background: [] }],
                    ['link'],
                    ['clean'],
                  ],
                }}
              />
              {errors.description && (
                <span className={styles.error}>{errors.description}</span>
              )}
              {formData.description && (
                <p className={styles.charCount}>
                  {formData.description.replace(/<[^>]*>/g, '').length} / 2000 ký tự
                </p>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Danh mục
                  <span className={styles.requiredAsterisk}>*</span>
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
                  <span className={styles.requiredAsterisk}>*</span>
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
          </div>
        )}

        {/* Step 2: Thumbnail */}
        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h2>Ảnh bìa khóa học</h2>
            <p className={styles.stepDescription}>
              Tải lên ảnh bìa cho khóa học của bạn. Ảnh bìa sẽ giúp khóa học trở nên hấp dẫn hơn.
            </p>

            {thumbnailPreview ? (
              <div className={styles.thumbnailPreviewContainer}>
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className={styles.thumbnailPreview}
                />
                <button
                  className={styles.removeThumbnailButton}
                  onClick={handleRemoveThumbnail}
                  disabled={loading}
                  aria-label="Remove thumbnail"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                className={`${styles.thumbnailDropzone} ${
                  isDragging ? styles.thumbnailDropzoneDragging : ''
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropzoneIcon}>📷</div>
                <p className={styles.dropzoneText}>
                  Kéo thả ảnh vào đây hoặc click để chọn
                </p>
                <p className={styles.dropzoneHint}>
                  Định dạng: JPG, PNG, GIF (tối đa 5MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className={styles.fileInput}
              disabled={loading}
            />
          </div>
        )}

        {/* Navigation buttons */}
        <div className={styles.formActions}>
          {currentStep > 1 && (
            <Button variant="secondary" onClick={handlePrevious} disabled={loading}>
              Quay lại
            </Button>
          )}
          {currentStep < totalSteps ? (
            <Button variant="primary" onClick={handleNext} disabled={loading}>
              Tiếp theo
            </Button>
          ) : (
            <div className={styles.finalActions}>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu bản nháp'}
              </Button>
              <Button
                variant="primary"
                onClick={handlePublish}
                disabled={loading}
              >
                {loading ? 'Đang xuất bản...' : 'Xuất bản'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <Loading size="large" text="Đang xử lý..." />
        </div>
      )}
    </div>
  );
};

export default CreateCourse;
