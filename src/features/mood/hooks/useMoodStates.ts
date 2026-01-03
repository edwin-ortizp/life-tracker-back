// src/features/mood/hooks/useMoodStates.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface MoodState {
  id: string;
  user_id: string;
  emoji: string;
  text: string;
  value: number;
  category: string;
  created_at: string;
}

export const useMoodStates = () => {
  const [moodStates, setMoodStates] = useState<MoodState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadMoodStates();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('mood_states_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_states',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadMoodStates();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadMoodStates = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('mood_states')
        .select('*')
        .eq('user_id', user.id)
        .order('value', { ascending: false });

      if (fetchError) throw fetchError;

      setMoodStates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estados de ánimo');
      console.error('Error loading mood states:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get mood state by ID
  const getMoodStateById = (id: string): MoodState | undefined => {
    return moodStates.find(ms => ms.id === id);
  };

  // Helper function to get mood state by text (for backward compatibility)
  const getMoodStateByText = (text: string): MoodState | undefined => {
    return moodStates.find(ms => ms.text === text);
  };

  // Helper to get mood value by text (for backward compatibility with getMoodValue function)
  const getMoodValue = (moodText: string): number => {
    const mood = moodStates.find(ms => ms.text === moodText);
    return mood?.value ?? 5; // Default neutral if not found
  };

  return {
    moodStates,
    loading,
    error,
    getMoodStateById,
    getMoodStateByText,
    getMoodValue,
    reload: loadMoodStates
  };
};
