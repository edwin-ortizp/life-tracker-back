// src/features/mood/hooks/useEnergyData.ts
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
  deleteDoc,
  enableNetwork,
  waitForPendingWrites
} from 'firebase/firestore';
import type { EnergyEntry, DailyEnergy } from '../types';

export const useEnergyData = (selectedDate: Date) => {
  const [dailyEnergy, setDailyEnergy] = useState<DailyEnergy | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const dateString = getLocalDateString(selectedDate);
    const energyRef = doc(collection(db, 'energy'), `${user.uid}_${dateString}`);

    const unsubscribe = onSnapshot(
      energyRef,
      (snapshot) => {
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

        if (import.meta.env.DEV) {
          console.log('Energy snapshot', {
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
      (err) => {
        console.error('Energy - Error en snapshot:', err);
        setError(err.message);
        setStatus('error');
      }
    );
    return () => unsubscribe();
  }, [user, selectedDate]);

  const addEntry = async (level: number, comment?: string) => {
    if (!user) return;
    setStatus('saving');
    setError(null);
    const dateString = getLocalDateString(selectedDate);
    const docId = `${user.uid}_${dateString}`;
    const energyRef = doc(collection(db, 'energy'), docId);

    try {
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

      const docSnap = await getDoc(energyRef);

      if (docSnap.exists()) {
        const existingData = docSnap.data();
        const currentEntries = Array.isArray(existingData?.entries) ? existingData.entries : [];
        await setDoc(energyRef, {
          id: docId,
          userId: user.uid,
          date: dateString,
          entries: [...currentEntries, newEntry]
        });
      } else {
        await setDoc(energyRef, {
          id: docId,
          userId: user.uid,
          date: dateString,
          entries: [newEntry]
        });
      }

      if (import.meta.env.DEV) {
        console.log('Energy entry added locally');
      }
    } catch (err) {
      console.error('Energy - Error al guardar:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const updateEntry = async (originalTimestamp: number, updatedEntry: EnergyEntry) => {
    if (!user || !dailyEnergy) return;
    setStatus('saving');
    setError(null);
    const energyRef = doc(collection(db, 'energy'), dailyEnergy.id);

    try {
      const updatedEntries = dailyEnergy.entries.map((e) =>
        e.timestamp === originalTimestamp ? updatedEntry : e
      );
      await setDoc(energyRef, {
        ...dailyEnergy,
        entries: updatedEntries
      });
      if (import.meta.env.DEV) {
        console.log('Energy entry updated locally');
      }
    } catch (err) {
      console.error('Energy - Error al actualizar:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar');
      setStatus('error');
    }
  };

  const deleteEntry = async (timestamp: number) => {
    if (!user || !dailyEnergy) return;
    setStatus('saving');
    setError(null);
    const energyRef = doc(collection(db, 'energy'), dailyEnergy.id);

    try {
      const updatedEntries = dailyEnergy.entries.filter((e) => e.timestamp !== timestamp);
      if (updatedEntries.length === 0) {
        await deleteDoc(energyRef);
        setDailyEnergy(null);
      } else {
        await setDoc(energyRef, {
          ...dailyEnergy,
          entries: updatedEntries
        });
      }
      if (import.meta.env.DEV) {
        console.log('Energy entry deleted locally');
      }
    } catch (err) {
      console.error('Energy - Error al eliminar:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const resync = async () => {
    await enableNetwork(db);
    await waitForPendingWrites(db);
    if (import.meta.env.DEV) {
      console.log('Energy data resynced');
    }
  };

  return {
    energyHistory: dailyEnergy?.entries || [],
    status,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    resync
  };
};
