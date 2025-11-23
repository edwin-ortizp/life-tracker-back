// src/features/journal/hooks/useJournalData.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestoreLogger } from '@/utils/firestore-logger';
import { useResync } from '@/hooks/useResync';
import { getLocalDateString } from '@/utils/dates';
import { formatDateToSpanishWithUTC } from '@/utils/dates';

export const useJournalData = (selectedDate: Date) => {
  const [entry, setEntry] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const { user } = useAuth();

  // Cargar entrada del diario del usuario (carga inicial única)
  const loadJournalEntry = useCallback(async () => {
    if (!user) return;

    setStatus('saving');
    setError(null);
    const dateString = getLocalDateString(selectedDate);

    try {
      firestoreLogger.logRead('journal', 'useJournalData.loadJournalEntry');
      const docRef = doc(db, 'journal', `${user.uid}_${dateString}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setEntry(data.text || '');

        if (data.lastUpdated) {
          const timestamp = data.lastUpdated.toDate();
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
    const docRef = doc(db, 'journal', `${user.uid}_${dateString}`);

    try {
      firestoreLogger.logWrite('journal', 'useJournalData.saveEntry');
      await setDoc(docRef, {
        userId: user.uid,
        text,
        date: dateString,
        lastUpdated: serverTimestamp(),
        displayTime: now.toLocaleString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        })
      }, { merge: true });

      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      // Revertir actualización optimista en caso de error
      setEntry(originalEntry);
      setLastUpdated(originalLastUpdated);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  }, [user, selectedDate, entry, lastUpdated]);

  const resync = useResync('Journal data');

  return {
    entry,
    setEntry,
    status,
    error,
    saveEntry,
    lastUpdated,
    loadJournalEntry,
    resync
  };
};