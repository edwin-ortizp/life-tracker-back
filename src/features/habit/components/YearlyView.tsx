// src/features/habit/components/YearlyView.tsx
import React from 'react';
import { HabitGroup } from './HabitGroup';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import YearlyActivityGrid from '@/components/ui/YearlyActivityGrid';

interface YearlyViewProps {
  completedHabits: { [key: string]: boolean };
  onToggle: (habitId: number, date: string) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({
  completedHabits,
  onToggle
}) => {
  const currentYear = new Date().getFullYear();

  const renderHabitGroup = (
    habits: Array<{ id: number; icon: React.ReactNode; name: string; goal: string }>
  ) => (
    <div className="space-y-8">
      {habits.map((habit) => (
        <div key={habit.id} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">{habit.icon}</span>
            <div>
              <span className="font-semibold text-base">{habit.name}</span>
              <span className="text-sm text-gray-600 ml-2">({habit.goal})</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <YearlyActivityGrid
              year={currentYear}
              renderCell={(date) => {
                const isCompleted = completedHabits[`${habit.id}_${date}`];
                const isToday = new Date().toISOString().split('T')[0] === date;
                return (
                  <Button
                    variant="ghost"
                    onClick={() => onToggle(habit.id, date)}
                    className={cn(
                      'w-3 h-3 p-0 rounded-full border transition-all duration-200 hover:scale-110',
                      isCompleted
                        ? 'bg-green-600 border-green-700 hover:bg-green-700'
                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300',
                      isToday && 'ring-2 ring-blue-400 ring-offset-1'
                    )}
                    title={`${habit.name} - ${new Date(date).toLocaleDateString('es-ES')}${isCompleted ? ' (Completado)' : ''}`}
                  />
                );
              }}
            />

            <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-full"></div>
                <div className="w-3 h-3 bg-green-200 border border-green-300 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 border border-green-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-600 border border-green-700 rounded-full"></div>
              </div>
              <span>Más</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      <HabitGroup completedHabits={completedHabits}>{renderHabitGroup}</HabitGroup>
    </div>
  );
};
