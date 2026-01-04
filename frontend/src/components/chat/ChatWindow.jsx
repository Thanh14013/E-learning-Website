import React, { useEffect, useState, useRef } from "react";
import { useChat } from "../../contexts/ChatContext";
import chatService from "../../services/chatService";
import { useTypingDebounce } from "../../hooks/useTypingDebounce";
import { useAuth } from "../../contexts/AuthContext";
import { IoClose, IoRemove, IoSend, IoImageOutline } from "react-icons/io5";
import styles from './ChatWindow.module.css';
import { uploadFile } from '../../services/uploadService';

const ChatWindow = ({ conversation }) => {
    const { user: authUser } = useAuth();
    const { socket, closeChat, minimizeChat, onlineUsers } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Refs
    const bottomRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // Get current user safely
    const user = authUser || (() => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            return userData?.user || userData;
        } catch { return null; }
    })();

    const partner = conversation.participants?.find((p) => p._id !== user?._id) || conversation.participants?.[0];
    const isOnline = partner && onlineUsers.includes(partner._id);
    const handleTyping = useTypingDebounce(socket, conversation._id);

    // Fetch messages immediately when conversation opens
    useEffect(() => {
        if (conversation?._id) {
            fetchMessages(1);
        }
    }, [conversation._id]);

    // Handle Socket events separate from data fetching
    useEffect(() => {
        if (!socket || !conversation?._id) return;

        socket.emit("join_conversation", { conversationId: conversation._id });

        const handleReceiveMessage = (msg) => {
            if (msg.conversationId === conversation._id) {
                setMessages((prev) => {
                    // Prevent duplicates
                    if (prev.some(m => m._id === msg._id)) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
            }
        };

        const handleUserTyping = ({ conversationId, isTyping }) => {
            if (conversationId === conversation._id) {
                setIsPartnerTyping(isTyping);
                if (isTyping) scrollToBottom();
            }
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("user_typing", handleUserTyping);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
            socket.off("user_typing", handleUserTyping);
        };
    }, [conversation._id, socket]);

    const fetchMessages = async (pageNum = 1) => {
        try {
            const limit = pageNum === 1 ? 20 : 10;
            const res = await chatService.getMessages(conversation._id, pageNum, limit);
            if (res.data.success) {
                const newMessages = res.data.data;
                if (newMessages.length < limit) setHasMore(false);
                if (pageNum === 1) {
                    setMessages(newMessages);
                    scrollToBottom();
                } else {
                    setMessages(prev => [...newMessages, ...prev]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (!container || loadingMore || !hasMore) return;
        if (container.scrollTop === 0) {
            setLoadingMore(true);
            const oldHeight = container.scrollHeight;
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage).then(() => {
                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        const newHeight = messagesContainerRef.current.scrollHeight;
                        messagesContainerRef.current.scrollTop = newHeight - oldHeight;
                    }
                }, 0);
            });
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleImageSelect = () => fileInputRef.current?.click();
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setSelectedImage(file);
    };
    const removeImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !socket || isUploading) return;

        const content = newMessage;
        const imageToSend = selectedImage;
        setNewMessage("");
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        const tempMsg = {
            _id: Date.now(),
            content: content,
            attachments: imageToSend ? [{
                url: URL.createObjectURL(imageToSend),
                fileType: "image",
                originalName: imageToSend.name
            }] : [],
            sender: { _id: user._id, fullName: user.fullName, avatar: user.avatar },
            createdAt: new Date().toISOString(),
            status: "sending"
        };

        setMessages(prev => [...prev, tempMsg]);
        scrollToBottom();

        try {
            let uploadedAttachments = [];
            if (imageToSend) {
                setIsUploading(true);
                const uploadRes = await uploadFile(imageToSend);
                if (uploadRes.success) {
                    uploadedAttachments.push({
                        url: uploadRes.data.url,
                        fileType: "image",
                        originalName: uploadRes.data.originalName
                    });
                }
                setIsUploading(false);
            }

            socket.emit("send_message", {
                conversationId: conversation._id,
                content: content,
                attachments: uploadedAttachments
            }, (response) => {
                if (response.success) {
                    setMessages(prev => prev.map(m => m._id === tempMsg._id ? { ...response.message, sender: tempMsg.sender } : m));
                } else {
                    setMessages(prev => prev.map(m => m._id === tempMsg._id ? { ...m, status: "failed" } : m));
                }
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsUploading(false);
            setMessages(prev => prev.map(m => m._id === tempMsg._id ? { ...m, status: "failed" } : m));
        }
    };

    const onInputChange = (e) => {
        setNewMessage(e.target.value);
        handleTyping();
    };

    if (!user) return null;

    return (
        <div className={styles.window}>
            <div className={styles.header} onClick={() => minimizeChat(conversation)}>
                <div className={styles.headerLeft}>
                    <div className={styles.avatarWrapper}>
                        {partner?.avatar ? (
                            <img src={partner.avatar} alt={partner.fullName} className={styles.headerAvatar} />
                        ) : (
                            <div className={styles.fallbackAvatar}>
                                {partner?.fullName?.charAt(0)?.toUpperCase()}
                            </div>
                        )}
                        {isOnline && <span className={styles.onlineDotHeader}></span>}
                    </div>
                    <span className={styles.partnerName}>{partner?.fullName || "Chat"}</span>
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={(e) => { e.stopPropagation(); minimizeChat(conversation); }}
                        className={styles.actionBtn}
                        title="Minimize"
                    >
                        <IoRemove size={18} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); closeChat(conversation._id); }}
                        className={`${styles.actionBtn} ${styles.closeBtn}`}
                        title="Close"
                    >
                        <IoClose size={18} />
                    </button>
                </div>
            </div>

            <div
                className={styles.messagesArea}
                onScroll={handleScroll}
                ref={messagesContainerRef}
            >
                {loadingMore && <div className="text-center text-xs text-gray-500 py-2">Loading...</div>}
                <div className={styles.messageListSpacing}>
                    {messages.map((msg, index) => {
                        const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                        return (
                            <div key={index} className={`${styles.messageRow} ${isMe ? styles.myMessageRow : styles.partnerMessageRow}`}>
                                <div className={styles.messageContentWrapper}>
                                    {msg.attachments?.map((att, i) => (
                                        <div key={i} className={styles.imageConfig}>
                                            <img
                                                src={att.url}
                                                alt="attachment"
                                                className={styles.messageImage}
                                                onClick={() => window.open(att.url, '_blank')}
                                            />
                                        </div>
                                    ))}
                                    {msg.content && (
                                        <div className={`${styles.textBubble} ${isMe ? styles.myBubble : styles.partnerBubble}`}>
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {isPartnerTyping && (
                        <div className={styles.typingIndicator}>
                            <div className={styles.typingBubble}>
                                <span className={styles.dot}></span>
                                <span className={styles.dot}></span>
                                <span className={styles.dot}></span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {selectedImage && (
                <div className={styles.previewArea}>
                    <div className={styles.previewImageWrapper}>
                        <img
                            src={URL.createObjectURL(selectedImage)}
                            alt="preview"
                            className={styles.previewImage}
                        />
                        <button className={styles.removePreviewBtn} onClick={removeImage}>
                            <IoClose size={12} />
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.inputArea}>
                <form onSubmit={handleSend} className={styles.inputForm}>
                    <input
                        type="file"
                        accept="image/*"
                        multiple={false}
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    <button type="button" className={styles.iconBtn} onClick={handleImageSelect} disabled={isUploading}>
                        <IoImageOutline size={20} />
                    </button>
                    <div className={styles.inputWrapper}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={onInputChange}
                            placeholder="Aa"
                            className={styles.textInput}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                        className={styles.sendBtn}
                    >
                        <IoSend size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
