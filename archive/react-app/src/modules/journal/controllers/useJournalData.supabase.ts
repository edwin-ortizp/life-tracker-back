// src/modules/journal/hooks/useJournalData.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { getLocalDateString } from '@/shared/utils/dates';
import { formatDateToSpanishWithUTC } from '@/shared/utils/dates';
import { JournalService } from '../services/JournalService';

export const useJournalData = (selectedDate: Date) => {
  const [entry, setEntry] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const { user } = useAuth();

  // Cargar entrada del diario del usuario
  const loadJournalEntry = useCallback(async () => {
    if (!user) return;

    setStatus('pending');
    setError(null);
    const dateString = getLocalDateString(selectedDate);

    try {
      const { data, error: fetchError } = await JournalService.getEntry(user.id, dateString);

      if (fetchError) throw fetchError;

      if (data) {
        setEntry(data.text || '');

        if (data.updated_at) {
          const timestamp = new Date(data.updated_at);
          setLastUpdated(formatDateToSpanishWithUTC(timestamp));
        }
        setStatus('saved');
      } else {
        setEntry('');
        setStatus('idle');
        setLastUpdated(undefined);
      }
    } catch (error) {
      console.error('Error loading journal entry:', error);
      setError(error instanceof Error ? error.message : 'Error loading journal entry');
      setStatus('error');
    }
  }, [user, selectedDate]);

  useEffect(() => {
    loadJournalEntry();
  }, [loadJournalEntry]);

  const saveEntry = useCallback(async (text: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    // Actualización optimista
    const originalEntry = entry;
    const originalLastUpdated = lastUpdated;
    const now = new Date();
    const optimisticLastUpdated = formatDateToSpanishWithUTC(now);

    setEntry(text);
    setLastUpdated(optimisticLastUpdated);

    const dateString = getLocalDateString(selectedDate);
    const displayTime = now.toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });

    try {
      const { error: upsertError } = await JournalService.upsertEntry({
        userId: user.id,
        date: dateString,
        text,
        displayTime,
        updatedAt: now.toISOString()
      });

      if (upsertError) throw upsertError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Journal entry saved for date:', dateString);
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      // Revertir actualización optimista
      setEntry(originalEntry);
      setLastUpdated(originalLastUpdated);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  }, [user, selectedDate, entry, lastUpdated]);

  return {
    entry,
    setEntry,
    status,
    error,
    saveEntry,
    lastUpdated,
    loadJournalEntry
  };
};
