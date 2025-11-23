// src/hooks/useGlobalPomodoroTimer.ts
import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/features/pomodoro/hooks/useNotifications';

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
  const completionHandledRef = useRef(false);
  const onCompletionRef = useRef<((duration: number) => void) | null>(null);
  
  // Hook de notificaciones
  const { 
    preferences: notificationPrefs, 
    permission: notificationPermission, 
    sendNotification 
  } = useNotifications();

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


  // Función para formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Función para reproducir sonido de finalización
  const playCompletionSound = () => {
    if (!notificationPrefs.sound) return;
    
    try {
      // Crear un contexto de audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear un oscilador para generar el sonido
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configurar el oscilador
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Sonido de campanada agradable
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime + 0.2); // C5
      
      // Configurar el volumen
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      // Reproducir el sonido
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
      
      // Limpiar el contexto después de un tiempo
      setTimeout(() => {
        audioContext.close();
      }, 1000);
    } catch (error) {
    }
  };

  // Función para manejar la finalización del timer
  const handleTimerCompletion = () => {
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    
    // Primero notificar al hook de Firebase si está registrado
    if (onCompletionRef.current) {
      onCompletionRef.current(POMODORO_DURATION);
    }
    
    // Reproducir sonido
    playCompletionSound();
    
    // Enviar notificación si está habilitada
    if (notificationPrefs.enabled && notificationPermission === 'granted') {
      sendNotification('¡Pomodoro completado! 🎉', {
        body: 'Has completado exitosamente tu sesión de concentración',
        requireInteraction: true
      });
    }
    
    // Limpiar el estado local después de un delay para permitir el guardado
    setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY);
      setIsActive(false);
      setTime(0);
      completionHandledRef.current = false;
    }, 500);
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
            handleTimerCompletion();
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

  // Función para registrar callback de finalización
  const setOnCompletion = (callback: (duration: number) => void) => {
    onCompletionRef.current = callback;
  };

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
    completionHandledRef.current = false; // Resetear flag de finalización
  };

  // Función para detener timer (llamada desde el componente Pomodoro)
  const stopTimer = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsActive(false);
    setTime(0);
    completionHandledRef.current = false; // Resetear flag de finalización
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
    stopTimer,
    setOnCompletion
  };
};