// src/features/negative-habits/components/YearlyView/YearlyHabitList.tsx
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { NegativeHabit, NegativeHabitLog } from '../../types';
import { getMonths } from '../../utils/dates';
// import { cn } from "@/lib/utils"; // cn will be removed
import { Button } from '@/components/ui/button';

interface YearlyHabitListProps {
  habits: NegativeHabit[];
  completedHabits: { [key: string]: NegativeHabitLog };
  onLogHabit: (habitId: number, date: string) => Promise<void>;
  onRemoveLog: (habitId: number, date: string) => Promise<void>;
}

export const YearlyHabitList: React.FC<YearlyHabitListProps> = ({
  habits,
  completedHabits,
  onLogHabit,
  onRemoveLog
}) => {
  const currentYear = new Date().getFullYear();
  const months = getMonths(currentYear);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {habits.map((habit) => (
          <div key={habit.id} className="space-y-2">
            <div className="flex items-center gap-2 sticky top-0 bg-white z-10 py-2">
              <span className="text-xl">{habit.icon}</span>
              <div>
                <h4 className="font-medium">{habit.name}</h4>
                <p className="text-sm text-gray-500">{habit.category}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 min-w-[800px]">
                {months.map((month) => {
                  const monthStr = String(month.number).padStart(2, '0');
                  
                  return (
                    <div key={month.name} className="space-y-1">
                      <div className="text-xs text-gray-500 text-center mb-2">
                        {month.name}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: month.days }, (_, day) => {
                          const dayStr = String(day + 1).padStart(2, '0');
                          const date = `${currentYear}-${monthStr}-${dayStr}`;
                          const key = `${habit.id}_${date}`;
                          const isLogged = completedHabits[key];
                          
                          return (
                            <Tooltip key={date}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={isLogged ? "destructive" : "ghost"}
                                  size="icon"
                                  className="w-3 h-3 p-0 rounded-full transition-all"
                                  onClick={() => isLogged 
                                    ? onRemoveLog(habit.id, date)
                                    : onLogHabit(habit.id, date)
                                  }
                                  aria-label={isLogged ? 'Eliminar registro' : 'Registrar hábito'}
                                >
                                  {/* Content of the button can be empty if color itself indicates state */}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">
                                  {new Date(date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {isLogged ? 'Haz clic para eliminar' : 'Haz clic para registrar'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};