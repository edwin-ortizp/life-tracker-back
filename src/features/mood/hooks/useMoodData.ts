// src/features/mood/hooks/useMoodData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString, createFormattedTimestamp } from '@/utils/dates';
import {
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  collection,
  deleteDoc
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';
import type { MoodEntry, DailyMood } from '../types';
import { getMoodValue } from '../types';

export const useMoodData = (selectedDate: Date) => {
  const [dailyMood, setDailyMood] = useState<DailyMood | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    const moodRef = doc(collection(db, 'moods'), `${user.uid}_${dateString}`);
    
    const unsubscribe = onSnapshot(moodRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Aseguramos que siempre exista un array de moods
          if (data && Array.isArray(data.moods)) {
            setDailyMood(data as DailyMood);
          } else {
            // Si no hay moods o no es un array, inicializamos con array vacío
            setDailyMood({
              id: `${user.uid}_${dateString}`,
              userId: user.uid,
              date: dateString,
              moods: []
            });
          }
        } else {
          setDailyMood(null);
        }

        if (import.meta.env.DEV) {
          console.log('Mood snapshot', {
            fromCache: snapshot.metadata.fromCache,
            pending: snapshot.metadata.hasPendingWrites
          });
        }

        if (snapshot.metadata.hasPendingWrites) {
          setStatus('pending');
        } else {
          setStatus('saved');
        }
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
    const docId = `${user.uid}_${dateString}`;
    const moodRef = doc(collection(db, 'moods'), docId);

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
        value: getMoodValue(mood.text) // <-- Aquí se agrega el valor numérico del mood
      };

      const docSnap = await getDoc(moodRef);
      
      if (docSnap.exists()) {
        const existingData = docSnap.data();
        // Verificamos que exista el array de moods
        const currentMoods = Array.isArray(existingData?.moods) ? existingData.moods : [];
        
        await setDoc(moodRef, {
          id: docId,
          userId: user.uid,
          date: dateString,
          moods: [...currentMoods, newMoodEntry]
        });
      } else {
        // Creamos nuevo documento con el primer mood
        await setDoc(moodRef, {
          id: docId,
          userId: user.uid,
          date: dateString,
          moods: [newMoodEntry]
        });
      }

      if (import.meta.env.DEV) {
        console.log('Mood added locally');
      }
    } catch (error) {
      console.error('Mood - Error al guardar:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const updateMood = async (originalTimestamp: number, updatedMood: MoodEntry) => {
    if (!user || !dailyMood) return;

    setStatus('saving');
    setError(null);

    const moodRef = doc(collection(db, 'moods'), dailyMood.id);

    try {
      const updatedMoods = dailyMood.moods.map(mood => 
        mood.timestamp === originalTimestamp ? updatedMood : mood
      );

      await setDoc(moodRef, {
        ...dailyMood,
        moods: updatedMoods
      });
      if (import.meta.env.DEV) {
        console.log('Mood updated locally');
      }
    } catch (error) {
      console.error('Mood - Error al actualizar:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const deleteMood = async (timestamp: number) => {
    if (!user || !dailyMood) return;

    setStatus('saving');
    setError(null);

    const moodRef = doc(collection(db, 'moods'), dailyMood.id);

    try {
      const updatedMoods = dailyMood.moods.filter(mood => 
        mood.timestamp !== timestamp
      );

      if (updatedMoods.length === 0) {
        // Si no quedan estados de ánimo, eliminar el documento
        await deleteDoc(moodRef);
        setDailyMood(null);
      } else {
        await setDoc(moodRef, {
          ...dailyMood,
          moods: updatedMoods
        });
      }

      if (import.meta.env.DEV) {
        console.log('Mood deleted locally');
      }
    } catch (error) {
      console.error('Mood - Error al eliminar:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const resync = useResync('Mood data');

  return {
    moodHistory: dailyMood?.moods || [],
    status,
    error,
    addMood,
    updateMood,
    deleteMood,
    resync
  };
};