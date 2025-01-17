import { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { useAuth } from '../../../hooks/useAuth';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Drink, DRINKS } from '../types';

export const useWaterData = (selectedDate: Date) => {
  const [intake, setIntake] = useState(0);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Nueva función para obtener la fecha local en formato YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  };

  useEffect(() => {
    if (!user) return;

    const dateString = getLocalDateString(selectedDate);
    const docRef = doc(db, 'water', `${user.uid}_${dateString}`);

    console.log('Consultando registros para la fecha:', dateString);

    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIntake(data.totalHydration || 0);
          setDrinks(data.drinks || []);
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

      const newDrink = {
        type,
        amount,
        hydration: amount * DRINKS[type].hydrationFactor,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };

      const updatedDrinks = [...drinks, newDrink];
      const totalHydration = updatedDrinks.reduce((sum, drink) => 
        sum + drink.hydration, 0
      );

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalHydration,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatus('saved');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al guardar');
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
      const totalHydration = updatedDrinks.reduce(
        (sum, drink) => sum + drink.hydration, 
        0
      );

      await setDoc(docRef, {
        userId: user.uid,
        date: dateString,
        drinks: updatedDrinks,
        totalHydration,
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
    deleteDrink
  };
};