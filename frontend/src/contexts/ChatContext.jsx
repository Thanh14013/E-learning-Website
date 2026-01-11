import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import chatService from "../services/chatService";

const ChatContext = createContext(null);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        return {
            socket: null,
            isConnected: false,
            activeChats: [],
            minimizedChats: [],
            openChat: () => { },
            closeChat: () => { },
            minimizeChat: () => { },
            totalUnreadCount: 0,
            unreadCounts: {},
            onlineUsers: [],
            conversations: [],
            setConversations: () => { },
        };
    }
    return context;
};

export const ChatProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [activeChats, setActiveChats] = useState(() => {
        try {
            const saved = localStorage.getItem('activeChats');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [minimizedChats, setMinimizedChats] = useState(() => {
        try {
            const saved = localStorage.getItem('minimizedChats');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [conversations, setConversations] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Calculate total unread count from conversations
    const totalUnreadCount = conversations.reduce((total, convo) => {
        const myUnread = convo.unreadCounts?.[user?._id] || 0;
        return total + myUnread;
    }, 0);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('activeChats', JSON.stringify(activeChats));
    }, [activeChats]);

    useEffect(() => {
        localStorage.setItem('minimizedChats', JSON.stringify(minimizedChats));
    }, [minimizedChats]);

    const handleReceiveMessage = (message) => {
        if (!message) return;
        setConversations((prev) => {
            const idx = prev.findIndex((c) => c._id === message.conversationId);
            if (idx === -1) return prev;

            const updated = [...prev];
            const convo = { ...updated[idx] };
            convo.lastMessage = message;

            // Increment unread count when message not from me
            if (message.sender !== user?._id && message.sender?._id !== user?._id) {
                const currentUnread = convo.unreadCounts?.[user?._id] || 0;
                convo.unreadCounts = {
                    ...convo.unreadCounts,
                    [user?._id]: currentUnread + 1,
                };
            }

            updated[idx] = convo;
            return updated;
        });
    };

    // Preload conversations to drive unread badge
    useEffect(() => {
        if (!user || !token) {
            setConversations([]);
            return;
        }

        const loadConversations = async () => {
            try {
                const res = await chatService.getConversations();
                if (res.data?.success) {
                    setConversations(res.data.data || []);
                }
            } catch (error) {
                console.error("[ChatContext] Failed to preload conversations:", error);
            }
        };

        loadConversations();
    }, [user?._id, token]);

    useEffect(() => {
        let newSocket = null;

        if (token && user) {
            const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

            newSocket = io(`${socketUrl}/chat`, {
                auth: { token },
                query: { userId: user._id },
                transports: ["websocket", "polling"],
                reconnection: true,
            });

            newSocket.on("connect", () => {
                console.log("💬 Chat Socket Connected");
                setIsConnected(true);
            });

            newSocket.on("disconnect", () => {
                console.log("💬 Chat Socket Disconnected");
                setIsConnected(false);
            });

            newSocket.on("get_online_users", (users) => {
                setOnlineUsers(users);
            });

            newSocket.on("user_online", (userId) => {
                setOnlineUsers((prev) => {
                    const newSet = new Set(prev);
                    newSet.add(userId);
                    return Array.from(newSet);
                });
            });

            newSocket.on("user_offline", (userId) => {
                setOnlineUsers((prev) => prev.filter((id) => id !== userId));
            });

            newSocket.on("receive_message", (message) => {
                handleReceiveMessage(message);
            });

            setSocket(newSocket);
        } else {
            // Cleanup on logout
            if (activeChats.length > 0) setActiveChats([]);
            if (minimizedChats.length > 0) setMinimizedChats([]);
            if (conversations.length > 0) setConversations([]);
            setUnreadCounts({});
            setOnlineUsers([]);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setIsConnected(false);
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [token, user]);

    const markConversationRead = (conversationId) => {
        if (!conversationId || !user?._id) return;
        setConversations((prev) => prev.map((c) => {
            if (c._id !== conversationId) return c;
            const newUnread = { ...(c.unreadCounts || {}) };
            newUnread[user._id] = 0;
            return { ...c, unreadCounts: newUnread };
        }));
    };

    const openChat = (conversation) => {
        if (!activeChats.find(c => c._id === conversation._id)) {
            setActiveChats(prev => [...prev, conversation]);
            setMinimizedChats(prev => prev.filter(c => c._id !== conversation._id));
        }
        markConversationRead(conversation._id);
    };

    const closeChat = (conversationId) => {
        setActiveChats(prev => prev.filter(c => c._id !== conversationId));
        setMinimizedChats(prev => prev.filter(c => c._id !== conversationId));
    };

    const minimizeChat = (conversation) => {
        setActiveChats(prev => prev.filter(c => c._id !== conversation._id));
        if (!minimizedChats.find(c => c._id === conversation._id)) {
            setMinimizedChats(prev => [...prev, conversation]);
        }
    };

    return (
        <ChatContext.Provider
            value={{
                socket,
                isConnected,
                activeChats,
                minimizedChats,
                openChat,
                closeChat,
                minimizeChat,
                conversations,
                setConversations,
                unreadCounts,
                totalUnreadCount,
                onlineUsers,
                markConversationRead,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;
