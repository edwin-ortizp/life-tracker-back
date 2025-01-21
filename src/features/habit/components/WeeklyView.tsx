// src/features/habit/components/WeeklyView.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { HABIT_COLORS } from '../types';
import { getWeekDays } from '../utils/dateUtils';
import { HabitGroup } from './HabitGroup';

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
  const weekDays = getWeekDays(new Date());

  const renderHabitGroup = (habits: Array<{ id: number; icon: React.ReactNode; name: string; goal: string }>) => (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[minmax(120px,1fr)_repeat(7,minmax(40px,1fr))] gap-2">
          <div></div>
          {weekDays.map(day => (
            <div key={day.fullDate} className="text-center">
              <div className="font-medium">{day.dayName}</div>
              <div className="text-[10px] text-gray-400">
                {day.fullDate.split('-').slice(1).join('/')}
              </div>
            </div>
          ))}
          
          {habits.map(habit => (
            <React.Fragment key={habit.id}>
              <div className="flex items-center gap-2">
                <span>{habit.icon}</span>
                <div className="flex flex-col">
                  <span className="text-sm">{habit.name}</span>
                  <span className="text-xs text-gray-500">{habit.goal}</span>
                </div>
              </div>
              {weekDays.map((day) => (
                <button
                  key={`${habit.id}_${day.fullDate}`}
                  className={`h-15 w-10 aspect-square rounded-lg flex items-center justify-center transition-colors mx-auto my-1
                    ${completedHabits[`${habit.id}_${day.fullDate}`] 
                      ? HABIT_COLORS[habit.id]
                      : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  onClick={() => onToggle(habit.id, day.fullDate)}
                  disabled={disabled}
                >
                  {completedHabits[`${habit.id}_${day.fullDate}`] && 
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  }
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
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