import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCourses } from '../../contexts/CoursesContext';
import api from '../../services/api';
import toastService from '../../services/toastService';
import styles from './CourseManagement.module.css';

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    published: {
      label: 'Published',
      className: styles.statusPublished,
      icon: '✓',
    },
    draft: {
      label: 'Draft',
      className: styles.statusDraft,
      icon: '📝',
    },
    unpublished: {
      label: 'Unpublished',
      className: styles.statusUnpublished,
      icon: '⏸',
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`${styles.statusBadge} ${config.className}`}>
      <span className={styles.statusIcon}>{config.icon}</span>
      {config.label}
    </span>
  );
};

// Course Card Component
const CourseManagementCard = ({ course, onEdit, onDelete, onAnalytics, onPreview, isSelected, onSelect }) => {
  const studentCount = course.enrolledStudents?.length || 0;
  const status = course.isPublished ? 'published' : 'draft';

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`Are you sure you want to delete the course "${course.title || course.name}"?`)) {
      try {
        await api.delete(`/courses/${course._id || course.id}`);
        toastService.success('Course deleted successfully');
        onDelete?.(course._id || course.id);
      } catch (error) {
        console.error('Failed to delete course:', error);
        toastService.error('Unable to delete course. Please try again.');
      }
    }
  };

  return (
    <div className={`${styles.courseCard} ${isSelected ? styles.courseCardSelected : ''}`}>
      {/* Selection Checkbox */}
      {onSelect && (
        <div className={styles.cardCheckbox}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(course._id || course.id)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Course Image */}
      <div
        className={styles.cardImage}
        style={{ backgroundColor: course.color || '#ddd6fe' }}
      >
        {course.thumbnail && (
          <img src={course.thumbnail} alt={course.title || course.name} />
        )}
        <div className={styles.cardOverlay}>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Course Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>
          <Link to={`/courses/${course._id || course.id}`}>
            {course.title || course.name}
          </Link>
        </h3>

        {course.description && (
          <p className={styles.cardDescription}>
            {course.description.length > 100
              ? `${course.description.substring(0, 100)}...`
              : course.description}
          </p>
        )}

        {/* Course Stats */}
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statValue}>{studentCount}</span>
            <span className={styles.statLabel}>Students</span>
          </div>
          {course.rating && (
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⭐</span>
              <span className={styles.statValue}>
                {course.rating.average?.toFixed(1) || '0.0'}
              </span>
              <span className={styles.statLabel}>
                ({course.rating.count || 0} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Course Meta */}
        <div className={styles.cardMeta}>
          {course.category && (
            <span className={styles.metaTag}>{course.category}</span>
          )}
          {course.level && (
            <span className={styles.metaTag}>{course.level}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.cardActions}>
          <button
            className={`${styles.actionBtn} ${styles.previewBtn}`}
            onClick={(e) => {
              e.preventDefault();
              onPreview?.(course);
            }}
            title="Preview"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>

          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={(e) => {
              e.preventDefault();
              onEdit?.(course);
            }}
            title="Edit"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>

          <button
            className={`${styles.actionBtn} ${styles.analyticsBtn}`}
            onClick={(e) => {
              e.preventDefault();
              onAnalytics?.(course);
            }}
            title="Analytics"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </button>

          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            title="Delete"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CourseManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { myCourses, loading: coursesLoading } = useCourses();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [loading, setLoading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    if (!Array.isArray(myCourses)) return [];

    let filtered = [...myCourses];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          (course.title || course.name || '').toLowerCase().includes(term) ||
          (course.description || '').toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((course) => {
        if (statusFilter === 'published') return course.isPublished === true;
        if (statusFilter === 'draft') return course.isPublished === false;
        return true;
      });
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (course) => course.category === categoryFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'students': {
          const aCount = a.enrolledStudents?.length || 0;
          const bCount = b.enrolledStudents?.length || 0;
          return bCount - aCount;
        }
        case 'rating': {
          const aRating = a.rating?.average || 0;
          const bRating = b.rating?.average || 0;
          return bRating - aRating;
        }
        case 'title':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [myCourses, searchTerm, statusFilter, categoryFilter, sortBy]);

  // Get unique categories from courses
  const categories = useMemo(() => {
    if (!Array.isArray(myCourses)) return [];
    const cats = new Set();
    myCourses.forEach((course) => {
      if (course.category) cats.add(course.category);
    });
    return Array.from(cats).sort();
  }, [myCourses]);

  // Handle course actions
  const handleEdit = (course) => {
    navigate(`/courses/${course._id || course.id}/edit`);
  };

  const handleAnalytics = (course) => {
    navigate(`/courses/${course._id || course.id}/analytics`);
  };

  const handlePreview = (course) => {
    window.open(`/courses/${course._id || course.id}`, '_blank');
  };

  const handleDelete = () => {
    // Course will be removed from context automatically
    // Force refresh if needed
    window.location.reload();
  };

  // Handle course selection
  const handleSelectCourse = (courseId) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId);
      }
      return [...prev, courseId];
    });
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === filteredCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(filteredCourses.map((c) => c._id || c.id));
    }
  };

  // Bulk actions
  const handleBulkPublish = async () => {
    if (selectedCourses.length === 0) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedCourses.map((id) => api.put(`/courses/${id}/publish`))
      );
      toastService.success(`Published ${selectedCourses.length} courses`);
      setSelectedCourses([]);
      setShowBulkActions(false);
      window.location.reload();
    } catch {
      toastService.error('An error occurred while publishing courses');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCourses.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedCourses.length} courses?`)) {
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedCourses.map((id) => api.delete(`/courses/${id}`))
      );
      toastService.success(`Deleted ${selectedCourses.length} courses`);
      setSelectedCourses([]);
      setShowBulkActions(false);
      window.location.reload();
    } catch {
      toastService.error('An error occurred while deleting courses');
    } finally {
      setLoading(false);
    }
  };

  // Update showBulkActions when selection changes
  useEffect(() => {
    setShowBulkActions(selectedCourses.length > 0);
  }, [selectedCourses]);

  // Check if user is a teacher
  useEffect(() => {
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      toastService.error('Only teachers can access this page');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Early return if not a teacher
  if (user && user.role !== 'teacher' && user.role !== 'admin') {
    return null;
  }

  /**
   * Export courses data to CSV file
   * Includes: Title, Description, Status, Students, Category, Level, Created Date
   */
  const handleExportCourses = () => {
    try {
      // Prepare CSV data
      const csvData = [];

      // CSV Header
      csvData.push([
        'Title',
        'Description',
        'Status',
        'Students',
        'Category',
        'Level',
        'Created Date'
      ]);

      // Course data rows
      displayedCourses.forEach(course => {
        const title = (course.title || course.name || '').replace(/"/g, '""'); // Escape quotes
        const description = (course.description || '').replace(/"/g, '""').substring(0, 100); // Limit length
        const status = course.isPublished ? 'Published' : 'Draft';
        const studentCount = course.enrolledStudents?.length || 0;
        const category = course.category?.name || course.category || 'N/A';
        const level = course.level || 'N/A';
        const createdDate = course.createdAt
          ? new Date(course.createdAt).toLocaleDateString('en-US')
          : 'N/A';

        csvData.push([
          `"${title}"`,
          `"${description}"`,
          status,
          studentCount,
          category,
          level,
          createdDate
        ]);
      });

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');

      // Add BOM for UTF-8 encoding (Excel compatibility)
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create blob and download
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `courses_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastService.success(`Exported ${displayedCourses.length} courses successfully`);
    } catch (error) {
      console.error('[CourseManagement] Export error:', error);
      toastService.error('Unable to export data. Please try again.');
    }
  };

  const handleCreateCourse = () => {
    navigate('/courses/create');
  };

  // Loading state
  if (coursesLoading || loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Course Management</h1>
          <p className={styles.pageSubtitle}>
            Manage and track your courses
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.exportBtn}
            onClick={handleExportCourses}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export data
          </button>
          <button
            className={styles.createBtn}
            onClick={handleCreateCourse}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create new course
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className={styles.bulkActionsBar}>
          <div className={styles.bulkActionsInfo}>
            <span className={styles.bulkActionsCount}>
              Selected {selectedCourses.length} courses
            </span>
            <button
              className={styles.bulkActionsClear}
              onClick={() => setSelectedCourses([])}
            >
              Deselect all
            </button>
          </div>
          <div className={styles.bulkActionsButtons}>
            <button
              className={styles.bulkActionBtn}
              onClick={handleBulkPublish}
              disabled={loading}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Publish
            </button>
            <button
              className={`${styles.bulkActionBtn} ${styles.bulkActionBtnDanger}`}
              onClick={handleBulkDelete}
              disabled={loading}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
            <input
            type="text"
            className={styles.searchInput}
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.selectAllWrapper}>
          <label className={styles.selectAllLabel}>
            <input
              type="checkbox"
              checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
              onChange={handleSelectAll}
              className={styles.selectAllCheckbox}
            />
            <span>Select all</span>
          </label>
        </div>

        <div className={styles.filtersGroup}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="created">Created date</option>
            <option value="students">Students</option>
            <option value="rating">Rating</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Course Stats Summary */}
      <div className={styles.statsSummary}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{myCourses?.length || 0}</div>
            <div className={styles.statLabel}>Total courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✓</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {myCourses?.filter((c) => c.isPublished).length || 0}
            </div>
            <div className={styles.statLabel}>Published</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {myCourses?.filter((c) => !c.isPublished).length || 0}
            </div>
            <div className={styles.statLabel}>Drafts</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {myCourses?.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0) || 0}
            </div>
            <div className={styles.statLabel}>Total students</div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📚</div>
          <h3 className={styles.emptyTitle}>
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No courses found'
              : 'No courses yet'}
          </h3>
          <p className={styles.emptyDescription}>
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try changing filters or search keywords'
              : 'Start by creating your first course now'}
          </p>
          {(!searchTerm && statusFilter === 'all' && categoryFilter === 'all') && (
            <button className={styles.emptyActionBtn} onClick={handleCreateCourse}>
              Create new course
            </button>
          )}
        </div>
      ) : (
        <div className={styles.courseGrid}>
          {filteredCourses.map((course) => (
            <CourseManagementCard
              key={course._id || course.id}
              course={course}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAnalytics={handleAnalytics}
              onPreview={handlePreview}
              isSelected={selectedCourses.includes(course._id || course.id)}
              onSelect={handleSelectCourse}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseManagement;

