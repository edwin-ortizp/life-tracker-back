import { useState, useEffect, useCallback } from 'react';

interface UsePomodoroTimerProps {
  onComplete: (duration: number) => void;
  onCancel: (duration: number) => void;
}

export const usePomodoroTimer = ({ onComplete, onCancel }: UsePomodoroTimerProps) => {
  const POMODORO_DURATION = 1800; // 30 minutos en segundos
  const [time, setTime] = useState(POMODORO_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState<number | null>(null);
  
  useEffect(() => {
    let animationFrameId: number;
    
    const updateTimer = () => {
      if (!isActive || !startTimestamp) return;
      
      const now = Date.now();
      const elapsed = now - startTimestamp;
      const adjustedTime = pausedTime 
        ? POMODORO_DURATION - (elapsed / 1000 + (POMODORO_DURATION - pausedTime))
        : POMODORO_DURATION - (elapsed / 1000);
      
      if (adjustedTime <= 0) {
        setTime(0);
        setIsActive(false);
        setStartTimestamp(null);
        setPausedTime(null);
        onComplete(POMODORO_DURATION);
      } else {
        setTime(Math.max(0, adjustedTime));
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };
    
    if (isActive) {
      animationFrameId = requestAnimationFrame(updateTimer);
    }
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, startTimestamp, pausedTime, onComplete]);
  
  const startTimer = useCallback(() => {
    setIsActive(true);
    setStartTimestamp(Date.now());
    if (pausedTime) {
      // Si estaba pausado, ajustamos el timestamp inicial para continuar desde donde quedó
      const adjustedStartTime = Date.now() - ((POMODORO_DURATION - pausedTime) * 1000);
      setStartTimestamp(adjustedStartTime);
    }
  }, [pausedTime]);
  
  const pauseTimer = useCallback(() => {
    setIsActive(false);
    setPausedTime(time);
    if (startTimestamp) {
      const duration = POMODORO_DURATION - time;
      onCancel(duration);
    }
  }, [time, onCancel, startTimestamp]);
  
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTime(POMODORO_DURATION);
    setStartTimestamp(null);
    setPausedTime(null);
    if (startTimestamp) {
      const duration = POMODORO_DURATION - time;
      onCancel(duration);
    }
  }, [time, onCancel, startTimestamp]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    time,
    isActive,
    sessionStartTime: startTimestamp ? new Date(startTimestamp).toISOString() : null,
    formattedTime: formatTime(time),
    progress: ((POMODORO_DURATION - time) / POMODORO_DURATION) * 100,
    startTimer,
    pauseTimer,
    resetTimer
  };
};