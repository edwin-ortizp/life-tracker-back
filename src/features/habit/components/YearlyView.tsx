// src/features/habit/components/YearlyView.tsx
import React from 'react';
import { HABITS, HABIT_COLORS } from '../types';
import { getDaysInMonth } from '../utils/dateUtils';

interface YearlyViewProps {
  completedHabits: { [key: string]: boolean };
  onToggle: (habitId: number, date: string) => void;
}

export const YearlyView: React.FC<YearlyViewProps> = ({
  completedHabits,
  onToggle
}) => {
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => ({
    name: new Date(currentYear, i).toLocaleString('es', { month: 'short' }),
    days: getDaysInMonth(currentYear, i)
  }));

  return (
    <div className="space-y-6 overflow-x-auto">
      {HABITS.map((habit) => (
        <div key={habit.id} className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{habit.icon}</span>
            <span className="font-medium">{habit.name}</span>
            <span className="text-sm text-gray-500">{habit.goal}</span>
          </div>
          <div className="grid grid-cols-12 gap-1 min-w-[800px]">
            {months.map((month, monthIndex) => (
              <div key={month.name} className="space-y-1">
                <div className="text-xs text-gray-500 mb-1">{month.name}</div>
                <div className="grid grid-cols-7 gap-px">
                  {Array.from({ length: month.days }, (_, day) => {
                    const date = new Date(currentYear, monthIndex, day + 1)
                      .toISOString()
                      .split('T')[0];
                    const isCompleted = completedHabits[`${habit.id}_${date}`];
                    
                    return (
                      <button
                        key={date}
                        onClick={() => onToggle(habit.id, date)}
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
