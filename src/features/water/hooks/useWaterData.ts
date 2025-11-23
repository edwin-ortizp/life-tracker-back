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

    // Actualización optimista
    const optimisticDrinks = [...drinks, newDrink];
    const optimisticIntake = calculateTotalIntake(optimisticDrinks);
    
    setDrinks(optimisticDrinks);
    setIntake(optimisticIntake);

    try {
      const dateString = getLocalDateString(selectedDate);
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

      firestoreLogger.logWrite('water', 'useWaterData.addDrink', `${user.uid}_${dateString}`);
      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: optimisticDrinks,
        totalWater: optimisticIntake,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error adding drink:', error);
      // Revertir actualización optimista en caso de error
      setDrinks(drinks);
      setIntake(intake);
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

      // Actualización optimista
      const optimisticDrinks = [...drinks];
      optimisticDrinks[index] = drinkWithUpdates;
      const optimisticIntake = calculateTotalIntake(optimisticDrinks);

      setDrinks(optimisticDrinks);
      setIntake(optimisticIntake);

      firestoreLogger.logWrite('water', 'useWaterData.editDrink', `${user.uid}_${dateString}`);
      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: optimisticDrinks,
        totalWater: optimisticIntake,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error editing drink:', error);
      // Revertir actualización optimista en caso de error
      setDrinks(drinks);
      setIntake(intake);
      setError(error instanceof Error ? error.message : 'Error al editar');
      setStatus('error');
    }
  };

  const deleteDrink = async (index: number) => {
    if (!user) return;

    setStatus('saving');
    setError(null);

    // Guardar drink a eliminar para poder revertir si falla
    const drinkToDelete = drinks[index];

    try {
      const dateString = getLocalDateString(selectedDate);
      const docRef = doc(db, 'water', `${user.uid}_${dateString}`);
      
      // Actualización optimista
      const optimisticDrinks = drinks.filter((_, i) => i !== index);
      const optimisticIntake = calculateTotalIntake(optimisticDrinks);

      setDrinks(optimisticDrinks);
      setIntake(optimisticIntake);

      firestoreLogger.logWrite('water', 'useWaterData.deleteDrink', `${user.uid}_${dateString}`);
      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: optimisticDrinks,
        totalWater: optimisticIntake,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setStatus('saved');
      if (import.meta.env.DEV) {
      }
    } catch (error) {
      console.error('Error deleting drink:', error);
      // Revertir actualización optimista en caso de error
      const revertedDrinks = [...drinks];
      revertedDrinks.splice(index, 0, drinkToDelete);
      setDrinks(revertedDrinks);
      setIntake(calculateTotalIntake(revertedDrinks));
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