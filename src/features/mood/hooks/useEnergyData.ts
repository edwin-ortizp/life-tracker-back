// src/features/mood/hooks/useEnergyData.ts
import { useState, useEffect, useCallback } from 'react';
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
import { firestoreLogger } from '@/utils/firestore-logger';
import { useResync } from '@/hooks/useResync';
import type { EnergyEntry, DailyEnergy } from '../types';

export const useEnergyData = (selectedDate: Date) => {
  const [dailyEnergy, setDailyEnergy] = useState<DailyEnergy | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Cargar datos de energía del usuario (carga inicial única)
  const loadEnergyData = useCallback(async () => {
    if (!user) return;

    setStatus('saving');
    setError(null);
    const dateString = getLocalDateString(selectedDate);

    try {
      firestoreLogger.logRead('energy', 'useEnergyData.loadEnergyData');
      const energyRef = doc(collection(db, 'energy'), `${user.uid}_${dateString}`);
      const snapshot = await getDoc(energyRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.entries)) {
          setDailyEnergy(data as DailyEnergy);
        } else {
          setDailyEnergy({
            id: `${user.uid}_${dateString}`,
            userId: user.uid,
            date: dateString,
            entries: []
          });
        }
      } else {
        setDailyEnergy(null);
      }

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
    const docId = `${user.uid}_${dateString}`;

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
    const currentEntries = dailyEnergy?.entries || [];
    const optimisticEnergyData: DailyEnergy = {
      id: docId,
      userId: user.uid,
      date: dateString,
      entries: [...currentEntries, newEntry]
    };
    setDailyEnergy(optimisticEnergyData);

    try {
      const energyRef = doc(collection(db, 'energy'), docId);
      
      firestoreLogger.logWrite('energy', 'useEnergyData.addEntry');
      await setDoc(energyRef, optimisticEnergyData);

      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (err) {
      console.error('Energy - Error al guardar:', err);
      // Revertir actualización optimista en caso de error
      setDailyEnergy(dailyEnergy);
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setStatus('error');
    }
  }, [user, selectedDate, dailyEnergy]);

  const updateEntry = useCallback(async (originalTimestamp: number, updatedEntry: EnergyEntry) => {
    if (!user || !dailyEnergy) return;
    setStatus('saving');
    setError(null);

    // Guardar estado original para revertir si falla
    const originalData = dailyEnergy;

    try {
      // Actualización optimista
      const updatedEntries = dailyEnergy.entries.map((e) =>
        e.timestamp === originalTimestamp ? updatedEntry : e
      );
      const optimisticData = {
        ...dailyEnergy,
        entries: updatedEntries
      };
      setDailyEnergy(optimisticData);

      const energyRef = doc(collection(db, 'energy'), dailyEnergy.id);
      firestoreLogger.logWrite('energy', 'useEnergyData.updateEntry', dailyEnergy.id);
      await setDoc(energyRef, optimisticData);

      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (err) {
      console.error('Energy - Error al actualizar:', err);
      // Revertir actualización optimista en caso de error
      setDailyEnergy(originalData);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      setStatus('error');
    }
  }, [user, dailyEnergy]);

  const deleteEntry = useCallback(async (timestamp: number) => {
    if (!user || !dailyEnergy) return;
    setStatus('saving');
    setError(null);

    // Guardar estado original para revertir si falla
    const originalData = dailyEnergy;

    try {
      const updatedEntries = dailyEnergy.entries.filter((e) => e.timestamp !== timestamp);
      const energyRef = doc(collection(db, 'energy'), dailyEnergy.id);

      // Actualización optimista
      if (updatedEntries.length === 0) {
        setDailyEnergy(null);
        firestoreLogger.logDelete('energy', 'useEnergyData.deleteEntry', dailyEnergy.id);
        await deleteDoc(energyRef);
      } else {
        const optimisticData = {
          ...dailyEnergy,
          entries: updatedEntries
        };
        setDailyEnergy(optimisticData);
        firestoreLogger.logWrite('energy', 'useEnergyData.deleteEntry', dailyEnergy.id);
        await setDoc(energyRef, optimisticData);
      }

      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (err) {
      console.error('Energy - Error al eliminar:', err);
      // Revertir actualización optimista en caso de error
      setDailyEnergy(originalData);
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setStatus('error');
    }
  }, [user, dailyEnergy]);

  const resync = useResync('Energy data');

  return {
    energyHistory: dailyEnergy?.entries || [],
    status,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    loadEnergyData,
    resync
  };
};
