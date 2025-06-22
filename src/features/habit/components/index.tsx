// src/features/habit/components/index.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { HabitViewToggle } from './HabitViewToggle';
import { WeeklyView } from './WeeklyView';
import { YearlyView } from './YearlyView';
import { useHabitData } from '../hooks/useHabitData';
import type { HabitProps } from '../types';
import { HabitAiMenu } from './HabitAiMenu';
import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Exports
export * from './HabitViewToggle';
export * from './WeeklyView';
export * from './YearlyView';
export * from './HabitAiSuggestion';
export * from './HabitAiMenu';

// Main component
export const Habit: React.FC<HabitProps> = () => {
  const [view, setView] = useState<'weekly' | 'graph'>('weekly');
  const { user } = useAuth();
  const {
    completedHabits,
    status,
    error,
    toggleHabit,
    resync
  } = useHabitData();
  const { isOnline } = useNetworkStatus();

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 text-center">
          <p>Inicia sesión para registrar tus hábitos</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-medium text-lg">Hábitos</h3>
          <div className="flex items-center gap-2">
            <HabitAiMenu completedHabits={completedHabits} />
            <HabitViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        <div className="mb-4" />

        {view === 'weekly' ? (
          <WeeklyView
            completedHabits={completedHabits}
            onToggle={toggleHabit}
            disabled={status === 'saving' || !isOnline}
          />
        ) : (
          <YearlyView
            completedHabits={completedHabits}
            onToggle={toggleHabit}
            disabled={status === 'saving' || !isOnline}
          />
        )}

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}
      </CardContent>
      <CardFooter className="gap-2 text-xs">
        {status === 'saving' && (
          <span className="text-blue-500">Guardando...</span>
        )}
        {status === 'pending' && (
          <span className="text-yellow-600">Pendiente de sincronizar</span>
        )}
        {status === 'saved' && (
          <span className="text-green-600">Sincronizado</span>
        )}
        {status === 'error' && (
          <span className="text-red-600">Error de sincronización</span>
        )}
        {!isOnline && <span className="text-orange-600">Offline</span>}
        <Button onClick={resync} variant="link" className="p-0 h-auto text-xs">
          Reintentar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Habit;