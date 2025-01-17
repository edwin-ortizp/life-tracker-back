// src/features/pomodoro/hooks/usePomodoroData.ts
import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { PomodoroData, PomodoroSession } from '../types';
import { createUTCTimestamp } from '@/utils/dates';

export const usePomodoroData = (selectedDate?: Date) => {
  const [data, setData] = useState<PomodoroData | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Obtener la fecha en formato YYYY-MM-DD
  const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];
  const date = selectedDate ? getFormattedDate(selectedDate) : getFormattedDate(new Date());

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setData(doc.data() as PomodoroData);
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

  const addManualSession = async () => {
    if (!user || !data) return;
  
    setStatus('saving');
    setError(null);
  
    try {
      const baseDate = selectedDate || new Date();
      const now = new Date();
      
      // Crear timestamps con offset UTC
      const endTime = createUTCTimestamp(baseDate, now.getHours(), now.getMinutes());
      const startTime = createUTCTimestamp(
        new Date(endTime.timestamp - 30 * 60 * 1000),
        new Date(endTime.timestamp - 30 * 60 * 1000).getHours(),
        new Date(endTime.timestamp - 30 * 60 * 1000).getMinutes()
      );
  
      const newSession: PomodoroSession = {
        startTime,
        endTime,
        duration: 30 * 60,
        completed: true
      };
  
      const updatedData: PomodoroData = {
        ...data,
        count: data.count + 1,
        sessions: [...data.sessions, newSession].sort((a, b) => 
          b.startTime.timestamp - a.startTime.timestamp
        ),
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

  const saveSession = async (duration: number, completed: boolean) => {
    if (!user || !data) return;

    setStatus('saving');
    setError(null);
    
    try {
      const baseDate = selectedDate || new Date();
      const now = new Date();
      
      // Crear timestamps con offset UTC
      const endTime = createUTCTimestamp(baseDate, now.getHours(), now.getMinutes());
      const startTime = createUTCTimestamp(
        new Date(endTime.timestamp - duration * 1000), 
        new Date(endTime.timestamp - duration * 1000).getHours(),
        new Date(endTime.timestamp - duration * 1000).getMinutes()
      );

      const newSession: PomodoroSession = {
        startTime,
        endTime,
        duration,
        completed
      };

      const updatedData: PomodoroData = {
        ...data,
        count: completed ? data.count + 1 : data.count,
        sessions: [...data.sessions, newSession],
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

  const updateCount = async (newCount: number) => {
    if (!user || !data) return;

    setStatus('saving');
    setError(null);

    try {
      const updatedData = {
        ...data,
        count: newCount,
        updatedAt: serverTimestamp()
      };

      const docRef = doc(db, 'pomodoro', `${user.uid}_${date}`);
      await setDoc(docRef, updatedData);
      setStatus('saved');
    } catch (error) {
      console.error('Pomodoro - Error al actualizar contador:', error);
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
        session => session.startTime !== sessionToDelete.startTime
      );

      const updatedCount = data.count - (sessionToDelete.completed ? 1 : 0);

      const updatedData = {
        ...data,
        sessions: updatedSessions,
        count: Math.max(0, updatedCount),
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
      // Si hay fechas actualizadas, convertirlas al nuevo formato
      const processedUpdate: Partial<PomodoroSession> = {
        ...updatedSession
      };
  
      if (updatedSession.startTime) {
        const startDate = new Date(updatedSession.startTime.timestamp);
        processedUpdate.startTime = createUTCTimestamp(
          startDate,
          startDate.getHours(),
          startDate.getMinutes()
        );
      }
  
      if (updatedSession.endTime) {
        const endDate = new Date(updatedSession.endTime.timestamp);
        processedUpdate.endTime = createUTCTimestamp(
          endDate,
          endDate.getHours(),
          endDate.getMinutes()
        );
      }
  
      const updatedSessions = data.sessions.map(session =>
        session.startTime.timestamp === oldSession.startTime.timestamp
          ? { ...session, ...processedUpdate }
          : session
      );
  
      const countDiff = 
        (oldSession.completed ? -1 : 0) + 
        (updatedSession.completed ? 1 : 0);
  
      const updatedData = {
        ...data,
        sessions: updatedSessions,
        count: Math.max(0, data.count + countDiff),
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
    updateCount,
    deleteSession,
    editSession,
    addManualSession
  };
};