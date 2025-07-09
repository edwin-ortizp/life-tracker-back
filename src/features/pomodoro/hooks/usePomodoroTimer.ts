// src/features/pomodoro/hooks/usePomodoroTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { createFormattedTimestamp, getLocalDateString } from '@/utils/dates';
import { useDebouncedFirestoreWrite } from '@/hooks/useDebouncedFirestoreWrite';
import { useGlobalPomodoroTimer } from '@/hooks/useGlobalPomodoroTimer';
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
  const [activePomodoro, setActivePomodoro] = useState<ActivePomodoro | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const animationFrameRef = useRef<number>();
  const isResetting = useRef(false);
  const lastWriteTimestamp = useRef<number>(0);
  
  // Usar el hook global para el estado del timer
  const globalTimer = useGlobalPomodoroTimer();
  
  const date = selectedDate ? getLocalDateString(selectedDate) : getLocalDateString(new Date());

  // Debounced write function para evitar escrituras excesivas
  const debouncedPomodoroWrite = useDebouncedFirestoreWrite(
    async (data: any) => {
      if (!user) return;
      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, data, { merge: true });
    },
    1000 // 1 segundo de debounce
  );

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

  // Efecto para detectar cuando el timer global termina
  useEffect(() => {
    if (!globalTimer.isActive && activePomodoro && !isStopping) {
      // El timer global terminó, completar la sesión
      if (activePomodoro.deviceId === DEVICE_ID) {
        onComplete(POMODORO_DURATION);
      }
      resetState();
    }
  }, [globalTimer.isActive, activePomodoro, isStopping, onComplete, resetState]);

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
      if (currentPomodoro.deviceId !== DEVICE_ID && !globalTimer.isActive) {
        return;
      }

      const remaining = calculateRemaining(currentPomodoro.startTime.timestamp);

      if (remaining <= 0) {
        // Prevenir escrituras duplicadas usando timestamp
        const now = Date.now();
        if (now - lastWriteTimestamp.current > 5000) { // 5 segundos mínimo entre escrituras
          lastWriteTimestamp.current = now;
          debouncedPomodoroWrite.debouncedWrite({ 
            activePomodoro: null, 
            updatedAt: serverTimestamp() 
          });
        }
        
        if (currentPomodoro.deviceId === DEVICE_ID) {
          onComplete(POMODORO_DURATION);
        }
        resetState();
        return;
      }

      setActivePomodoro(currentPomodoro);
      // Solo iniciar el timer global si no está ya activo
      if (!globalTimer.isActive) {
        globalTimer.startTimer();
      }
    });

    return () => {
      unsubscribe();
      cleanupTimer();
      debouncedPomodoroWrite.cleanup();
    };
  }, [user, date, globalTimer.isActive, isStopping, calculateRemaining, cleanupTimer, resetState, onComplete, debouncedPomodoroWrite]);

  const startTimer = useCallback(async () => {
    if (!user || globalTimer.isActive) return;

    const now = new Date();
    const timestampDetails = createFormattedTimestamp(
      selectedDate || now,
      now.getHours(),
      now.getMinutes()
    );

    const newPomodoro: ActivePomodoro = {
      startTime: timestampDetails,
      duration: POMODORO_DURATION,
      deviceId: DEVICE_ID
    };

    setActivePomodoro(newPomodoro);
    setIsStopping(false);
    
    // Iniciar el timer global
    globalTimer.startTimer();

    try {
      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(
        docRef,
        {
          userId: user.uid,
          date,
          activePomodoro: newPomodoro,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      
    } catch (error) {
      console.error('Error starting timer:', error);
      resetState();
    }
  }, [user, date, globalTimer.isActive, selectedDate, resetState, globalTimer]);

  const stopTimer = useCallback(async () => {
    if (!user || !activePomodoro || isStopping) return;

    try {
      setIsStopping(true);
      
      // Usar debounced write para evitar escrituras excesivas
      debouncedPomodoroWrite.debouncedWrite({ 
        activePomodoro: null,
        updatedAt: serverTimestamp()
      });

      // Notificamos la cancelación con el tiempo transcurrido del timer global
      const elapsedTime = globalTimer.time;
      if (elapsedTime > 0) {
        onCancel(elapsedTime);
      }

      // Finalmente limpiamos todo el estado
      resetState();
    } catch (error) {
      console.error('Error stopping timer:', error);
      setIsStopping(false);
    }
  }, [user, date, activePomodoro, isStopping, globalTimer.time, onCancel, resetState, debouncedPomodoroWrite]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return {
    time: POMODORO_DURATION - globalTimer.time, // tiempo restante para UI
    isActive: globalTimer.isActive,
    formattedTime: formatTime(POMODORO_DURATION - globalTimer.time),
    startTimer,
    stopTimer
  };
};