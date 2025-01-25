// src/features/habit/components/index.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { HabitViewToggle } from './HabitViewToggle';
import { WeeklyView } from './WeeklyView';
import { YearlyView } from './YearlyView';
import { useHabitData } from '../hooks/useHabitData';
import type { HabitProps } from '../types';
import PageLayout from '@/components/PageLayout';

// Exports
export * from './HabitViewToggle';
export * from './WeeklyView';
export * from './YearlyView';

// Main component
export const Habit: React.FC<HabitProps> = () => {
  const [view, setView] = useState<'weekly' | 'graph'>('weekly');
  const { user } = useAuth();
  const {
    completedHabits,
    status,
    error,
    toggleHabit
  } = useHabitData();

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
    <PageLayout>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-medium text-lg">Hábitos</h3>
            <HabitViewToggle
              view={view}
              onViewChange={setView}
            />
          </div>

          {view === 'weekly' ? (
            <WeeklyView
              completedHabits={completedHabits}
              onToggle={toggleHabit}
              disabled={status === 'saving'}
            />
          ) : (
            <YearlyView
              completedHabits={completedHabits}
              onToggle={toggleHabit}
            />
          )}

          {error && (
            <p className="mt-4 text-sm text-red-500">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Habit;