// src/features/mood/components/index.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { MoodSelector } from './MoodSelector';
import { MoodHistory } from './MoodHistory';
import { useMoodData } from '../hooks/useMoodData';
import { getLocalDateString } from '@/utils/dates';
import type { MoodProps } from '../types';

export const Mood: React.FC<MoodProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const {
    moodHistory,
    status,
    error,
    addMood
  } = useMoodData(selectedDate);

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tu estado de ánimo</p>
        </CardContent>
      </Card>
    );
  }

  const isCurrentDate = getLocalDateString(selectedDate) === getLocalDateString(new Date());

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Estado de ánimo</h3>
          {status === 'saving' && (
            <span className="text-xs text-blue-500">Guardando...</span>
          )}
          {status === 'error' && (
            <span className="text-xs text-red-500">Error al guardar</span>
          )}
        </div>
        
        {isCurrentDate && (
          <MoodSelector
            onSelect={addMood}
            disabled={status === 'saving'}
          />
        )}

        <MoodHistory moods={moodHistory} />

        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export * from './MoodSelector';
export * from './MoodHistory';

export default Mood;