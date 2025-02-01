// src/features/negative-habits/components/WeeklyView/WeeklyHabitList.tsx
import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { NegativeHabit, NegativeHabitLog, CATEGORY_COLORS } from '../../types';

interface WeekDay {
  dayName: string;
  fullDate: string;
}

interface WeeklyHabitListProps {
  habits: NegativeHabit[];
  completedHabits: { [key: string]: NegativeHabitLog };
  weekDays: WeekDay[];
  onLogHabit: (habitId: number, date: string) => Promise<void>;
  onRemoveLog: (habitId: number, date: string) => Promise<void>;
  disabled?: boolean;
}

export const WeeklyHabitList: React.FC<WeeklyHabitListProps> = ({
  habits,
  completedHabits,
  weekDays,
  onLogHabit,
  onRemoveLog,
  disabled
}) => {
  return (
    <TooltipProvider>
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
                <span className="text-xs text-gray-500">{habit.category}</span>
              </div>
            </div>
            
            {weekDays.map((day) => {
              const key = `${habit.id}_${day.fullDate}`;
              const isLogged = completedHabits[key];
              
              return (
                <div key={key} className="flex items-center justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isLogged ? "destructive" : "outline"}
                        size="icon"
                        className={`w-10 h-10 p-0 ${
                          isLogged ? "bg-red-500 hover:bg-red-600" : ""
                        }`}
                        onClick={() => isLogged 
                          ? onRemoveLog(habit.id, day.fullDate)
                          : onLogHabit(habit.id, day.fullDate)
                        }
                        disabled={disabled}
                      >
                        {isLogged ? (
                          <X className="w-4 h-4 text-white" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isLogged ? 'Eliminar registro' : 'Registrar hábito'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
};