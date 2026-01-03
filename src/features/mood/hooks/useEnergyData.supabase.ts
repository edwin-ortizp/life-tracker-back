// src/features/mood/hooks/useEnergyData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString, createFormattedTimestamp } from '@/utils/dates';
import type { EnergyEntry } from '../types';

export const useEnergyData = (selectedDate: Date) => {
  const [energyHistory, setEnergyHistory] = useState<EnergyEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Cargar datos de energía del usuario
  const loadEnergyData = useCallback(async () => {
    if (!user) return;

    setStatus('pending');
    setError(null);
    const dateString = getLocalDateString(selectedDate);

    try {
      const { data, error: fetchError } = await supabase
        .from('energy_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateString)
        .order('timestamp', { ascending: true });

      if (fetchError) throw fetchError;

      // Transformar a formato esperado
      const entries: EnergyEntry[] = (data || []).map(row => ({
        level: row.level,
        comment: row.comment,
        timestamp: row.timestamp,
        time: row.time
      }));

      setEnergyHistory(entries);
      setStatus('saved');
    } catch (error) {
      console.error('Error loading energy data:', error);
      setError(error instanceof Error ? error.message : 'Error loading energy data');
      setStatus('error');
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadEnergyData();
  }, [loadEnergyData]);

  const addEntry = useCallback(async (level: number, comment?: string) => {
    if (!user) return;
    setStatus('saving');
    setError(null);
    const dateString = getLocalDateString(selectedDate);

    const now = new Date();
    const formattedTimestamp = createFormattedTimestamp(
      selectedDate,
      now.getHours(),
      now.getMinutes()
    );
    const newEntry: EnergyEntry = {
      level,
      comment,
      timestamp: formattedTimestamp.timestamp,
      time: now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Actualización optimista
    const optimisticEnergyData = [...energyHistory, newEntry];
    setEnergyHistory(optimisticEnergyData);

    try {
      const { error: insertError } = await supabase
        .from('energy_entries')
        .insert({
          user_id: user.id,
          date: dateString,
          level: level,
          comment: comment || null,
          timestamp: newEntry.timestamp,
          time: newEntry.time
        });

      if (insertError) throw insertError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Energy entry added with timestamp:', newEntry.timestamp);
      }
    } catch (err) {
      console.error('Energy - Error al guardar:', err);
      // Revertir actualización optimista
      setEnergyHistory(energyHistory);
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setStatus('error');
    }
  }, [user, selectedDate, energyHistory]);

  const updateEntry = useCallback(async (originalTimestamp: number, updatedEntry: EnergyEntry) => {
    if (!user) return;
    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);
    const originalData = energyHistory;

    try {
      // Actualización optimista
      const updatedEntries = energyHistory.map((e) =>
        e.timestamp === originalTimestamp ? updatedEntry : e
      );
      setEnergyHistory(updatedEntries);

      const { error: updateError } = await supabase
        .from('energy_entries')
        .update({
          level: updatedEntry.level,
          comment: updatedEntry.comment || null,
          timestamp: updatedEntry.timestamp,
          time: updatedEntry.time
        })
        .eq('user_id', user.id)
        .eq('date', dateString)
        .eq('timestamp', originalTimestamp);

      if (updateError) throw updateError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Energy entry updated with timestamp:', originalTimestamp);
      }
    } catch (err) {
      console.error('Energy - Error al actualizar:', err);
      // Revertir actualización optimista
      setEnergyHistory(originalData);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      setStatus('error');
    }
  }, [user, selectedDate, energyHistory]);

  const deleteEntry = useCallback(async (timestamp: number) => {
    if (!user) return;
    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);
    const originalData = energyHistory;

    try {
      // Actualización optimista
      const updatedEntries = energyHistory.filter((e) => e.timestamp !== timestamp);
      setEnergyHistory(updatedEntries);

      const { error: deleteError } = await supabase
        .from('energy_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateString)
        .eq('timestamp', timestamp);

      if (deleteError) throw deleteError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Energy entry deleted with timestamp:', timestamp);
      }
    } catch (err) {
      console.error('Energy - Error al eliminar:', err);
      // Revertir actualización optimista
      setEnergyHistory(originalData);
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setStatus('error');
    }
  }, [user, selectedDate, energyHistory]);

  return {
    energyHistory,
    status,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    loadEnergyData
  };
};
