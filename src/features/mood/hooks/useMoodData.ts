// src/features/mood/hooks/useMoodData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  type DocumentData
} from 'firebase/firestore';
import type { Mood } from '../types';

export const useMoodData = (selectedDate: Date) => {
  const [moodHistory, setMoodHistory] = useState<Mood[]>([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    
    console.log('Mood - Suscribiéndose a colección moods para:', dateString);

    const q = query(
      collection(db, 'moods'),
      where('userId', '==', user.uid),
      where('date', '==', dateString)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Mood - Documentos actualizados:', snapshot.docs.map(doc => doc.data()));
        const moodEntries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Mood[];
        setMoodHistory(moodEntries);
        setStatus('saved');
      },
      (error) => {
        console.error('Mood - Error en snapshot:', error);
        setError(error.message);
        setStatus('error');
      }
    );

    return () => unsubscribe();
  }, [user, selectedDate]);

  const addMood = async (mood: { emoji: string; text: string }) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    const dateString = getLocalDateString(selectedDate);

    try {
      console.log('Mood - Guardando:', {
        userId: user.uid,
        emoji: mood.emoji,
        text: mood.text,
        date: dateString,
      });

      await addDoc(collection(db, 'moods'), {
        userId: user.uid,
        emoji: mood.emoji,
        text: mood.text,
        date: dateString,
        timestamp: serverTimestamp(),
        time: new Date().toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      });

      console.log('Mood - Guardado exitosamente');
      setStatus('saved');
    } catch (error) {
      console.error('Mood - Error al guardar:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  return {
    moodHistory,
    status,
    error,
    addMood
  };
};