// src/modules/exerci../controllers/useExerciseTypes.ts
import { useState, useEffect } from 'react';
import { ExerciseService } from '@/modules/exercise/services';
import { useAuth } from '@/shared/hooks/useAuth';

export interface ExerciseType {
  id: string;
  user_id: string;
  name: string;
  calories_per_hour: number;
  steps_equivalent: number;
  category: 'cardio' | 'strength' | 'flexibility';
  icon: string;
  legacy_id?: number;
  created_at: string;
}

export const useExerciseTypes = () => {
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadExerciseTypes();

    // Subscribe to realtime changes
    const subscription = ExerciseService.subscribeExerciseTypes(user.id, () => {
      loadExerciseTypes();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadExerciseTypes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await ExerciseService.getExerciseTypes(user.id);

      if (fetchError) throw fetchError;

      setExerciseTypes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tipos de ejercicio');
      console.error('Error loading exercise types:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get exercise type by ID
  const getExerciseTypeById = (id: string): ExerciseType | undefined => {
    return exerciseTypes.find(et => et.id === id);
  };

  // Helper function to get exercise type by legacy ID (for backward compatibility)
  const getExerciseTypeByLegacyId = (legacyId: number): ExerciseType | undefined => {
    return exerciseTypes.find(et => et.legacy_id === legacyId);
  };

  // Helper function to get exercise types by category
  const getExerciseTypesByCategory = (category: 'cardio' | 'strength' | 'flexibility'): ExerciseType[] => {
    return exerciseTypes.filter(et => et.category === category);
  };

  return {
    exerciseTypes,
    loading,
    error,
    getExerciseTypeById,
    getExerciseTypeByLegacyId,
    getExerciseTypesByCategory,
    reload: loadExerciseTypes
  };
};
