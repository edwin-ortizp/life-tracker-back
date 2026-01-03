// src/features/pomodoro/hooks/usePomodoroData.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { PomodoroSession } from '../types';
import { createFormattedTimestamp, getLocalDateString } from '@/utils/dates';

interface SaveSessionOptions {
  description?: string;
}

export const usePomodoroData = (selectedDate?: Date) => {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const date = selectedDate ? getLocalDateString(selectedDate) : getLocalDateString(new Date());

  // Cargar datos de pomodoro
  const loadPomodoroData = async () => {
    if (!user) return;

    setStatus('pending');
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('start_time->timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      // Transformar a formato esperado
      const pomodoroSessions: PomodoroSession[] = (data || []).map(row => ({
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration,
        completed: row.completed,
        ...(row.description && { description: row.description })
      }));

      setSessions(pomodoroSessions);
      setCount(pomodoroSessions.filter(s => s.completed).length);
      setStatus('saved');
    } catch (error) {
      console.error('Pomodoro - Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Error loading pomodoro data');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadPomodoroData();
  }, [user, date]);

  const addManualSession = async (options: SaveSessionOptions = {}) => {
    if (!user) return;

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

      if (options.description?.trim()) {
        newSession.description = options.description.trim();
      }

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: user.id,
          date: date,
          start_time: newSession.startTime,
          end_time: newSession.endTime,
          duration: newSession.duration,
          completed: newSession.completed,
          description: newSession.description || null
        });

      if (insertError) throw insertError;

      // Reload data
      await loadPomodoroData();

      if (import.meta.env.DEV) {
        console.log('Manual pomodoro session added');
      }
    } catch (error) {
      console.error('Pomodoro - Error al agregar sesión manual:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const saveSession = async (duration: number, completed: boolean, options: SaveSessionOptions = {}) => {
    if (!user) return;

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

      if (options.description?.trim()) {
        newSession.description = options.description.trim();
      }

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: user.id,
          date: date,
          start_time: newSession.startTime,
          end_time: newSession.endTime,
          duration: newSession.duration,
          completed: newSession.completed,
          description: newSession.description || null
        });

      if (insertError) throw insertError;

      // Reload data
      await loadPomodoroData();

      if (import.meta.env.DEV) {
        console.log('Pomodoro session saved');
      }
    } catch (error) {
      console.error('Pomodoro - Error al guardar:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const deleteSession = async (sessionToDelete: PomodoroSession) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const previousSessions = sessions;

    // Optimistic update
    const updatedSessions = sessions.filter(
      session => session.startTime.timestamp !== sessionToDelete.startTime.timestamp
    );
    setSessions(updatedSessions);
    setCount(updatedSessions.filter(s => s.completed).length);

    try {
      const { error: deleteError } = await supabase
        .from('pomodoro_sessions')
        .delete()
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('start_time->timestamp', sessionToDelete.startTime.timestamp);

      if (deleteError) throw deleteError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Pomodoro session deleted');
      }
    } catch (error) {
      console.error('Pomodoro - Error al eliminar sesión:', error);
      // Rollback
      setSessions(previousSessions);
      setCount(previousSessions.filter(s => s.completed).length);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const editSession = async (
    oldSession: PomodoroSession,
    updatedSession: Partial<PomodoroSession>
  ) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const previousSessions = sessions;

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

      // Optimistic update
      const updatedSessions = sessions.map(session =>
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

      setSessions(updatedSessions);
      setCount(updatedSessions.filter(s => s.completed).length);

      // Update in Supabase
      const updateData: any = {
        start_time: newStartTime,
        end_time: newEndTime,
        duration: duration,
        completed: updatedSession.completed ?? oldSession.completed
      };

      if (updatedSession.description !== undefined) {
        updateData.description = updatedSession.description?.trim() || null;
      }

      const { error: updateError } = await supabase
        .from('pomodoro_sessions')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('start_time->timestamp', oldSession.startTime.timestamp);

      if (updateError) throw updateError;

      // Reload to ensure consistency
      await loadPomodoroData();

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Pomodoro session updated');
      }
    } catch (error) {
      console.error('Pomodoro - Error al editar sesión:', error);
      // Rollback
      setSessions(previousSessions);
      setCount(previousSessions.filter(s => s.completed).length);
      setError(error instanceof Error ? error.message : 'Error al editar');
      setStatus('error');
    }
  };

  return {
    count,
    sessions,
    status,
    error,
    saveSession,
    deleteSession,
    editSession,
    addManualSession,
    loadPomodoroData
  };
};
