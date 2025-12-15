import React from 'react';
import { Link } from 'react-router-dom';

/**
 * CourseCard Component
 * Displays a course card with basic information
 */
export function CourseCard({ course }) {
    if (!course) return null;

    return (
        <div className="course-card">
            <Link to={`/courses/${course._id}`} className="course-card__link">
                {course.thumbnail && (
                    <div className="course-card__thumbnail">
                        <img src={course.thumbnail} alt={course.title} />
                    </div>
                )}
                <div className="course-card__content">
                    <h3 className="course-card__title">{course.title}</h3>
                    {course.description && (
                        <p className="course-card__description">{course.description}</p>
                    )}
                    {course.teacherId && (
                        <p className="course-card__teacher">
                            By {course.teacherId.fullName || 'Unknown'}
                        </p>
                    )}
                </div>
            </Link>
        </div>
    );
}

export default CourseCard;