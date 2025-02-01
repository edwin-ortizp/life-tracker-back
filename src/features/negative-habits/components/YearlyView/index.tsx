// src/features/negative-habits/components/YearlyView/index.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { YearlyHabitList } from './YearlyHabitList';
import { YearlyViewProps } from '../../types';
import { NEGATIVE_HABITS } from '../../types';

export const YearlyView: React.FC<YearlyViewProps> = ({
  habits,
  onLogHabit,
  onRemoveLog
}) => {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div className="min-w-[800px] pb-4">
          <YearlyHabitList
            habits={NEGATIVE_HABITS}
            completedHabits={habits}
            onLogHabit={onLogHabit}
            onRemoveLog={onRemoveLog}
          />
        </div>
      </div>

      <Alert variant="destructive" className="bg-red-50">
        <AlertDescription>
          Vista anual de tus hábitos negativos. Cada día marcado representa un hábito registrado.
          Usa esta vista para identificar patrones y trabajar en mejorarlos.
        </AlertDescription>
      </Alert>
    </div>
  );
};