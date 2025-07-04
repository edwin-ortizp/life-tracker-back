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

    // Save previous state for rollback
    const previousState = dailyMood;

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

      // Optimistic update: update UI immediately
      const currentMoods = dailyMood?.moods || [];
      const updatedMoods = [...currentMoods, newMoodEntry];
      
      const optimisticDoc: DailyMood = {
        id: docId,
        userId: user.uid,
        date: dateString,
        moods: updatedMoods
      };
      
      setDailyMood(optimisticDoc);
      setStatus('saved');

      if (dailyMood) {
        // Update existing document
        firestoreLogger.logWrite('moods', 'useMoodData.addMood.update', docId);
        await setDoc(moodRef, optimisticDoc);
      } else {
        // Create new document
        firestoreLogger.logWrite('moods', 'useMoodData.addMood.create', docId);
        await setDoc(moodRef, optimisticDoc);
      }

      if (import.meta.env.DEV) {
        console.log('Mood added successfully');
      }
    } catch (error) {
      // Rollback on error
      setDailyMood(previousState);
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
    
    // Save previous state for rollback
    const previousState = dailyMood;

    try {
      // Optimistic update: update UI immediately
      const updatedMoods = dailyMood.moods.map(mood => 
        mood.timestamp === originalTimestamp ? updatedMood : mood
      );
      
      const optimisticDoc: DailyMood = {
        ...dailyMood,
        moods: updatedMoods
      };
      
      setDailyMood(optimisticDoc);
      setStatus('saved');

      firestoreLogger.logWrite('moods', 'useMoodData.updateMood', dailyMood.id);
      await setDoc(moodRef, optimisticDoc);
      
      if (import.meta.env.DEV) {
        console.log('Mood updated successfully');
      }
    } catch (error) {
      // Rollback on error
      setDailyMood(previousState);
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
    
    // Save previous state for rollback
    const previousState = dailyMood;

    try {
      // Optimistic update: update UI immediately
      const updatedMoods = dailyMood.moods.filter(mood => 
        mood.timestamp !== timestamp
      );

      if (updatedMoods.length === 0) {
        setDailyMood(null);
        setStatus('saved');
        
        // Delete document from server
        firestoreLogger.logDelete('moods', 'useMoodData.deleteMood.deleteDoc', dailyMood.id);
        await deleteDoc(moodRef);
      } else {
        const optimisticDoc: DailyMood = {
          ...dailyMood,
          moods: updatedMoods
        };
        
        setDailyMood(optimisticDoc);
        setStatus('saved');
        
        firestoreLogger.logWrite('moods', 'useMoodData.deleteMood.update', dailyMood.id);
        await setDoc(moodRef, optimisticDoc);
      }

      if (import.meta.env.DEV) {
        console.log('Mood deleted successfully');
      }
    } catch (error) {
      // Rollback on error
      setDailyMood(previousState);
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