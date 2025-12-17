import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import api from '../../services/api';
import toastService from '../../services/toastService';
import './AvatarUpload.css';

const AvatarUpload = ({ isOpen, onClose }) => {
    const { user, setUser } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (file) => {
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

        setSelectedFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    };

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
        handleFileSelect(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toastService.error('Please select an image');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', selectedFile);

            const response = await api.post('/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Update user in context
            const updatedUser = { ...user, avatar: response.data.avatar };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toastService.success('Avatar updated successfully!');
            handleClose();
        } catch (error) {
            toastService.error(error.message || 'Avatar update failed');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsDragging(false);
        onClose();
    };

    const handleRemovePreview = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const footer = (
        <>
            <Button variant="secondary" onClick={handleClose} disabled={uploading}>
                Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} disabled={uploading || !selectedFile}>
                {uploading ? 'Uploading...' : 'Upload'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Update Avatar"
            footer={footer}
            size="medium"
            closeOnOverlayClick={!uploading}
        >
            <div className="avatar-upload">
                {previewUrl ? (
                    <div className="avatar-preview-container">
                        <img src={previewUrl} alt="Preview" className="avatar-preview-image" />
                        <button
                            className="avatar-remove-button"
                            onClick={handleRemovePreview}
                            disabled={uploading}
                            aria-label="Remove image"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div
                        className={`avatar-dropzone ${isDragging ? 'avatar-dropzone--dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="avatar-dropzone-icon">📷</div>
                        <p className="avatar-dropzone-text">
                            Drag & drop an image here or click to select
                        </p>
                        <p className="avatar-dropzone-hint">
                            Formats: JPG, PNG, GIF (max 5MB)
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="avatar-file-input"
                    disabled={uploading}
                />

                {uploading && (
                    <div className="avatar-uploading-overlay">
                        <Loading size="large" text="Uploading image..." />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export { AvatarUpload };
