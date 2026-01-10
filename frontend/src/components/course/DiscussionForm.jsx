import { useState } from 'react';
import { useDiscussions } from '../../contexts/DiscussionContext.jsx';
import styles from './DiscussionForm.module.css';

const DiscussionForm = ({
  courseId,
  lessonId = null,
  discussionData = null,
  onSuccess,
  onCancel
}) => {
  const { createDiscussion, updateDiscussion } = useDiscussions();
  const isEditMode = !!discussionData;

  const [formData, setFormData] = useState({
    title: discussionData?.title || '',
    content: discussionData?.content || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title cannot exceed 200 characters';
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    } else if (formData.content.length > 5000) {
      newErrors.content = 'Content cannot exceed 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      let result;
      if (isEditMode) {
        result = await updateDiscussion(discussionData._id, {
          title: formData.title.trim(),
          content: formData.content.trim()
        });
      } else {
        result = await createDiscussion(courseId, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          lessonId: lessonId || null
        });
      }

      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.discussionForm} onSubmit={handleSubmit}>
      <h2>{isEditMode ? 'Edit Discussion' : 'Create New Discussion'}</h2>

      {/* Title Field */}
      <div className="form-group">
        <label htmlFor="title" className="form-label">
          Title <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          className={`form-input ${errors.title ? styles.inputError : ''}`}
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter discussion title..."
          maxLength={200}
          disabled={isSubmitting}
        />
        {errors.title && (
          <div className={styles.errorMessage}>{errors.title}</div>
        )}
        <div className={styles.characterCount}>
          {formData.title.length} / 200 characters
        </div>
      </div>

      {/* Content Field */}
      <div className="form-group">
        <label htmlFor="content" className="form-label">
          Content <span className={styles.required}>*</span>
        </label>
        <textarea
          id="content"
          name="content"
          className={`form-input ${errors.content ? styles.inputError : ''}`}
          value={formData.content}
          onChange={handleChange}
          placeholder="Write your discussion content here. You can ask questions, share ideas, or start a conversation with your classmates."
          rows={10}
          maxLength={5000}
          disabled={isSubmitting}
        />
        {errors.content && (
          <div className={styles.errorMessage}>{errors.content}</div>
        )}
        <div className={styles.characterCount}>
          {formData.content.length} / 5000 characters
        </div>
      </div>

      {/* Tips Section */}
      <div className={styles.tips}>
        <h4>💡 Tips for a great discussion:</h4>
        <ul>
          <li>Use a clear and descriptive title</li>
          <li>Provide context and details in your content</li>
          <li>Be respectful and constructive</li>
          <li>Check for similar discussions before posting</li>
        </ul>
      </div>

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary-student"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Discussion' : 'Create Discussion')
          }
        </button>
      </div>
    </form>
  );
};

export default DiscussionForm;