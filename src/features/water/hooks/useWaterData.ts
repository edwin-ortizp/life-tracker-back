import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Drink, DRINKS } from '../types';
import { getLocalDateString, createFormattedTimestamp } from '@/utils/dates';

export const useWaterData = (selectedDate: Date) => {
  const [intake, setIntake] = useState(0);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Función para calcular el intake total
  const calculateTotalIntake = (drinksList: Drink[]) => {
    return drinksList.reduce((total, drink) => total + drink.hydration, 0);
  };

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const drinksList = data.drinks || [];
          // Recalculamos el total cada vez que obtenemos datos
          const totalIntake = calculateTotalIntake(drinksList);
          setIntake(totalIntake);
          setDrinks(drinksList);
          setStatus('saved');
        } else {
          setIntake(0);
          setDrinks([]);
          setStatus('idle');
        }
      },
      (error) => {
        console.error('Error en snapshot:', error);
        setError(error.message);
        setStatus('error');
      }
    );

    return () => unsubscribe();
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

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalWater,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
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

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalWater,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
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

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalWater,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al eliminar');
      setStatus('error');
    }
  };

  return {
    intake,
    drinks,
    status,
    error,
    addDrink,
    editDrink,
    deleteDrink
  };
};