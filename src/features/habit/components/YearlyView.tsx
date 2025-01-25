// src/features/habit/components/YearlyView.tsx
import React from 'react';
import { HABIT_COLORS } from '../types';
import { getMonths } from '../utils/dateUtils';
import { HabitGroup } from './HabitGroup';

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
      <div className="space-y-6">
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
                          <button
                            key={date}
                            onClick={() => onToggle(habit.id, date)}
                            title={`Toggle ${habit.name} for ${date}`}
                            className={`w-full aspect-square rounded-sm ${
                              isCompleted 
                                ? `${HABIT_COLORS[habit.id]} opacity-75 hover:opacity-100` 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          />
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