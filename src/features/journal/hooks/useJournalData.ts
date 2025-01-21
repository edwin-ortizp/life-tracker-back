// src/features/journal/hooks/useJournalData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';

export const useJournalData = (selectedDate: Date) => {
  const [entry, setEntry] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    const docRef = doc(db, 'journal', `${user.uid}_${dateString}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          setEntry(doc.data().text || '');
          setStatus('saved');
        } else {
          setEntry('');
          setStatus('idle');
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

      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  return {
    entry,
    setEntry,
    status,
    error,
    saveEntry
  };
};