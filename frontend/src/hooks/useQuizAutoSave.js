import { useState, useEffect, useRef, useCallback } from 'react';
import quizService from '../services/quizService';

/**
 * Custom hook for auto-saving quiz answers
 * 
 * Features:
 * - Auto-save answers as user progresses
 * - Save to local state + backend periodically
 * - Handle connection loss gracefully
 * - Sync when connection restored
 * - Show save status indicator
 * 
 * @param {string} quizId - Quiz ID
 * @param {string} attemptId - Attempt ID
 * @param {number} saveInterval - Interval in milliseconds (default: 30000 = 30s)
 * @returns {Object} { answers, updateAnswer, saveStatus, syncAnswers, isOnline }
 */
const useQuizAutoSave = (quizId, attemptId, saveInterval = 30000) => {
  // Local answers state
  const [answers, setAnswers] = useState({});
  
  // Save status: 'idle' | 'saving' | 'saved' | 'error' | 'syncing'
  const [saveStatus, setSaveStatus] = useState('idle');
  
  // Connection status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Pending saves queue (when offline)
  const pendingSavesRef = useRef([]);
  
  // Last save timestamp
  const lastSaveRef = useRef(null);
  
  // Save timer ref
  const saveTimerRef = useRef(null);
  
  // Flag to prevent multiple simultaneous saves
  const isSavingRef = useRef(false);

  /**
   * Load saved answers from backend on mount
   */
  useEffect(() => {
    if (quizId && attemptId) {
      loadSavedAnswers();
    }
  }, [quizId, attemptId]);

  /**
   * Monitor online/offline status
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveStatus('syncing');
      // Sync pending saves when back online
      syncPendingSaves();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Auto-save timer
   */
  useEffect(() => {
    if (saveInterval > 0 && Object.keys(answers).length > 0) {
      saveTimerRef.current = setInterval(() => {
        saveAnswersToBackend();
      }, saveInterval);
    }

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(answers).length, saveInterval]);

  /**
   * Load saved answers from backend
   */
  const loadSavedAnswers = async () => {
    try {
      const savedData = await quizService.getSavedAnswers(quizId, attemptId);
      if (savedData && savedData.answers) {
        setAnswers(savedData.answers);
        setSaveStatus('saved');
      }
    } catch (error) {
      console.warn('Failed to load saved answers:', error);
      // Continue with empty answers - không block user
    }
  };

  /**
   * Update answer in local state
   * This triggers immediate local save and schedules backend save
   */
  const updateAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: answer };
      
      // Save to localStorage immediately
      saveToLocalStorage(newAnswers);
      
      // Schedule backend save (debounced)
      scheduleBackendSave(newAnswers);
      
      return newAnswers;
    });
    
    // Show saving indicator briefly
    setSaveStatus('saving');
  }, [quizId, attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Save answers to localStorage
   */
  const saveToLocalStorage = (answersToSave) => {
    try {
      const storageKey = `quiz_${quizId}_attempt_${attemptId}_answers`;
      localStorage.setItem(storageKey, JSON.stringify({
        answers: answersToSave,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  /**
   * Load answers from localStorage
   */
  const loadFromLocalStorage = () => {
    try {
      const storageKey = `quiz_${quizId}_attempt_${attemptId}_answers`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.answers || {};
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return {};
  };

  /**
   * Schedule backend save (debounced)
   */
  const scheduleBackendSave = (answersToSave) => {
    // Clear existing timer
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current);
    }

    // Save after a short delay (debounce)
    setTimeout(() => {
      saveAnswersToBackend(answersToSave);
    }, 2000); // 2 seconds debounce
  };

  /**
   * Save answers to backend
   */
  const saveAnswersToBackend = async (answersToSave = null) => {
    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      return;
    }

    const answersToSaveFinal = answersToSave || answers;

    // Skip if no answers to save
    if (!answersToSaveFinal || Object.keys(answersToSaveFinal).length === 0) {
      return;
    }

    // Check if online
    if (!navigator.onLine) {
      // Add to pending saves
      pendingSavesRef.current.push({
        answers: answersToSaveFinal,
        timestamp: Date.now()
      });
      setSaveStatus('error');
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      await quizService.saveAnswers(quizId, attemptId, answersToSaveFinal);
      
      // Success
      lastSaveRef.current = Date.now();
      setSaveStatus('saved');
      
      // Clear pending saves if any
      if (pendingSavesRef.current.length > 0) {
        pendingSavesRef.current = [];
      }
      
      // Clear after 2 seconds
      setTimeout(() => {
        if (saveStatus === 'saved') {
          setSaveStatus('idle');
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to save answers:', error);
      
      // Add to pending saves if network error
      if (!error.response || error.response.status >= 500) {
        pendingSavesRef.current.push({
          answers: answersToSaveFinal,
          timestamp: Date.now()
        });
        setSaveStatus('error');
      } else {
        // Other errors (validation, etc.) - show error but don't queue
        setSaveStatus('error');
      }
    } finally {
      isSavingRef.current = false;
    }
  };

  /**
   * Sync pending saves when connection restored
   */
  const syncPendingSaves = async () => {
    if (pendingSavesRef.current.length === 0) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('syncing');

    try {
      // Get the most recent pending save (contains all latest answers)
      const latestPending = pendingSavesRef.current[pendingSavesRef.current.length - 1];
      
      await quizService.saveAnswers(quizId, attemptId, latestPending.answers);
      
      // Clear all pending saves
      pendingSavesRef.current = [];
      lastSaveRef.current = Date.now();
      setSaveStatus('saved');
      
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to sync pending saves:', error);
      setSaveStatus('error');
    }
  };

  /**
   * Manual sync (triggered by user or component)
   */
  const syncAnswers = useCallback(async () => {
    // First, try to load from localStorage in case backend is outdated
    const localAnswers = loadFromLocalStorage();
    if (Object.keys(localAnswers).length > 0) {
      setAnswers(localAnswers);
    }

    // Then sync with backend
    await syncPendingSaves();
    await saveAnswersToBackend();
  }, [quizId, attemptId, answers]);

  /**
   * Get all answers (for submission)
   */
  const getAllAnswers = useCallback(() => {
    return answers;
  }, [answers]);

  /**
   * Clear saved answers (on quiz completion or reset)
   */
  const clearAnswers = useCallback(() => {
    setAnswers({});
    pendingSavesRef.current = [];
    
    // Clear localStorage
    try {
      const storageKey = `quiz_${quizId}_attempt_${attemptId}_answers`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }, [quizId, attemptId]);

  return {
    answers,
    updateAnswer,
    saveStatus,
    syncAnswers,
    isOnline,
    getAllAnswers,
    clearAnswers,
    lastSaveTime: lastSaveRef.current
  };
};

export default useQuizAutoSave;

