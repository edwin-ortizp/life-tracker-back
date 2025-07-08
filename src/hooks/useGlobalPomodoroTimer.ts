// src/hooks/useGlobalPomodoroTimer.ts
import { useState, useEffect, useRef } from 'react';

const POMODORO_DURATION = 30 * 60; // 30 minutos en segundos
const STORAGE_KEY = 'active-pomodoro-timer';

interface StoredTimer {
  startTime: number;
  duration: number;
  isActive: boolean;
}

export const useGlobalPomodoroTimer = () => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Función para leer del localStorage
  const readFromStorage = (): StoredTimer | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed: StoredTimer = JSON.parse(stored);
      
      // Verificar si el timer ya terminó
      const elapsed = (Date.now() - parsed.startTime) / 1000;
      if (elapsed >= parsed.duration) {
        // Timer terminado, limpiar storage
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error reading pomodoro timer from localStorage:', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  // Función para calcular tiempo transcurrido
  const calculateElapsed = (startTime: number): number => {
    return Math.floor((Date.now() - startTime) / 1000);
  };

  // Función para calcular tiempo restante
  const calculateRemaining = (startTime: number, duration: number): number => {
    const elapsed = (Date.now() - startTime) / 1000;
    return Math.max(0, duration - elapsed);
  };

  // Función para formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Inicializar desde localStorage
  useEffect(() => {
    const stored = readFromStorage();
    if (stored) {
      setIsActive(true);
      setTime(calculateElapsed(stored.startTime));
    }
  }, []);

  // Manejar el interval para actualizar el tiempo
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const stored = readFromStorage();
        if (stored) {
          const elapsed = calculateElapsed(stored.startTime);
          setTime(elapsed);
          
          // Verificar si el timer terminó
          if (elapsed >= stored.duration) {
            setIsActive(false);
            setTime(0);
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          setIsActive(false);
          setTime(0);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  // Función para iniciar timer (llamada desde el componente Pomodoro)
  const startTimer = () => {
    const timerData: StoredTimer = {
      startTime: Date.now(),
      duration: POMODORO_DURATION,
      isActive: true
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timerData));
    setIsActive(true);
    setTime(0);
  };

  // Función para detener timer (llamada desde el componente Pomodoro)
  const stopTimer = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsActive(false);
    setTime(0);
  };

  // Escuchar cambios en localStorage (para sincronizar entre pestañas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const stored = readFromStorage();
        if (stored) {
          setIsActive(true);
          setTime(calculateElapsed(stored.startTime));
        } else {
          setIsActive(false);
          setTime(0);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    time, // tiempo transcurrido en segundos
    isActive,
    formattedTime: formatTime(time),
    startTimer,
    stopTimer
  };
};