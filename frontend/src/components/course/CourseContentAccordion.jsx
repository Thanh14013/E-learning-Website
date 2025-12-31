import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../pages/courses/courseDetail.module.css';
import { formatDuration, formatTotalMinutes } from '../../utils/formatters.js';


const CourseContentAccordion = ({ modules, courseId }) => {
    const [openModuleId, setOpenModuleId] = useState(modules[0]?._id || null);

    const toggleModule = (moduleId) => {
        setOpenModuleId(prevId => (prevId === moduleId ? null : moduleId));
    };

    // Icon cho từng loại bài học
    const LessonIcon = ({ type }) => {
        if (type === 'video') return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.804 8 5 4.633v6.734L10.804 8z" /></svg>;
        if (type === 'quiz') return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5a.5.5 0 0 1-.928.057l-8.5-8.5a.5.5 0 1 1 .708-.708l8.5 8.5L11.251.068z" /></svg>;
        return <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg>; // Default icon
    };

    return (
        <div className={styles.accordionContainer}>
            {modules.map((module, index) => {
                const totalDuration = formatTotalMinutes(
                    module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0)
                );
                const isOpen = openModuleId === module._id;

                return (
                    <div key={module._id} className={styles.accordionItem}>
                        <div className={styles.accordionHeader} onClick={() => toggleModule(module._id)}>
                            <span className={styles.accordionTitle}>
                                {isOpen ? (
                                    <svg className={styles.accordionIcon} width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" /></svg>
                                ) : (
                                    <svg className={styles.accordionIcon} width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" /></svg>
                                )}
                                {`Chapter ${index + 1}: ${module.title}`}
                            </span>
                            <span className={styles.moduleMeta}>{module.lessons.length} lectures • {totalDuration}</span>
                        </div>
                        {isOpen && (
                            <div className={styles.accordionContent}>
                                {module.lessons && module.lessons.length > 0 ? (
                                    module.lessons.map((lesson, lessonIndex) => (
                                        <Link
                                            to={`/courses/${courseId}/lessons/${lesson._id}`}
                                            key={lesson._id}
                                            className={styles.lessonItem}
                                        >
                                            <span className={styles.lessonTitle}>
                                                {`Lesson ${lessonIndex + 1}: ${lesson.title}`}
                                                {lesson.isPreview && <span className={styles.previewBadge}>Preview</span>}
                                            </span>
                                            <span className={styles.lessonDuration}>
                                                {formatDuration(lesson.duration)}
                                            </span>
                                        </Link>
                                    ))
                                ) : (
                                    <p className={styles.noLessons}>No lessons in this chapter</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CourseContentAccordion;