// src/features/pomodoro/hooks/usePomodoroTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalPomodoroTimer } from '@/hooks/useGlobalPomodoroTimer';
import type { ActivePomodoro } from '../types';

const POMODORO_DURATION = 30 * 60; // 30 minutos en segundos

interface UsePomodoroTimerProps {
  onComplete: (duration: number) => void;
  onCancel: (duration: number) => void;
  selectedDate?: Date;
}

export const usePomodoroTimer = ({
  onComplete,
  onCancel,
  selectedDate: _selectedDate
}: UsePomodoroTimerProps) => {
  const { user } = useAuth();
  const [activePomodoro, setActivePomodoro] = useState<ActivePomodoro | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const animationFrameRef = useRef<number>();
  const isResetting = useRef(false);

  // Usar el hook global para el estado del timer
  const globalTimer = useGlobalPomodoroTimer();

  // Registrar callback de finalización en el hook global
  useEffect(() => {
    globalTimer.setOnCompletion((duration: number) => {
      console.log('Callback de finalización llamado, guardando sesión...');
      onComplete(duration);
    });
  }, [globalTimer, onComplete]);

  // Limpieza del timer
  const cleanupTimer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  // Reset del estado
  const resetState = useCallback(() => {
    if (isResetting.current) return;
    isResetting.current = true;

    cleanupTimer();
    globalTimer.stopTimer();
    setActivePomodoro(null);
    setIsStopping(false);

    setTimeout(() => {
      isResetting.current = false;
    }, 100);
  }, [cleanupTimer, globalTimer]);

  // Calcular tiempo restante
  const calculateRemaining = useCallback((startTimestamp: number): number => {
    const elapsed = (Date.now() - startTimestamp) / 1000;
    return Math.max(0, POMODORO_DURATION - elapsed);
  }, []);

  // Iniciar Pomodoro
  const startPomodoro = useCallback(async () => {
    if (!user || activePomodoro) return;

    const startTime = Date.now();
    const newPomodoro: ActivePomodoro = {
      startTime,
      deviceId: crypto.randomUUID(),
      pausedAt: null
    };

    setActivePomodoro(newPomodoro);
    globalTimer.startTimer();
  }, [user, activePomodoro, globalTimer]);

  // Detener Pomodoro
  const stopPomodoro = useCallback(async () => {
    if (!activePomodoro || isStopping) return;

    setIsStopping(true);
    const duration = Math.floor((Date.now() - activePomodoro.startTime) / 1000);

    try {
      // Llamar al callback de cancelación
      onCancel(duration);
    } finally {
      resetState();
    }
  }, [activePomodoro, isStopping, onCancel, resetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimer();
    };
  }, [cleanupTimer]);

  // Calculate current state
  const time = activePomodoro ? calculateRemaining(activePomodoro.startTime) : POMODORO_DURATION;
  const isActive = activePomodoro !== null;
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const formattedTime = formatTime(time);

  return {
    activePomodoro,
    startPomodoro,
    stopPomodoro,
    remainingTime: time,
    time,
    isActive,
    formattedTime,
    startTimer: startPomodoro,
    stopTimer: stopPomodoro
  };
};
