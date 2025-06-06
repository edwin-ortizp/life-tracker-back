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

  const isCurrentDate = getLocalDateString(selectedDate) === getLocalDateString(new Date());  return (
    <Card className="w-full shadow-sm border-0 bg-gradient-to-br from-white to-blue-50/30">
      <CardContent className="p-6 md:p-8">
        <div className="space-y-8">
          <WaterProgress intake={intake} goal={goal} />

          {isCurrentDate && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <DrinkSelector
                selectedDrink={selectedDrink}
                onDrinkSelect={setSelectedDrink}
                onAmountSelect={(type, amount) => {
                  addDrink(type, amount);
                  setSelectedDrink(null);
                }}
                disabled={status === 'saving'}
              />
            </div>
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                {error}
              </p>
            </div>
          )}

          {status === 'saving' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-blue-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                Guardando tu progreso...
              </p>
            </div>
          )}
        </div>
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