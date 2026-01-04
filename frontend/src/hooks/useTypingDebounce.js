import { useRef, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';

export const useTypingDebounce = (socket, conversationId) => {
    const isTypingRef = useRef(false);

    // Function to emit "stopped typing"
    const stopTyping = useCallback(
        debounce(() => {
            if (isTypingRef.current && socket) {
                socket.emit('typing', { conversationId, isTyping: false });
                isTypingRef.current = false;
            }
        }, 1000), // 1s delay to stop typing status
        [socket, conversationId]
    );

    // Function to emit "typing" (throttled)
    const startTyping = useCallback(() => {
        if (!isTypingRef.current && socket) {
            socket.emit('typing', { conversationId, isTyping: true });
            isTypingRef.current = true;
        }
        // Always reset the stop timer on every keystroke
        stopTyping();
    }, [socket, conversationId, stopTyping]);

    // Cleanup on unmount or conversation change
    useEffect(() => {
        return () => {
            stopTyping.cancel();
            // Ensure we clear typing status if component unmounts
            if (isTypingRef.current && socket) {
                 socket.emit('typing', { conversationId, isTyping: false });
            }
        };
    }, [stopTyping, conversationId, socket]);

    return startTyping;
};
