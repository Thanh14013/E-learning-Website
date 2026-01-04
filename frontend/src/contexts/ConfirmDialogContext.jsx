import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ConfirmDialog.module.css';

const ConfirmDialogContext = createContext(null);

export const useConfirm = () => {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmDialogProvider');
    }
    return context;
};

export const ConfirmDialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState({
        isOpen: false,
        message: '',
        title: 'Confirm Action',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        type: 'warning', // 'warning', 'danger', 'info'
    });

    // Using ref to store the current resolve/reject functions
    const promiseRef = useRef(null);

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve, reject) => {
            setDialog({
                isOpen: true,
                message,
                title: options.title || 'Confirm Action',
                confirmText: options.confirmText || 'Yes',
                cancelText: options.cancelText || 'Cancel',
                type: options.type || 'warning',
            });
            promiseRef.current = { resolve, reject };
        });
    }, []);

    const handleConfirm = () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        if (promiseRef.current) {
            promiseRef.current.resolve(true);
            promiseRef.current = null;
        }
    };

    const handleCancel = () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        if (promiseRef.current) {
            promiseRef.current.resolve(false);
            promiseRef.current = null;
        }
    };

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {dialog.isOpen && (
                    <div className={styles.overlay} onClick={handleCancel}>
                        <motion.div
                            className={styles.modal}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={`${styles.header} ${styles[dialog.type]}`}>
                                <h3>{dialog.title}</h3>
                            </div>
                            <div className={styles.body}>
                                <p>{dialog.message}</p>
                            </div>
                            <div className={styles.footer}>
                                <button className={styles.cancelBtn} onClick={handleCancel}>
                                    {dialog.cancelText}
                                </button>
                                <button className={`${styles.confirmBtn} ${styles[dialog.type]}`} onClick={handleConfirm}>
                                    {dialog.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmDialogContext.Provider>
    );
};
