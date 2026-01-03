// src/features/water/hooks/useDrinkTypes.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface DrinkType {
  id: string;
  user_id: string;
  name: string;
  hydration_factor: number;
  color: string;
  icon: string;
  category: string;
  created_at: string;
}

export const useDrinkTypes = () => {
  const [drinkTypes, setDrinkTypes] = useState<DrinkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadDrinkTypes();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('drink_types_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drink_types',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadDrinkTypes();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadDrinkTypes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('drink_types')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setDrinkTypes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tipos de bebida');
      console.error('Error loading drink types:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get drink type by ID
  const getDrinkTypeById = (id: string): DrinkType | undefined => {
    return drinkTypes.find(dt => dt.id === id);
  };

  // Helper function to get drink type by name (for backward compatibility)
  const getDrinkTypeByName = (name: string): DrinkType | undefined => {
    return drinkTypes.find(dt => dt.name === name);
  };

  return {
    drinkTypes,
    loading,
    error,
    getDrinkTypeById,
    getDrinkTypeByName,
    reload: loadDrinkTypes
  };
};
