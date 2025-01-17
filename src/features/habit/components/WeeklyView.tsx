// src/features/habit/components/WeeklyView.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { HABITS, HABIT_COLORS } from '../types';
import { getWeekDays } from '../utils/dateUtils';

interface WeeklyViewProps {
  completedHabits: { [key: string]: boolean };
  onToggle: (habitId: number, date: string) => void;
  disabled?: boolean;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  completedHabits,
  onToggle,
  disabled
}) => {
  const weekDays = getWeekDays();

  return (
    <div className="grid grid-cols-[1fr_repeat(7,40px)] gap-2">
      <div></div>
      {weekDays.map(day => (
        <div key={day.fullDate} className="text-center">
          <div className="font-medium">{day.dayName}</div>
          <div className="text-[10px] text-gray-400">
            {day.fullDate.split('-').slice(1).join('/')}
          </div>
        </div>
      ))}
      
      {HABITS.map(habit => (
        <React.Fragment key={habit.id}>
          <div className="flex items-center gap-2">
            <span>{habit.icon}</span>
            <div className="flex flex-col">
              <span>{habit.name}</span>
              <span className="text-xs text-gray-500">{habit.goal}</span>
            </div>
          </div>
          {weekDays.map((day) => (
            <button
              key={`${habit.id}_${day.fullDate}`}
              className={`aspect-square rounded-lg flex items-center justify-center transition-colors
                ${completedHabits[`${habit.id}_${day.fullDate}`] 
                  ? HABIT_COLORS[habit.id]
                  : 'bg-gray-50 hover:bg-gray-100'
                }`}
              onClick={() => onToggle(habit.id, day.fullDate)}
              disabled={disabled}
            >
              {completedHabits[`${habit.id}_${day.fullDate}`] && 
                <CheckCircle className="w-5 h-5 text-white" />
              }
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};