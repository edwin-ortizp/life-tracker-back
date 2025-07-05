import { useState, useEffect, useCallback, useRef } from 'react';

interface UseHabitTimerProps {
  autoStart?: boolean;
}

export const useHabitTimer = ({ autoStart = true }: UseHabitTimerProps = {}) => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [baseElapsed, setBaseElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [h, m, s].map(t => String(t).padStart(2, '0'));
    return parts.join(':');
  }, []);

  const startTimer = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setStartTime(Date.now());
  }, []);

  const pauseTimer = useCallback(() => {
    if (isActive && !isPaused && startTime) {
      setIsPaused(true);
      const currentTime = Date.now();
      const sessionElapsed = Math.floor((currentTime - startTime) / 1000);
      setBaseElapsed(prev => prev + sessionElapsed);
    }
  }, [isActive, isPaused, startTime]);

  const resumeTimer = useCallback(() => {
    if (isActive && isPaused) {
      setIsPaused(false);
      setStartTime(Date.now());
    }
  }, [isActive, isPaused]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setIsPaused(false);
    setBaseElapsed(0);
    setStartTime(null);
    setTime(0);
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    if (autoStart) {
      setTimeout(() => startTimer(), 50);
    }
  }, [autoStart, startTimer, stopTimer]);

  // Update display time every second
  useEffect(() => {
    if (isActive && !isPaused && startTime) {
      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const sessionElapsed = Math.floor((currentTime - startTime) / 1000);
        setTime(baseElapsed + sessionElapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused, startTime, baseElapsed]);

  // Auto-start timer on mount if enabled
  useEffect(() => {
    if (autoStart) {
      startTimer();
    }
  }, [autoStart, startTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    time,
    isActive,
    isPaused,
    formattedTime: formatTime(time),
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  };
};