import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import api from "../services/api";

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

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('activeChats', JSON.stringify(activeChats));
    }, [activeChats]);

    useEffect(() => {
        localStorage.setItem('minimizedChats', JSON.stringify(minimizedChats));
    }, [minimizedChats]);

    const handleReceiveMessage = (message) => {
        console.log("[ChatContext] Global receive_message:", message);
        // Logic for global unread counts can go here if needed
    };

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

    const openChat = (conversation) => {
        if (!activeChats.find(c => c._id === conversation._id)) {
            setActiveChats(prev => [...prev, conversation]);
            setMinimizedChats(prev => prev.filter(c => c._id !== conversation._id));
        }
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
                onlineUsers
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export default ChatContext;
