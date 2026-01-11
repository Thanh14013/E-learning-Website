import React, { useEffect, useState } from 'react';
import chatService from '../../services/chatService';
import { useChat } from '../../contexts/ChatContext';
import styles from './ChatDropdown.module.css';

const ChatDropdown = ({ onClose }) => {
    const { openChat, socket, onlineUsers, conversations, setConversations, markConversationRead } = useChat();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    // Get user safely from localStorage
    let user = null;
    try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        user = userData?.user || userData;
    } catch (e) {
        console.error('Error parsing user:', e);
    }

    useEffect(() => {
        fetchConversations();
        // Socket listeners moved to ChatContext to ensure global updates
    }, [socket, user?._id]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await chatService.getConversations();
            if (res.data.success) {
                setConversations(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        if (query.trim().length > 1) {
            try {
                const res = await chatService.searchUsers(query);
                if (res.data.success) {
                    setSearchResults(res.data.data);
                }
            } catch (error) {
                console.error("Search error", error);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleStartChat = async (receiverId) => {
        try {
            const res = await chatService.startConversation(receiverId);
            if (res.data.success) {
                openChat(res.data.data);
                onClose();
            }
        } catch (error) {
            console.error("Start chat error", error);
        }
    };

    const handleOpenConversation = (convo) => {
        markConversationRead && markConversationRead(convo._id);
        openChat(convo);
        onClose();
    };

    const getPartner = (participants) => {
        const myId = user?._id;
        return participants?.find(p => p._id !== myId) || participants?.[0];
    };

    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const msgDate = new Date(date);
        const diff = now - msgDate;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return msgDate.toLocaleDateString();
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>Chats</h3>
            </div>

            {/* Search Input */}
            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search Messenger"
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            {/* Content List */}
            <div className={styles.list}>
                {/* Search Results */}
                {searchTerm && (
                    <div className="py-2">
                        <p className={styles.sectionTitle}>Suggested</p>
                        {searchResults.length > 0 ? (
                            searchResults.map(u => (
                                <button
                                    key={u._id}
                                    onClick={() => handleStartChat(u._id)}
                                    className={styles.item}
                                >
                                    <div className={styles.avatarContainer}>
                                        <div className="relative">
                                            {u.avatar ? (
                                                <img src={u.avatar} alt={u.fullName} className={styles.avatar} />
                                            ) : (
                                                <div className={styles.fallbackAvatar}>
                                                    {u.fullName?.charAt(0)?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.info}>
                                        <p className={styles.name}>{u.fullName}</p>
                                        <p className={styles.messagePreview}>{u.role}</p>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p className={styles.empty}>No users found</p>
                        )}
                    </div>
                )}

                {/* Conversation List */}
                {!searchTerm && (
                    <div>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                Loading...
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className={styles.empty}>
                                <p>No conversations yet.</p>
                                <p style={{ fontSize: '0.8em', marginTop: '5px' }}>Search for someone to start chatting</p>
                            </div>
                        ) : (
                            conversations
                                .sort((a, b) => {
                                    // Sort by Unread count (descending) then by Last Message Time (descending)
                                    const unreadA = (a.unreadCounts?.[user?._id] || 0) > 0 ? 1 : 0;
                                    const unreadB = (b.unreadCounts?.[user?._id] || 0) > 0 ? 1 : 0;

                                    if (unreadA !== unreadB) return unreadB - unreadA;

                                    return new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0);
                                })
                                .map(convo => {
                                    const partner = getPartner(convo.participants);
                                    const isUnread = (convo.unreadCounts?.[user?._id] || 0) > 0;
                                    const lastMsgFromMe = convo.lastMessage?.sender === user?._id;
                                    const isOnline = onlineUsers.includes(partner?._id);

                                    return (
                                        <button
                                            key={convo._id}
                                            onClick={() => handleOpenConversation(convo)}
                                            className={styles.item}
                                        >
                                            <div className={styles.avatarContainer}>
                                                <div className={styles.relativeWrapper}>
                                                    {partner?.avatar ? (
                                                        <img
                                                            src={partner.avatar}
                                                            alt={partner?.fullName}
                                                            className={styles.avatar}
                                                        />
                                                    ) : (
                                                        <div className={styles.fallbackAvatar}>
                                                            {partner?.fullName?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    {isOnline && <span className={styles.onlineDotList}></span>}
                                                </div>
                                            </div>

                                            <div className={styles.info}>
                                                <div className={styles.nameRow}>
                                                    <span className={`${styles.name} ${isUnread && !lastMsgFromMe ? styles.unread : ''}`}>
                                                        {partner?.fullName}
                                                    </span>
                                                    <span className={styles.time}>
                                                        {formatTime(convo.lastMessage?.createdAt)}
                                                    </span>
                                                </div>
                                                <div className={styles.messageRow}>
                                                    <span className={`${styles.messagePreview} ${isUnread && !lastMsgFromMe ? styles.unread : ''}`}>
                                                        {lastMsgFromMe && "You: "}
                                                        {convo.lastMessage?.content || "Started a chat"}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default ChatDropdown;