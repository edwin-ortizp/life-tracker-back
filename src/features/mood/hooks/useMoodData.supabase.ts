// src/features/mood/hooks/useMoodData.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString, createFormattedTimestamp } from '@/utils/dates';
import type { MoodEntry } from '../types';
import { useMoodStates } from './useMoodStates';

export const useMoodData = (selectedDate: Date) => {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { getMoodValue } = useMoodStates();

  // Cargar datos de mood
  const loadMoodData = async () => {
    if (!user) return;

    try {
      setStatus('pending');
      const dateString = getLocalDateString(selectedDate);

      const { data, error: fetchError } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateString)
        .order('timestamp', { ascending: true });

      if (fetchError) throw fetchError;

      // Transformar a formato esperado
      const moods: MoodEntry[] = (data || []).map(row => ({
        emoji: row.emoji,
        text: row.text,
        value: row.value,
        time: row.time,
        timestamp: row.timestamp
      }));

      setMoodHistory(moods);
      setStatus('saved');
    } catch (error) {
      console.error('Error loading mood data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar estado de ánimo');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadMoodData();
  }, [user, selectedDate]);

  const addMood = async (mood: { emoji: string; text: string }) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);

    // Save previous state for rollback
    const previousState = moodHistory;

    try {
      const now = new Date();
      const formattedTimestamp = createFormattedTimestamp(
        selectedDate,
        now.getHours(),
        now.getMinutes()
      );

      const newMoodEntry: MoodEntry = {
        emoji: mood.emoji,
        text: mood.text,
        timestamp: formattedTimestamp.timestamp,
        time: now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        value: getMoodValue(mood.text)
      };

      // Optimistic update
      const updatedMoods = [...moodHistory, newMoodEntry];
      setMoodHistory(updatedMoods);
      setStatus('saved');

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          date: dateString,
          emoji: newMoodEntry.emoji,
          text: newMoodEntry.text,
          value: newMoodEntry.value,
          time: newMoodEntry.time,
          timestamp: newMoodEntry.timestamp
        });

      if (insertError) throw insertError;

      if (import.meta.env.DEV) {
        console.log('Mood added successfully');
      }
    } catch (error) {
      // Rollback on error
      setMoodHistory(previousState);
      console.error('Mood - Error al guardar:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const updateMood = async (originalTimestamp: number, updatedMood: MoodEntry) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);

    // Save previous state for rollback
    const previousState = moodHistory;

    try {
      // Optimistic update
      const updatedMoods = moodHistory.map(mood =>
        mood.timestamp === originalTimestamp ? updatedMood : mood
      );

      setMoodHistory(updatedMoods);
      setStatus('saved');

      // Update in Supabase - find by user_id, date, and timestamp
      const { error: updateError } = await supabase
        .from('mood_entries')
        .update({
          emoji: updatedMood.emoji,
          text: updatedMood.text,
          value: updatedMood.value,
          time: updatedMood.time,
          timestamp: updatedMood.timestamp
        })
        .eq('user_id', user.id)
        .eq('date', dateString)
        .eq('timestamp', originalTimestamp);

      if (updateError) throw updateError;

      if (import.meta.env.DEV) {
        console.log('Mood updated successfully');
      }
    } catch (error) {
      // Rollback on error
      setMoodHistory(previousState);
      console.error('Mood - Error al actualizar:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const deleteMood = async (timestamp: number) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);

    // Save previous state for rollback
    const previousState = moodHistory;

    try {
      // Optimistic update
      const updatedMoods = moodHistory.filter(mood =>
        mood.timestamp !== timestamp
      );

      setMoodHistory(updatedMoods);
      setStatus('saved');

      // Delete from Supabase
      const { error: deleteError } = await supabase
        .from('mood_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateString)
        .eq('timestamp', timestamp);

      if (deleteError) throw deleteError;

      if (import.meta.env.DEV) {
        console.log('Mood deleted successfully');
      }
    } catch (error) {
      // Rollback on error
      setMoodHistory(previousState);
      console.error('Mood - Error al eliminar:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  return {
    moodHistory,
    status,
    error,
    addMood,
    updateMood,
    deleteMood,
    loadMoodData
  };
};
