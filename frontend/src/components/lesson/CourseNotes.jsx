import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import api from '../../services/api';
import toastService from '../../services/toastService';
import './CourseNotes.css';

const CourseNotes = ({ lessonId, videoTimestamp }) => {
    const { courseId } = useParams();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (lessonId) {
            fetchNotes();
        }
    }, [lessonId]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/notes`);
            setNotes(response.data.notes || []);
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            toastService.error('Vui lòng nhập nội dung ghi chú');
            return;
        }

        setIsAdding(true);
        try {
            const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/notes`, {
                content: newNote,
                timestamp: videoTimestamp || 0,
            });
            setNotes([response.data.note, ...notes]);
            setNewNote('');
            toastService.success('Đã thêm ghi chú');
        } catch (error) {
            toastService.error('Không thể thêm ghi chú');
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditNote = async (noteId) => {
        if (!editContent.trim()) {
            toastService.error('Vui lòng nhập nội dung ghi chú');
            return;
        }

        try {
            const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`, {
                content: editContent,
            });
            setNotes(notes.map((note) => (note._id === noteId ? response.data.note : note)));
            setEditingNoteId(null);
            setEditContent('');
            toastService.success('Đã cập nhật ghi chú');
        } catch (error) {
            toastService.error('Không thể cập nhật ghi chú');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Bạn có chắc muốn xóa ghi chú này?')) {
            return;
        }

        try {
            await api.delete(`/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`);
            setNotes(notes.filter((note) => note._id !== noteId));
            toastService.success('Đã xóa ghi chú');
        } catch (error) {
            toastService.error('Không thể xóa ghi chú');
        }
    };

    const formatTimestamp = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const startEdit = (note) => {
        setEditingNoteId(note._id);
        setEditContent(note.content);
    };

    const cancelEdit = () => {
        setEditingNoteId(null);
        setEditContent('');
    };

    if (loading) {
        return <Loading size="medium" text="Đang tải ghi chú..." />;
    }

    return (
        <div className="course-notes">
            <Card title="Ghi chú của tôi">
                {/* Add Note Form */}
                <div className="notes-add-form">
                    <textarea
                        className="notes-textarea"
                        placeholder="Nhập ghi chú của bạn..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows="3"
                    />
                    <div className="notes-add-footer">
                        {videoTimestamp !== undefined && (
                            <span className="notes-timestamp-badge">
                                📍 {formatTimestamp(videoTimestamp)}
                            </span>
                        )}
                        <button
                            className="btn btn-primary-student"
                            onClick={handleAddNote}
                            disabled={isAdding}
                        >
                            {isAdding ? 'Đang thêm...' : 'Thêm ghi chú'}
                        </button>
                    </div>
                </div>

                {/* Notes List */}
                <div className="notes-list">
                    {notes.length === 0 ? (
                        <p className="notes-empty">Chưa có ghi chú nào. Hãy thêm ghi chú đầu tiên!</p>
                    ) : (
                        notes.map((note) => (
                            <div key={note._id} className="note-item">
                                {editingNoteId === note._id ? (
                                    <div className="note-edit-form">
                                        <textarea
                                            className="notes-textarea"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows="3"
                                        />
                                        <div className="note-edit-actions">
                                            <button
                                                className="btn btn-primary-student btn--small"
                                                onClick={() => handleEditNote(note._id)}
                                            >
                                                Lưu
                                            </button>
                                            <button className="btn btn-secondary btn--small" onClick={cancelEdit}>
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="note-header">
                                            {note.timestamp > 0 && (
                                                <span className="note-timestamp">{formatTimestamp(note.timestamp)}</span>
                                            )}
                                            <span className="note-date">
                                                {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <p className="note-content">{note.content}</p>
                                        <div className="note-actions">
                                            <button
                                                className="note-action-btn"
                                                onClick={() => startEdit(note)}
                                                aria-label="Edit note"
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                className="note-action-btn note-action-btn--delete"
                                                onClick={() => handleDeleteNote(note._id)}
                                                aria-label="Delete note"
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};

export { CourseNotes };
