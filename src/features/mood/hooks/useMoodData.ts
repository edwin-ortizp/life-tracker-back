// src/features/mood/hooks/useMoodData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';
import { 
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  collection,
} from 'firebase/firestore';
import type { MoodEntry, DailyMood } from '../types';

export const useMoodData = (selectedDate: Date) => {
  const [dailyMood, setDailyMood] = useState<DailyMood | null>(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    const moodRef = doc(collection(db, 'moods'), `${user.uid}_${dateString}`);
    
    const unsubscribe = onSnapshot(moodRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setDailyMood(snapshot.data() as DailyMood);
        } else {
          setDailyMood(null);
        }
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
    const docId = `${user.uid}_${dateString}`;
    const moodRef = doc(collection(db, 'moods'), docId);

    try {
      const newMoodEntry: MoodEntry = {
        emoji: mood.emoji,
        text: mood.text,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };

      const docSnap = await getDoc(moodRef);
      
      if (docSnap.exists()) {
        const existingData = docSnap.data() as DailyMood;
        await setDoc(moodRef, {
          ...existingData,
          moods: [...existingData.moods, newMoodEntry]
        });
      } else {
        await setDoc(moodRef, {
          id: docId,
          userId: user.uid,
          date: dateString,
          moods: [newMoodEntry]
        });
      }

      setStatus('saved');
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

      setStatus('saved');
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
        await setDoc(moodRef, {});
      } else {
        await setDoc(moodRef, {
          ...dailyMood,
          moods: updatedMoods
        });
      }

      setStatus('saved');
    } catch (error) {
      console.error('Mood - Error al eliminar:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  return {
    moodHistory: dailyMood?.moods || [],
    status,
    error,
    addMood,
    updateMood,
    deleteMood
  };
};