// src/features/task/hooks/useTaskTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { createFormattedTimestamp } from '@/utils/dates';
import { firestoreLogger } from '@/utils/firestore-logger';
import type { Task } from '../types';

interface UseTaskTimerProps {
  taskId: string;
  onComplete: (finalTime: number) => void;
}

export const useTaskTimer = ({ taskId, onComplete }: UseTaskTimerProps) => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [baseElapsed, setBaseElapsed] = useState(0);
  const [taskData, setTaskData] = useState<{ title: string; description: string } | null>(null);
  const intervalRef = useRef<number>();
  const saveIntervalRef = useRef<number>();
  const isUpdating = useRef(false);

  // Cleanup del timer y auto-save
  const cleanupTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = undefined;
    }
  }, []);

  // Calcular tiempo local
  const calculateLocalTime = useCallback(() => {
    if (!isActive) return baseElapsed;
    if (isPaused) return baseElapsed;
    if (!startTime) return baseElapsed;

    const currentTime = Date.now();
    const sessionElapsed = Math.floor((currentTime - startTime) / 1000);
    return baseElapsed + sessionElapsed;
  }, [isActive, isPaused, startTime, baseElapsed]);

  // Actualizar timer cada segundo (solo para display)
  useEffect(() => {
    if (!isActive || isPaused) {
      cleanupTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTime(calculateLocalTime());
    }, 1000) as unknown as number;

    return cleanupTimer;
  }, [isActive, isPaused, calculateLocalTime, cleanupTimer]);

  // Carga inicial de datos (solo una vez al montar)
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        firestoreLogger.logRead('tasks', 'useTaskTimer.loadTaskData', taskId);
        const docRef = doc(db, 'tasks', taskId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) return;
        
        const data = docSnapshot.data() as Task;
        
        setIsActive(data.timerActive || false);
        setIsPaused(data.timerPaused || false);
        setBaseElapsed(data.elapsedSeconds || 0);
        
        // Actualizar datos de la tarea
        setTaskData({
          title: data.title || '',
          description: data.description || ''
        });
        
        // Si el timer está activo, calcular el tiempo de inicio
        if (data.timerActive && !data.timerPaused && data.timerStartTime) {
          const currentTime = Date.now();
          const sessionElapsed = Math.floor((currentTime - data.timerStartTime.timestamp) / 1000);
          setStartTime(currentTime - (sessionElapsed * 1000));
          setTime(data.elapsedSeconds || 0);
        } else {
          setStartTime(null);
          setTime(data.elapsedSeconds || 0);
        }
      } catch (error) {
        console.error('Error loading task data:', error);
      }
    };

    loadTaskData();

    return cleanupTimer;
  }, [taskId, cleanupTimer]);

  // Guardar estado en Firebase cada 5 minutos (reducido de 30s para evitar escrituras excesivas)
  useEffect(() => {
    if (!isActive || isPaused || isUpdating.current) {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = undefined;
      }
      return;
    }

    saveIntervalRef.current = setInterval(async () => {
      try {
        const currentElapsed = calculateLocalTime();
        // Solo guardar si ha pasado tiempo significativo (más de 30 segundos desde la última actualización)
        if (currentElapsed - baseElapsed > 30) {
          firestoreLogger.logWrite('tasks', 'useTaskTimer.autoSave', taskId);
          await updateDoc(doc(db, 'tasks', taskId), {
            elapsedSeconds: currentElapsed
          });
          setBaseElapsed(currentElapsed);
        }
      } catch (error) {
        console.error('Error saving timer progress:', error);
      }
    }, 300000) as unknown as number; // 5 minutos para reducir escrituras excesivas

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = undefined;
      }
    };
  }, [isActive, isPaused, taskId, calculateLocalTime, baseElapsed]);

  // Iniciar timer
  const startTimer = useCallback(async () => {
    if (isActive || isUpdating.current) return;

    isUpdating.current = true;
    try {
      const now = Date.now();
      const nowDate = new Date();
      const firestoreTimestamp = createFormattedTimestamp(nowDate, nowDate.getHours(), nowDate.getMinutes());
      
      // Actualizar estado local inmediatamente
      setIsActive(true);
      setIsPaused(false);
      setStartTime(now);
      
      // Guardar en Firebase
      firestoreLogger.logWrite('tasks', 'useTaskTimer.startTimer', taskId);
      await updateDoc(doc(db, 'tasks', taskId), {
        timerStartTime: firestoreTimestamp,
        timerActive: true,
        timerPaused: false,
        pausedDuration: 0
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      // Revertir estado local si hay error
      setIsActive(false);
      setStartTime(null);
    } finally {
      isUpdating.current = false;
    }
  }, [isActive, taskId]);

  // Pausar timer
  const pauseTimer = useCallback(async () => {
    if (!isActive || isPaused || isUpdating.current) return;

    isUpdating.current = true;
    try {
      const currentElapsed = calculateLocalTime();
      
      // Actualizar estado local inmediatamente
      setIsPaused(true);
      setBaseElapsed(currentElapsed);
      
      // Guardar en Firebase
      firestoreLogger.logWrite('tasks', 'useTaskTimer.pauseTimer', taskId);
      await updateDoc(doc(db, 'tasks', taskId), {
        elapsedSeconds: currentElapsed,
        timerPaused: true
      });
    } catch (error) {
      console.error('Error pausing timer:', error);
      // Revertir estado local si hay error
      setIsPaused(false);
    } finally {
      isUpdating.current = false;
    }
  }, [isActive, isPaused, taskId, calculateLocalTime]);

  // Reanudar timer
  const resumeTimer = useCallback(async () => {
    if (!isActive || !isPaused || isUpdating.current) return;

    isUpdating.current = true;
    try {
      const now = Date.now();
      const nowDate = new Date();
      const firestoreTimestamp = createFormattedTimestamp(nowDate, nowDate.getHours(), nowDate.getMinutes());
      
      // Actualizar estado local inmediatamente
      setIsPaused(false);
      setStartTime(now);
      
      // Guardar en Firebase
      firestoreLogger.logWrite('tasks', 'useTaskTimer.resumeTimer', taskId);
      await updateDoc(doc(db, 'tasks', taskId), {
        timerStartTime: firestoreTimestamp,
        timerPaused: false
      });
    } catch (error) {
      console.error('Error resuming timer:', error);
      // Revertir estado local si hay error
      setIsPaused(true);
    } finally {
      isUpdating.current = false;
    }
  }, [isActive, isPaused, taskId]);

  // Detener timer
  const stopTimer = useCallback(async () => {
    if (!isActive || isUpdating.current) return;

    isUpdating.current = true;
    try {
      const finalTime = calculateLocalTime();
      
      // Actualizar estado local inmediatamente
      setIsActive(false);
      setIsPaused(false);
      setStartTime(null);
      setBaseElapsed(finalTime);
      setTime(finalTime);
      
      // Guardar en Firebase
      firestoreLogger.logWrite('tasks', 'useTaskTimer.stopTimer', taskId);
      await updateDoc(doc(db, 'tasks', taskId), {
        elapsedSeconds: finalTime,
        timerActive: false,
        timerPaused: false,
        timerStartTime: null
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      // Revertir estado local si hay error
      setIsActive(true);
    } finally {
      isUpdating.current = false;
    }
  }, [isActive, taskId, calculateLocalTime]);

  // Completar tarea
  const completeTask = useCallback(async () => {
    if (isUpdating.current) return;

    isUpdating.current = true;
    try {
      const finalTime = calculateLocalTime();
      
      // Actualizar estado local inmediatamente
      setIsActive(false);
      setIsPaused(false);
      setStartTime(null);
      setBaseElapsed(finalTime);
      setTime(finalTime);
      
      // Guardar en Firebase
      firestoreLogger.logWrite('tasks', 'useTaskTimer.completeTask', taskId);
      await updateDoc(doc(db, 'tasks', taskId), {
        completed: true,
        elapsedSeconds: finalTime,
        timerActive: false,
        timerPaused: false,
        timerStartTime: null,
        progress: 100
      });
      
      onComplete(finalTime);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      isUpdating.current = false;
    }
  }, [taskId, calculateLocalTime, onComplete]);

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [h, m, s].map(t => String(t).padStart(2, '0'));
    return parts.join(':');
  };

  return {
    time,
    isActive,
    isPaused,
    formattedTime: formatTime(time),
    taskData,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeTask
  };
};