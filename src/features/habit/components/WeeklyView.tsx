// src/features/habit/components/WeeklyView.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { HABIT_COLORS } from '../types';
import { getWeekDays } from '../utils/dateUtils';
import { HabitGroup } from './HabitGroup';
import { Button } from '@/components/ui/button';

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
  const renderHabitGroup = (habits: Array<{ id: number; icon: React.ReactNode; name: string; goal: string }>) => (    <div className="overflow-x-auto">
      <div className="min-w-[480px] sm:min-w-[600px]"><div className="grid grid-cols-[minmax(80px,140px)_repeat(7,minmax(32px,1fr))] sm:grid-cols-[minmax(120px,180px)_repeat(7,minmax(40px,1fr))] gap-1 sm:gap-2">
          <div></div>
          {weekDays.map(day => (
            <div key={day.fullDate} className="text-center">
              <div className="font-medium text-xs sm:text-sm">{day.dayName}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-400">
                {day.fullDate.split('-').slice(1).join('/')}
              </div>
            </div>
          ))}
          
          {habits.map(habit => (
            <React.Fragment key={habit.id}>
              <div className="flex items-center gap-1 sm:gap-2 pr-1">
                <span className="text-sm sm:text-base shrink-0">{habit.icon}</span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-medium truncate leading-tight">{habit.name}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 truncate leading-tight">{habit.goal}</span>
                </div>
              </div>
              {weekDays.map((day) => {
                const isCompleted = completedHabits[`${habit.id}_${day.fullDate}`];
                return (                  <Button
                    key={`${habit.id}_${day.fullDate}`}
                    variant={isCompleted ? "default" : "outline"}
                    className={`h-8 w-8 sm:h-10 sm:w-10 p-0 aspect-square rounded-lg flex items-center justify-center transition-colors mx-auto my-0.5 sm:my-1
                      ${isCompleted ? HABIT_COLORS[habit.id] : 'border-gray-300'
                      }`}
                    onClick={() => onToggle(habit.id, day.fullDate)}
                    disabled={disabled}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    ) : (
                      null
                    )}
                  </Button>
                );
              })}
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