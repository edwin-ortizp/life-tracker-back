// src/features/pomodoro/hooks/usePomodoroTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { createFormattedTimestamp, getLocalDateString } from '@/utils/dates';
import type { ActivePomodoro } from '../types';

const DEVICE_ID = crypto.randomUUID();
const POMODORO_DURATION = 30 * 60; // 30 minutos en segundos

interface UsePomodoroTimerProps {
  onComplete: (duration: number) => void;
  onCancel: (duration: number) => void;
  selectedDate?: Date;
}

export const usePomodoroTimer = ({ 
  onComplete, 
  onCancel, 
  selectedDate 
}: UsePomodoroTimerProps) => {
  const { user } = useAuth();
  const [time, setTime] = useState(POMODORO_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [activePomodoro, setActivePomodoro] = useState<ActivePomodoro | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const animationFrameRef = useRef<number>();
  const isResetting = useRef(false);
  
  const date = selectedDate ? getLocalDateString(selectedDate) : getLocalDateString(new Date());

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
    setTime(POMODORO_DURATION);
    setIsActive(false);
    setActivePomodoro(null);
    setIsStopping(false);
    
    setTimeout(() => {
      isResetting.current = false;
    }, 100);
  }, [cleanupTimer]);

  // Calcular tiempo restante
  const calculateRemaining = useCallback((startTimestamp: number): number => {
    const elapsed = (Date.now() - startTimestamp) / 1000;
    return Math.max(0, POMODORO_DURATION - elapsed);
  }, []);

  // Efecto para manejar la actualización del timer
  useEffect(() => {
    if (!isActive || !activePomodoro || isStopping) {
      cleanupTimer();
      return;
    }

    const updateTimer = () => {
      const remaining = calculateRemaining(activePomodoro.startTime.timestamp);
      
      if (remaining <= 0) {
        cleanupTimer();
        if (activePomodoro.deviceId === DEVICE_ID) {
          onComplete(POMODORO_DURATION);
        }
        resetState();
        return;
      }

      setTime(remaining);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);

    return cleanupTimer;
  }, [isActive, activePomodoro, isStopping, calculateRemaining, cleanupTimer, resetState, onComplete]);

  // Efecto para la sincronización con Firebase
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (!doc.exists()) {
        resetState();
        return;
      }

      const data = doc.data();
      const currentPomodoro = data.activePomodoro;

      // Si no hay pomodoro activo o estamos deteniendo, resetear
      if (!currentPomodoro || isStopping) {
        resetState();
        return;
      }

      // Si el pomodoro es de otro dispositivo y no está activo, ignorar
      if (currentPomodoro.deviceId !== DEVICE_ID && !isActive) {
        return;
      }

      const remaining = calculateRemaining(currentPomodoro.startTime.timestamp);

      if (remaining <= 0) {
        setDoc(docRef, { activePomodoro: null }, { merge: true });
        if (currentPomodoro.deviceId === DEVICE_ID) {
          onComplete(POMODORO_DURATION);
        }
        resetState();
        return;
      }

      setActivePomodoro(currentPomodoro);
      setTime(remaining);
      setIsActive(true);
    });

    return () => {
      unsubscribe();
      cleanupTimer();
    };
  }, [user, date, isActive, isStopping, calculateRemaining, cleanupTimer, resetState, onComplete]);

  const startTimer = useCallback(async () => {
    if (!user || isActive) return;

    const now = new Date();
    const timestamp = createFormattedTimestamp(
      selectedDate || now,
      now.getHours(),
      now.getMinutes()
    );

    const newPomodoro: ActivePomodoro = {
      startTime: timestamp,
      duration: POMODORO_DURATION,
      deviceId: DEVICE_ID
    };

    try {
      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, { 
        activePomodoro: newPomodoro,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setIsActive(true);
      setIsStopping(false);
    } catch (error) {
      console.error('Error starting timer:', error);
      resetState();
    }
  }, [user, date, isActive, selectedDate, resetState]);

  const stopTimer = useCallback(async () => {
    if (!user || !activePomodoro || isStopping) return;

    try {
      setIsStopping(true);
      
      // Primero guardamos el documento actual
      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, { 
        activePomodoro: null,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Notificamos la cancelación con el tiempo actual
      const elapsedTime = POMODORO_DURATION - time;
      if (elapsedTime > 0) {
        onCancel(elapsedTime);
      }

      // Finalmente limpiamos todo el estado
      resetState();
    } catch (error) {
      console.error('Error stopping timer:', error);
      setIsStopping(false);
    }
  }, [user, date, activePomodoro, isStopping, time, onCancel, resetState]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    time,
    isActive,
    formattedTime: formatTime(time),
    startTimer,
    stopTimer
  };
};