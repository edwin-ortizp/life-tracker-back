// usePomodoroData.ts
import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { PomodoroData, PomodoroSession } from '../types';
import { createFormattedTimestamp } from '@/utils/dates';

interface SaveSessionOptions {
  description?: string;
}

export const usePomodoroData = (selectedDate?: Date) => {
  const [data, setData] = useState<PomodoroData | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];
  const date = selectedDate ? getFormattedDate(selectedDate) : getFormattedDate(new Date());

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const pomodoroData = doc.data() as PomodoroData;
          const completedCount = pomodoroData.sessions.filter(s => s.completed).length;
          setData({
            ...pomodoroData,
            count: completedCount
          });
          setStatus('saved');
        } else {
          setData({
            userId: user.uid,
            date,
            count: 0,
            sessions: [],
            updatedAt: null
          });
          setStatus('idle');
        }
      },
      (error) => {
        console.error('Pomodoro - Error en snapshot:', error);
        setError(error.message);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, date]);

  const addManualSession = async (options: SaveSessionOptions = {}) => {
    if (!user || !data) return;
  
    setStatus('saving');
    setError(null);
  
    try {
      const baseDate = selectedDate || new Date();
      const now = new Date();
      
      const endTime = createFormattedTimestamp(
        baseDate,
        now.getHours(),
        now.getMinutes()
      );

      const startDate = new Date(now.getTime() - 30 * 60 * 1000);
      const startTime = createFormattedTimestamp(
        baseDate,
        startDate.getHours(),
        startDate.getMinutes()
      );
  
      // Creamos el objeto base de la sesión
      const newSession: PomodoroSession = {
        startTime: {
          timestamp: startTime.timestamp,
          utcOffset: startTime.utcOffset,
          formatted: startTime.formatted
        },
        endTime: {
          timestamp: endTime.timestamp,
          utcOffset: endTime.utcOffset,
          formatted: endTime.formatted
        },
        duration: 30 * 60,
        completed: true
      };

      // Solo agregamos description si existe y no está vacía
      if (options.description?.trim()) {
        newSession.description = options.description.trim();
      }

      const updatedSessions = [...data.sessions, newSession].sort((a, b) => 
        b.startTime.timestamp - a.startTime.timestamp
      );
  
      const updatedData: PomodoroData = {
        ...data,
        count: updatedSessions.filter(s => s.completed).length,
        sessions: updatedSessions,
        updatedAt: serverTimestamp()
      };
  
      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, updatedData);
      setStatus('saved');
    } catch (error) {
      console.error('Pomodoro - Error al agregar sesión manual:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const saveSession = async (duration: number, completed: boolean, options: SaveSessionOptions = {}) => {
    if (!user || !data) return;

    setStatus('saving');
    setError(null);
    
    try {
      const baseDate = selectedDate || new Date();
      const now = new Date();
      
      const endTime = createFormattedTimestamp(
        baseDate,
        now.getHours(),
        now.getMinutes()
      );
      
      const startDate = new Date(now.getTime() - duration * 1000);
      const startTime = createFormattedTimestamp(
        baseDate,
        startDate.getHours(),
        startDate.getMinutes()
      );

      // Creamos el objeto base de la sesión
      const newSession: PomodoroSession = {
        startTime: {
          timestamp: startTime.timestamp,
          utcOffset: startTime.utcOffset,
          formatted: startTime.formatted
        },
        endTime: {
          timestamp: endTime.timestamp,
          utcOffset: endTime.utcOffset,
          formatted: endTime.formatted
        },
        duration,
        completed
      };

      // Solo agregamos description si existe y no está vacía
      if (options.description?.trim()) {
        newSession.description = options.description.trim();
      }

      const updatedSessions = [...data.sessions, newSession];
      const completedCount = updatedSessions.filter(s => s.completed).length;

      const updatedData: PomodoroData = {
        ...data,
        count: completedCount,
        sessions: updatedSessions,
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, updatedData);
      setStatus('saved');
    } catch (error) {
      console.error('Pomodoro - Error al guardar:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const deleteSession = async (sessionToDelete: PomodoroSession) => {
    if (!user || !data) return;

    setStatus('saving');
    setError(null);

    try {
      const updatedSessions = data.sessions.filter(
        session => session.startTime.timestamp !== sessionToDelete.startTime.timestamp
      );

      const updatedData = {
        ...data,
        count: updatedSessions.filter(s => s.completed).length,
        sessions: updatedSessions,
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, updatedData);
      setStatus('saved');
    } catch (error) {
      console.error('Pomodoro - Error al eliminar sesión:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const editSession = async (
    oldSession: PomodoroSession,
    updatedSession: Partial<PomodoroSession>
  ) => {
    if (!user || !data) return;
  
    setStatus('saving');
    setError(null);
  
    try {
      const baseDate = new Date(oldSession.startTime.timestamp);
      
      let newStartTime = oldSession.startTime;
      let newEndTime = oldSession.endTime;
      
      if (updatedSession.startTime) {
        const startDate = new Date(updatedSession.startTime.timestamp);
        const formattedStart = createFormattedTimestamp(
          baseDate,
          startDate.getHours(),
          startDate.getMinutes()
        );
        newStartTime = {
          timestamp: formattedStart.timestamp,
          utcOffset: formattedStart.utcOffset,
          formatted: formattedStart.formatted
        };
      }
      
      if (updatedSession.endTime) {
        const endDate = new Date(updatedSession.endTime.timestamp);
        const formattedEnd = createFormattedTimestamp(
          baseDate,
          endDate.getHours(),
          endDate.getMinutes()
        );
        newEndTime = {
          timestamp: formattedEnd.timestamp,
          utcOffset: formattedEnd.utcOffset,
          formatted: formattedEnd.formatted
        };
      }
      
      const duration = (newEndTime.timestamp - newStartTime.timestamp) / 1000;
  
      const updatedSessions = data.sessions.map(session =>
        session.startTime.timestamp === oldSession.startTime.timestamp
          ? {
              ...session,
              startTime: newStartTime,
              endTime: newEndTime,
              duration,
              completed: updatedSession.completed ?? session.completed,
              ...(updatedSession.description?.trim() 
                ? { description: updatedSession.description.trim() } 
                : {})
            }
          : session
      );
  
      const updatedData = {
        ...data,
        count: updatedSessions.filter(s => s.completed).length,
        sessions: updatedSessions,
        updatedAt: serverTimestamp()
      };
  
      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, updatedData);
      setStatus('saved');
    } catch (error) {
      console.error('Pomodoro - Error al editar sesión:', error);
      setError(error instanceof Error ? error.message : 'Error al editar');
      setStatus('error');
    }
  };

  return {
    count: data?.count ?? 0,
    sessions: data?.sessions ?? [],
    status,
    error,
    saveSession,
    deleteSession,
    editSession,
    addManualSession
  };
};