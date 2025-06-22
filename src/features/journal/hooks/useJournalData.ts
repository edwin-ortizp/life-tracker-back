// src/features/journal/hooks/useJournalData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  enableNetwork,
  waitForPendingWrites
} from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';
import { formatDateToSpanishWithUTC } from '@/utils/dates';

export const useJournalData = (selectedDate: Date) => {
  const [entry, setEntry] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    const docRef = doc(db, 'journal', `${user.uid}_${dateString}`);

    const unsubscribe = onSnapshot(docRef,
      (doc) => {
        if (doc.exists()) {
          setEntry(doc.data().text || '');

          if (import.meta.env.DEV) {
            console.log('Journal snapshot', {
              fromCache: doc.metadata.fromCache,
              pending: doc.metadata.hasPendingWrites
            });
          }

          if (doc.data().lastUpdated) {
            const timestamp = doc.data().lastUpdated.toDate();
            setLastUpdated(formatDateToSpanishWithUTC(timestamp));
          }

          if (doc.metadata.hasPendingWrites) {
            setStatus('pending');
          } else {
            setStatus('saved');
          }
        } else {
          setEntry('');
          setStatus('idle');
          setLastUpdated(undefined);
        }
      },
      (error) => {
        setError(error.message);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate]);

  const saveEntry = async (text: string) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);
    const docRef = doc(db, 'journal', `${user.uid}_${dateString}`);

    try {
      await setDoc(docRef, {
        userId: user.uid,
        text,
        date: dateString,
        lastUpdated: serverTimestamp(),
        displayTime: new Date().toLocaleString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        })
      }, { merge: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const resync = async () => {
    await enableNetwork(db);
    await waitForPendingWrites(db);
    if (import.meta.env.DEV) {
      console.log('Journal data resynced');
    }
  };

  return {
    entry,
    setEntry,
    status,
    error,
    saveEntry,
    lastUpdated,
    resync
  };
};