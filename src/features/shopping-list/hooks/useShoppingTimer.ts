import { useState, useEffect, useRef } from 'react';

interface UseShoppingTimerProps {
  onComplete?: () => void;
}

export const useShoppingTimer = ({ onComplete }: UseShoppingTimerProps = {}) => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && !isPaused && startTime) {
      intervalRef.current = window.setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, startTime]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const startTimer = () => {
    const now = Date.now();
    setStartTime(now);
    setElapsedTime(0);
    setIsActive(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    if (startTime) {
      const now = Date.now();
      setStartTime(now - elapsedTime);
      setIsPaused(false);
    }
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setStartTime(null);
    setElapsedTime(0);
  };

  const completeSession = () => {
    stopTimer();
    onComplete?.();
  };

  return {
    formattedTime: formatTime(elapsedTime),
    elapsedTime,
    isActive,
    isPaused,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeSession,
  };
};