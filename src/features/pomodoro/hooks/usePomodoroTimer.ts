import { useState, useEffect, useCallback } from 'react';

interface UsePomodoroTimerProps {
  onComplete: (duration: number) => void;
  onCancel: (duration: number) => void;
}

  export const usePomodoroTimer = ({ onComplete, onCancel }: UsePomodoroTimerProps) => {
    const [time, setTime] = useState(1800); // 25 minutes in seconds
    const [isActive, setIsActive] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  
    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isActive && time > 0) {
        interval = setInterval(() => setTime(t => t - 1), 1000);
      } else if (time === 0) {
        setIsActive(false);
        if (sessionStartTime) {
          onComplete(1800); // Pomodoro completado
        }
        setTime(1800);
        setSessionStartTime(null);
      }
      return () => clearInterval(interval);
    }, [isActive, time, onComplete, sessionStartTime]);
  
    const startTimer = useCallback(() => {
      setIsActive(true);
      setSessionStartTime(new Date().toISOString());
    }, []);
  
    const pauseTimer = useCallback(() => {
      setIsActive(false);
      if (sessionStartTime) {
        const duration = 1800 - time; // Duración hasta la pausa
        onCancel(duration);
        setSessionStartTime(null);
      }
    }, [time, onCancel, sessionStartTime]);
  
    const resetTimer = useCallback(() => {
      setIsActive(false);
      setTime(1800);
      if (sessionStartTime) {
        const duration = 1800 - time; // Duración hasta el reset
        onCancel(duration);
        setSessionStartTime(null);
      }
    }, [time, onCancel, sessionStartTime]);
  
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

  return {
    time,
    isActive,
    sessionStartTime,
    formattedTime: formatTime(time),
    progress: (time/1800)*100,
    startTimer,
    pauseTimer,
    resetTimer
  };
};