import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatDropdown from './ChatDropdown';
import { FaFacebookMessenger } from 'react-icons/fa';
import styles from './MessengerIcon.module.css';

const MessengerIcon = () => {
    const { totalUnreadCount } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleChat = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.messengerWrapper} ref={dropdownRef}>
            {/* Icon Button using CSS Module */}
            <button
                onClick={toggleChat}
                className={`${styles.iconBtn} ${isOpen ? styles.active : ''}`}
                aria-label="Messages"
            >
                <FaFacebookMessenger size={20} />
                {totalUnreadCount > 0 && (
                    <span className={styles.badge}>
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel using CSS Module */}
            {isOpen && (
                <div className={styles.dropdownContainer}>
                    <ChatDropdown onClose={() => setIsOpen(false)} />
                </div>
            )}
        </div>
    );
};

export default MessengerIcon;