import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './CommentForm.module.css';

const CommentForm = ({ onSubmit, onCancel, parentId = null, placeholder = "Write your reply..." }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    if (content.trim().length < 1 || content.trim().length > 2000) {
      alert('Comment must be between 1 and 2000 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), parentId);
      setContent('');
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Submit comment failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.loginPrompt}>
        <p>Please <a href="/login">log in</a> to comment.</p>
      </div>
    );
  }

  return (
    <form className={styles.commentForm} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <div className={styles.avatar}>
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user.fullName}</span>
        </div>
      </div>

      <div className={styles.formBody}>
        <textarea
          className="form-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={parentId ? 3 : 4}
          maxLength={2000}
          disabled={isSubmitting}
        />

        <div className={styles.formFooter}>
          <div className={styles.characterCount}>
            {content.length} / 2000
          </div>

          <div className={styles.formActions}>
            {onCancel && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary-student"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;