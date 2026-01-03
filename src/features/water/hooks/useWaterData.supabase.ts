import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
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

  // Cargar datos de hidratación
  const loadWaterData = async () => {
    if (!user) return;

    setError(null);
    setStatus('pending');

    try {
      const dateString = getLocalDateString(selectedDate);

      const { data, error: fetchError } = await supabase
        .from('drink_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateString)
        .order('timestamp', { ascending: true });

      if (fetchError) throw fetchError;

      // Transformar a formato esperado
      const drinksList: Drink[] = (data || []).map(row => ({
        type: row.drink_type,
        amount: row.amount,
        hydration: row.hydration_value,
        timestamp: row.timestamp.toString(),
        time: row.time
      }));

      const totalIntake = calculateTotalIntake(drinksList);
      setIntake(totalIntake);
      setDrinks(drinksList);
      setStatus('saved');
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

    const newDrink: Drink = {
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

      const { error: insertError } = await supabase
        .from('drink_logs')
        .insert({
          user_id: user.id,
          date: dateString,
          drink_type: type,
          amount: amount,
          hydration_value: hydrationAmount,
          timestamp: parseInt(formattedTime.timestamp.toString()),
          time: newDrink.time
        });

      if (insertError) throw insertError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Drink added with amount:', amount, 'ml');
      }
    } catch (error) {
      console.error('Error adding drink:', error);
      // Revertir actualización optimista
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

    const dateString = getLocalDateString(selectedDate);
    const originalDrink = drinks[index];

    try {
      // Convertir la hora del string a números para crear el timestamp
      const [hours, minutes] = updatedDrink.time.split(':').map(Number);
      const formattedTime = createFormattedTimestamp(selectedDate, hours, minutes);

      // Recalcular la hidratación
      const hydrationValue = updatedDrink.amount * DRINKS[updatedDrink.type].hydrationFactor;

      const drinkWithUpdates: Drink = {
        ...updatedDrink,
        timestamp: formattedTime.timestamp.toString(),
        hydration: hydrationValue
      };

      // Actualización optimista
      const optimisticDrinks = [...drinks];
      optimisticDrinks[index] = drinkWithUpdates;
      const optimisticIntake = calculateTotalIntake(optimisticDrinks);

      setDrinks(optimisticDrinks);
      setIntake(optimisticIntake);

      // Update in Supabase - find by original timestamp
      const { error: updateError } = await supabase
        .from('drink_logs')
        .update({
          drink_type: updatedDrink.type,
          amount: updatedDrink.amount,
          hydration_value: hydrationValue,
          timestamp: parseInt(formattedTime.timestamp.toString()),
          time: updatedDrink.time
        })
        .eq('user_id', user.id)
        .eq('date', dateString)
        .eq('timestamp', parseInt(originalDrink.timestamp));

      if (updateError) throw updateError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Drink edited at index:', index);
      }
    } catch (error) {
      console.error('Error editing drink:', error);
      // Revertir actualización optimista
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

    const dateString = getLocalDateString(selectedDate);
    const drinkToDelete = drinks[index];

    try {
      // Actualización optimista
      const optimisticDrinks = drinks.filter((_, i) => i !== index);
      const optimisticIntake = calculateTotalIntake(optimisticDrinks);

      setDrinks(optimisticDrinks);
      setIntake(optimisticIntake);

      const { error: deleteError } = await supabase
        .from('drink_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('date', dateString)
        .eq('timestamp', parseInt(drinkToDelete.timestamp));

      if (deleteError) throw deleteError;

      setStatus('saved');
      if (import.meta.env.DEV) {
        console.log('Drink deleted at index:', index);
      }
    } catch (error) {
      console.error('Error deleting drink:', error);
      // Revertir actualización optimista
      const revertedDrinks = [...drinks];
      revertedDrinks.splice(index, 0, drinkToDelete);
      setDrinks(revertedDrinks);
      setIntake(calculateTotalIntake(revertedDrinks));
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
    deleteDrink,
    loadWaterData
  };
};
