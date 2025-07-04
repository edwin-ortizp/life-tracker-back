import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useResync } from '@/hooks/useResync';
import { firestoreLogger } from '@/utils/firestore-logger';
import { Drink, DRINKS } from '../types';
import { getLocalDateString, createFormattedTimestamp } from '@/utils/dates';

export const useWaterData = (selectedDate: Date) => {
  const [intake, setIntake] = useState(0);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [status, setStatus] = useState<'idle' | 'saving' | 'pending' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Función para calcular el intake total
  const calculateTotalIntake = (drinksList: Drink[]) => {
    return drinksList.reduce((total, drink) => total + drink.hydration, 0);
  };

  // Cargar datos de hidratación (carga única)
  const loadWaterData = async () => {
    if (!user) return;

    setError(null);

    try {
      const dateString = getLocalDateString(selectedDate);
      firestoreLogger.logRead('water', 'useWaterData.loadData', `${user.uid}_${dateString}`);
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const drinksList = data.drinks || [];
        const totalIntake = calculateTotalIntake(drinksList);
        setIntake(totalIntake);
        setDrinks(drinksList);
        setStatus('saved');
      } else {
        setIntake(0);
        setDrinks([]);
        setStatus('idle');
      }
    } catch (error) {
      console.error('Error loading water data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar datos de hidratación');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadWaterData();
  }, [user, selectedDate]);

  const addDrink = async (type: keyof typeof DRINKS, amount: number) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const dateString = getLocalDateString(selectedDate);
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);
      
      const now = new Date();
      const formattedTime = createFormattedTimestamp(
        selectedDate,
        now.getHours(),
        now.getMinutes()
      );

      const hydrationAmount = amount * DRINKS[type].hydrationFactor;

      const newDrink = {
        type,
        amount,
        hydration: hydrationAmount,
        timestamp: formattedTime.timestamp.toString(),
        time: now.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      };

      const updatedDrinks = [...drinks, newDrink];
      const totalWater = calculateTotalIntake(updatedDrinks);

      firestoreLogger.logWrite('water', 'useWaterData.addDrink', `${user.uid}_${dateString}`);
      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalWater,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Recargar datos después de agregar
      await loadWaterData();
      
      if (import.meta.env.DEV) {
        console.log('Drink added locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
      setStatus('error');
    }
  };

  const editDrink = async (index: number, updatedDrink: Drink) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const dateString = getLocalDateString(selectedDate);
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

      // Convertir la hora del string a números para crear el timestamp
      const [hours, minutes] = updatedDrink.time.split(':').map(Number);
      const formattedTime = createFormattedTimestamp(selectedDate, hours, minutes);

      // Actualizar el drink con el nuevo timestamp y recalcular la hidratación
      const drinkWithUpdates = {
        ...updatedDrink,
        timestamp: formattedTime.timestamp.toString(),
        hydration: updatedDrink.amount * DRINKS[updatedDrink.type].hydrationFactor
      };

      const updatedDrinks = [...drinks];
      updatedDrinks[index] = drinkWithUpdates;

      const totalWater = calculateTotalIntake(updatedDrinks);

      firestoreLogger.logWrite('water', 'useWaterData.editDrink', `${user.uid}_${dateString}`);
      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalWater,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Recargar datos después de editar
      await loadWaterData();
      
      if (import.meta.env.DEV) {
        console.log('Drink edited locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al editar');
      setStatus('error');
    }
  };

  const deleteDrink = async (index: number) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    try {
      const dateString = getLocalDateString(selectedDate);
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);
      
      const updatedDrinks = drinks.filter((_, i) => i !== index);
      const totalWater = calculateTotalIntake(updatedDrinks);

      firestoreLogger.logWrite('water', 'useWaterData.deleteDrink', `${user.uid}_${dateString}`);
      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalWater,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Recargar datos después de eliminar
      await loadWaterData();
      
      if (import.meta.env.DEV) {
        console.log('Drink deleted locally');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  const resync = useResync('Water data');

  return {
    intake,
    drinks,
    status,
    error,
    addDrink,
    editDrink,
    deleteDrink,
    loadWaterData, // Exponer función de recarga manual
    resync
  };
};