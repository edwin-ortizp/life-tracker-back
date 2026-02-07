// src/modules/mood/components/index.tsx
import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useAuth } from '@/shared/hooks/useAuth';
import { MoodSelector } from './MoodSelector';
import { MoodHistory } from './MoodHistory';
import { EnergySelector } from './EnergySelector';
import { EnergyHistory } from './EnergyHistory';
import { useMoodData } from '../controllers/useMoodData.supabase';
import { useEnergyData } from '../controllers/useEnergyData.supabase';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { getLocalDateString } from '@/shared/utils/dates';
import type { MoodProps } from '../models';

export const Mood: React.FC<MoodProps> = ({ selectedDate, energyFirst = false }) => {
  const { user } = useAuth();
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
            </div>
          </div>

          {isCurrentDate && (
            <MoodSelector onSelect={addMood} disabled={status === "saving"} />
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
export * from './EnergySelector';
export * from './EnergyHistory';

export default Mood;
