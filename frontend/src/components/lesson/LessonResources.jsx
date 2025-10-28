import PropTypes from 'prop-types';
import styles from './LessonResources.module.css';

/**
 * LessonResources Component
 * Displays downloadable resources and attachments for a lesson
 * Supports various file types (PDF, PPT, DOC, ZIP, etc.)
 */
const LessonResources = ({ resources }) => {
    /**
     * Get file icon based on file type
     * @param {string} type - File type/extension
     * @returns {string} Icon emoji
     */
    const getFileIcon = (type) => {
        const iconMap = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            ppt: '📊',
            pptx: '📊',
            xls: '📈',
            xlsx: '📈',
            zip: '🗜️',
            rar: '🗜️',
            txt: '📃',
            mp3: '🎵',
            mp4: '🎬',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            code: '💻',
            link: '🔗'
        };

        return iconMap[type.toLowerCase()] || '📎';
    };

    /**
     * Get file type label
     * @param {string} type - File type/extension
     * @returns {string} File type label
     */
    const getFileTypeLabel = (type) => {
        return type.toUpperCase();
    };

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return 'Unknown size';

        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = (bytes / Math.pow(1024, i)).toFixed(2);

        return `${size} ${sizes[i]}`;
    };

    /**
     * Handle resource download
     * @param {Object} resource - Resource object
     */
    const handleDownload = (resource) => {
        // In production, this would trigger actual file download
        console.log('Downloading:', resource);

        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = resource.url;
        link.download = resource.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Handle resource preview
     * @param {Object} resource - Resource object
     */
    const handlePreview = (resource) => {
        // Open in new tab for preview
        window.open(resource.url, '_blank');
    };

    // Don't render if no resources
    if (!resources || resources.length === 0) {
        return null;
    }

    return (
        <div className={styles.resourcesContainer}>
            <h3 className={styles.resourcesTitle}>
                📚 Lesson Resources
            </h3>

            <p className={styles.resourcesDescription}>
                Download these materials to enhance your learning experience
            </p>

            <div className={styles.resourcesList}>
                {resources.map((resource, index) => (
                    <div key={resource.id || index} className={styles.resourceCard}>
                        {/* File icon */}
                        <div className={styles.resourceIcon}>
                            {getFileIcon(resource.type)}
                        </div>

                        {/* File info */}
                        <div className={styles.resourceInfo}>
                            <h4 className={styles.resourceName}>
                                {resource.name}
                            </h4>

                            <div className={styles.resourceMeta}>
                                <span className={styles.resourceType}>
                                    {getFileTypeLabel(resource.type)}
                                </span>
                                <span className={styles.resourceSeparator}>•</span>
                                <span className={styles.resourceSize}>
                                    {formatFileSize(resource.size)}
                                </span>
                            </div>

                            {resource.description && (
                                <p className={styles.resourceDescription}>
                                    {resource.description}
                                </p>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className={styles.resourceActions}>
                            {/* Preview button (for supported types) */}
                            {['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4'].includes(resource.type.toLowerCase()) && (
                                <button
                                    className={styles.actionButton}
                                    onClick={() => handlePreview(resource)}
                                    aria-label={`Preview ${resource.name}`}
                                    title="Preview"
                                >
                                    👁️
                                </button>
                            )}

                            {/* Download button */}
                            <button
                                className={`${styles.actionButton} ${styles.downloadButton}`}
                                onClick={() => handleDownload(resource)}
                                aria-label={`Download ${resource.name}`}
                                title="Download"
                            >
                                ⬇️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Download all button (if multiple resources) */}
            {resources.length > 1 && (
                <div className={styles.downloadAllContainer}>
                    <button
                        className={styles.downloadAllButton}
                        onClick={() => {
                            resources.forEach(resource => handleDownload(resource));
                        }}
                    >
                        ⬇️ Download All Resources
                    </button>
                </div>
            )}
        </div>
    );
};

LessonResources.propTypes = {
    resources: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            name: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            size: PropTypes.number,
            url: PropTypes.string.isRequired,
            description: PropTypes.string
        })
    )
};

export default LessonResources;
