import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatWindow from './ChatWindow';
import styles from './ChatManager.module.css';

const ChatManager = () => {
    const { activeChats, minimizedChats, openChat } = useChat();

    // Safety check
    // Safety check
    if (!activeChats) return null;

    return (
        <div className={styles.chatManagerContainer}>
            {/* Minimized Chat Bubbles - On the left */}
            {minimizedChats && minimizedChats.length > 0 && (
                <div className={styles.minimizedStack}>
                    {minimizedChats.map(chat => {
                        // Get partner info safely
                        const userStr = localStorage.getItem('user');
                        let currentUserId = null;
                        try {
                            const userData = JSON.parse(userStr);
                            currentUserId = userData?.user?._id || userData?._id;
                        } catch (e) {
                            console.error('Error parsing user:', e);
                        }

                        const partner = chat.participants?.find(p => p._id !== currentUserId) || chat.participants?.[0];

                        return (
                            <div
                                key={chat._id}
                                onClick={() => openChat(chat)}
                                className={styles.minimizedBubble}
                                title={partner?.fullName || "Open chat"}
                            >
                                <img
                                    src={partner?.avatar || "https://via.placeholder.com/48"}
                                    className={styles.bubbleImage}
                                    alt="chat"
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Active Chat Windows - Stack from left to right */}
            <div className={styles.activeWindows}>
                {activeChats.map((conversation) => (
                    <div key={conversation._id}>
                        <ChatWindow conversation={conversation} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatManager;