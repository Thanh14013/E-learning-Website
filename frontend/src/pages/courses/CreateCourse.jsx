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
  // Categories and levels
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters';
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
      toastService.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toastService.error('Image size must not exceed 5MB');
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
      const response = await api.post('/teacher/courses', {
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

        await api.post(`/teacher/courses/${courseId}/thumbnail`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toastService.success('Course created! Now add your content.');
      navigate(`/teacher/courses/${courseId}/edit`);
    } catch (error) {
      console.error('Create course error:', error);
      toastService.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };



  // Check if user is teacher
  if (user && user.role !== 'teacher' && user.role !== 'admin') {
    return (
      <div className={styles.container}>
        <div className={`${styles.errorMessage} ${styles.errorMessageCentered}`}>
          <h2>Access denied</h2>
          <p>Only teachers and administrators can create courses.</p>
          <Button onClick={() => navigate('/dashboard')}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Create New Course</h1>
        <p className={styles.stepIndicator}>
          Step {currentStep} / {totalSteps}
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
            <h2>Basic Information</h2>

            <div className={styles.formGroup}>
              <Input
                name="title"
                label="Course title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter course title"
                error={errors.title}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Course Description
                <span className={styles.requiredAsterisk}>*</span>
              </label>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder="Enter detailed course description..."
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
                  {formData.description.replace(/<[^>]*>/g, '').length} / 2000 characters
                </p>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Category
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
                  Level
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
            <h2>Course thumbnail</h2>
            <p className={styles.stepDescription}>
              Upload a thumbnail for your course. A good thumbnail makes your course more appealing.
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
                className={`${styles.thumbnailDropzone} ${isDragging ? styles.thumbnailDropzoneDragging : ''
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.dropzoneIcon}>📷</div>
                <p className={styles.dropzoneText}>
                  Drag & drop an image here or click to choose
                </p>
                <p className={styles.dropzoneHint}>
                  Formats: JPG, PNG, GIF (max 5MB)
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
              Back
            </Button>
          )}
          {currentStep < totalSteps ? (
            <Button variant="primary" onClick={handleNext} disabled={loading}>
              Next
            </Button>
          ) : (
            <div className={styles.finalActions}>
              <Button
                variant="primary"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create & Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <Loading size="large" text="Processing..." />
        </div>
      )}
    </div>
  );
};

export default CreateCourse;
