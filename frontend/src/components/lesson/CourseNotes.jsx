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
            } catch (error) {
                console.error('Error fetching notes:', error);
                toastService.error('Unable to load notes');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            toastService.error('Please enter note content');
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
            toastService.success('Note added');
        } catch (error) {
            toastService.error('Unable to add note');
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditNote = async (noteId) => {
        if (!editContent.trim()) {
            toastService.error('Please enter note content');
            return;
        }

        try {
            const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`, {
                content: editContent,
            });
            setNotes(notes.map((note) => (note._id === noteId ? response.data.note : note)));
            setEditingNoteId(null);
            setEditContent('');
            toastService.success('Note updated');
        } catch (error) {
            toastService.error('Unable to update note');
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            await api.delete(`/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`);
            setNotes(notes.filter((note) => note._id !== noteId));
            toastService.success('Note deleted');
        } catch (error) {
            toastService.error('Unable to delete note');
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
        return <Loading size="medium" text="Loading notes..." />;
    }

    return (
        <div className="course-notes">
            <Card title="Ghi chú của tôi">
                {/* Add Note Form */}
                <div className="notes-add-form">
                    <textarea
                        className="notes-textarea"
                        placeholder="Enter your note..."
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
                            {isAdding ? 'Adding...' : 'Add note'}
                        </button>
                    </div>
                </div>

                {/* Notes List */}
                <div className="notes-list">
                    {notes.length === 0 ? (
                        <p className="notes-empty">No notes yet. Add your first note!</p>
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
                                                Save
                                            </button>
                                            <button className="btn btn-secondary btn--small" onClick={cancelEdit}>
                                                Cancel
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
                                                {new Date(note.createdAt).toLocaleDateString('en-US')}
                                            </span>
                                        </div>
                                        <p className="note-content">{note.content}</p>
                                        <div className="note-actions">
                                            <button
                                                className="note-action-btn"
                                                onClick={() => startEdit(note)}
                                                aria-label="Edit note"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="note-action-btn note-action-btn--delete"
                                                onClick={() => handleDeleteNote(note._id)}
                                                aria-label="Delete note"
                                            >
                                                🗑️ Delete
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
