// src/features/mood/components/index.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getLocalDateString } from '@/utils/dates';
import type { MoodProps } from '../types';

export const Mood: React.FC<MoodProps> = ({ selectedDate, energyFirst = false }) => {
  const { user } = useAuth();
  const { isUnlocked } = useJournalLock();
  const {
    moodHistory,
    status,
    error,
    addMood,
    updateMood,
    deleteMood,
    resync: resyncMood
  } = useMoodData(selectedDate);
  const {
    energyHistory,
    status: energyStatus,
    error: energyError,
    addEntry,
    updateEntry,
    deleteEntry,
    resync: resyncEnergy
  } = useEnergyData(selectedDate);
  const { isOnline } = useNetworkStatus();

  const latestEnergy = energyHistory
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  const ENERGY_TEXT_COLORS = [
    'text-red-500',
    'text-orange-500',
    'text-yellow-500',
    'text-lime-600',
    'text-green-600'
  ];

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

  const moodCard = (
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
              {status === 'pending' && (
                <span className="text-xs text-yellow-600">Pendiente de sincronizar</span>
              )}
              {status === 'error' && (
                <span className="text-xs text-red-500">Error al guardar</span>
              )}
              {!isOnline && <span className="text-xs text-orange-600">Offline</span>}
              <Button onClick={resyncMood} variant="link" className="p-0 h-auto text-xs">Reintentar</Button>
            </div>
          </div>

          {isCurrentDate && (
            <MoodSelector onSelect={addMood} disabled={status === 'saving' || !isOnline} />
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
  );

  const energyCard = (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">
            Nivel de energía
              {latestEnergy && (
                <span className={`ml-2 ${ENERGY_TEXT_COLORS[latestEnergy.level - 1]}`}>({latestEnergy.level})</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {energyStatus === 'saving' && (
                <span className="text-xs text-blue-500">Guardando...</span>
              )}
              {energyStatus === 'pending' && (
                <span className="text-xs text-yellow-600">Pendiente de sincronizar</span>
              )}
              {energyStatus === 'error' && (
                <span className="text-xs text-red-500">Error al guardar</span>
              )}
              {!isOnline && <span className="text-xs text-orange-600">Offline</span>}
              <Button onClick={resyncEnergy} variant="link" className="p-0 h-auto text-xs">Reintentar</Button>
            </div>
          </div>

          {isCurrentDate && (
            <div className="mb-4">
              <EnergySelector
                onSelect={addEntry}
                disabled={energyStatus === 'saving' || !isOnline}
              />
            </div>
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
  );

  return (
    <div className="space-y-4">
      {energyFirst ? energyCard : moodCard}
      {energyFirst ? moodCard : energyCard}
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
