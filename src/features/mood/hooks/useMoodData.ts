// src/features/mood/hooks/useMoodData.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString, createFormattedTimestamp } from '@/utils/dates';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  deleteDoc
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';
import { firestoreLogger } from '@/utils/firestore-logger';
import type { MoodEntry, DailyMood } from '../types';
import { getMoodValue } from '../types';

export const useMoodData = (selectedDate: Date) => {
  const [dailyMood, setDailyMood] = useState<DailyMood | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Cargar datos de mood (carga única)
  const loadMoodData = async () => {
    if (!user) return;

    try {
      const dateString = getLocalDateString(selectedDate);
      firestoreLogger.logRead('moods', 'useMoodData.loadData', `${user.uid}_${dateString}`);
      const moodRef = doc(collection(db, 'moods'), `${user.uid}_${dateString}`);
      const snapshot = await getDoc(moodRef);

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
        
        firestoreLogger.logWrite('moods', 'useMoodData.addMood.update', docId);
        await setDoc(moodRef, {
          id: docId,
          userId: user.uid,
          date: dateString,
          moods: [...currentMoods, newMoodEntry]
        });
      } else {
        // Creamos nuevo documento con el primer mood
        firestoreLogger.logWrite('moods', 'useMoodData.addMood.create', docId);
        await setDoc(moodRef, {
          id: docId,
          userId: user.uid,
          date: dateString,
          moods: [newMoodEntry]
        });
      }

      // Recargar datos después de guardar
      await loadMoodData();

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
        firestoreLogger.logDelete('moods', 'useMoodData.deleteMood.deleteDoc', dailyMood.id);
        await deleteDoc(moodRef);
        setDailyMood(null);
      } else {
        firestoreLogger.logWrite('moods', 'useMoodData.deleteMood.update', dailyMood.id);
        await setDoc(moodRef, {
          ...dailyMood,
          moods: updatedMoods
        });
      }

      // Recargar datos después de eliminar
      await loadMoodData();

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
    loadMoodData, // Exponer función de recarga manual
    resync
  };
};