// src/features/water/components/index.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { WaterProgress } from './WaterProgress';
import { DrinkSelector } from './DrinkSelector';
import { DrinkHistory } from './DrinkHistory';
import { useWaterData } from '../hooks/useWaterData';
import { getLocalDateString } from '@/utils/dates';
import type { WaterProps } from '../types';

export const Water: React.FC<WaterProps> = ({ selectedDate }) => {
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();
  const goal = 2000;

  const {
    intake,
    drinks,
    status,
    error,
    addDrink,
    editDrink,
    deleteDrink
  } = useWaterData(selectedDate);

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tu hidratación</p>
        </CardContent>
      </Card>
    );
  }

  const isCurrentDate = getLocalDateString(selectedDate) === getLocalDateString(new Date());

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <WaterProgress intake={intake} goal={goal} />

        {isCurrentDate && (
          <DrinkSelector
            selectedDrink={selectedDrink}
            onDrinkSelect={setSelectedDrink}
            onAmountSelect={(type, amount) => {
              addDrink(type, amount);
              setSelectedDrink(null);
            }}
            disabled={status === 'saving'}
          />
        )}

        <DrinkHistory
          drinks={drinks}
          showHistory={showHistory}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onDeleteDrink={deleteDrink}
          onEditDrink={editDrink}
          isCurrentDate={isCurrentDate}
        />

        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}

        {status === 'saving' && (
          <p className="mt-2 text-sm text-blue-500">
            Guardando...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Re-export components for easier imports
export * from './WaterProgress';
export * from './DrinkSelector';
export * from './DrinkHistory';

// Default export for the main component
export default Water;