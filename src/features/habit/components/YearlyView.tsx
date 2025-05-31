// src/features/habit/components/YearlyView.tsx
import React from 'react';
import { HABIT_COLORS } from '../types';
import { getMonths } from '../utils/dateUtils';
import { HabitGroup } from './HabitGroup';
import { Button } from '@/components/ui/button';

interface YearlyViewProps {
  completedHabits: { [key: string]: boolean };
  onToggle: (habitId: number, date: string) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({
  completedHabits,
  onToggle
}) => {
  const currentYear = new Date().getFullYear();
  const months = getMonths(currentYear);

  const renderHabitGroup = (habits: Array<{ id: number; icon: React.ReactNode; name: string; goal: string }>) => (
    <div className="overflow-x-auto">
      <div className="min-w-[800px] space-y-6">
        {habits.map((habit) => (
          <div key={habit.id} className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{habit.icon}</span>
              <span className="font-medium">{habit.name}</span>
              <span className="text-sm text-gray-500">{habit.goal}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {months.map((month) => {
                const monthStr = String(month.number).padStart(2, '0');
                
                return (
                  <div key={month.name} className="space-y-1">
                    <div className="text-xs text-gray-500 mb-1">{month.name}</div>
                    <div className="grid grid-cols-7 gap-px">
                      {Array.from({ length: month.days }, (_, day) => {
                        const dayStr = String(day + 1).padStart(2, '0');
                        const date = `${currentYear}-${monthStr}-${dayStr}`;
                        const isCompleted = completedHabits[`${habit.id}_${date}`];
                        
                        return (
                          <Button
                            key={date}
                            variant="ghost"
                            onClick={() => onToggle(habit.id, date)}
                            className={`w-full aspect-square rounded-sm p-0 flex items-center justify-center
                              ${isCompleted
                                ? `${HABIT_COLORS[habit.id]} opacity-75 hover:opacity-100` 
                                : '' // No specific bg for not completed, ghost handles hover
                              }`}
                          >
                            {isCompleted && <div className="w-2 h-2 bg-white/75 rounded-full"></div>}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <HabitGroup completedHabits={completedHabits}>
        {renderHabitGroup}
      </HabitGroup>
    </div>
  );
};