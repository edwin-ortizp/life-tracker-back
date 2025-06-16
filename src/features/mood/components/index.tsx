// src/features/mood/components/index.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { MoodSelector } from './MoodSelector';
import { MoodHistory } from './MoodHistory';
import { EnergySelector } from './EnergySelector';
import { EnergyHistory } from './EnergyHistory';
import { ImportMoodButton } from './ImportMoodButton';
import { MoodAiMenu } from './MoodAiMenu';
import { useJournalLock } from '@/features/journal/context/JournalLockContext';
import { useMoodData } from '../hooks/useMoodData';
import { useEnergyData } from '../hooks/useEnergyData';
import { getLocalDateString } from '@/utils/dates';
import type { MoodProps } from '../types';

export const Mood: React.FC<MoodProps> = ({ selectedDate }) => {
  const { user } = useAuth();
  const { isUnlocked } = useJournalLock();
  const {
    moodHistory,
    status,
    error,
    addMood,
    updateMood,
    deleteMood
  } = useMoodData(selectedDate);
  const {
    energyHistory,
    status: energyStatus,
    error: energyError,
    addEntry,
    updateEntry,
    deleteEntry
  } = useEnergyData(selectedDate);

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
    <div className="space-y-4">
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Estado de ánimo</h3>
            <div className="flex items-center gap-2">
              <ImportMoodButton />
              {isUnlocked && (
                <MoodAiMenu selectedDate={selectedDate} />
              )}
              {status === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}
              {status === 'error' && (
                <span className="text-xs text-red-500">Error al guardar</span>
              )}
            </div>
          </div>

          {isCurrentDate && (
            <MoodSelector onSelect={addMood} disabled={status === 'saving'} />
          )}

          <MoodHistory
            moods={moodHistory}
            onUpdateMood={updateMood}
            onDeleteMood={deleteMood}
          />

          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Nivel de energía</h3>
            <div className="flex items-center gap-2">
              {energyStatus === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}
              {energyStatus === 'error' && (
                <span className="text-xs text-red-500">Error al guardar</span>
              )}
            </div>
          </div>

          {isCurrentDate && (
            <EnergySelector onSelect={addEntry} disabled={energyStatus === 'saving'} />
          )}

          <EnergyHistory
            entries={energyHistory}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />

          {energyError && (
            <p className="mt-2 text-sm text-red-500">
              {energyError}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export * from './MoodSelector';
export * from './MoodHistory';
export * from './ImportMoodButton';
export * from './MoodAiMenu';
export * from './EnergySelector';
export * from './EnergyHistory';

export default Mood;