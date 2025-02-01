// src/features/negative-habits/components/YearlyView/YearlyHabitList.tsx
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { X, AlertCircle } from 'lucide-react';
import { NegativeHabit, NegativeHabitLog, CATEGORY_COLORS } from '../../types/index';
import { getMonths } from '../../utils/dates';

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
      <div className="space-y-8">
        {habits.map((habit) => (
          <div key={habit.id} className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{habit.icon}</span>
              <div>
                <h4 className="font-medium">{habit.name}</h4>
                <p className="text-sm text-gray-500">{habit.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-1">
              {months.map((month) => {
                const monthStr = String(month.number).padStart(2, '0');
                
                return (
                  <div key={month.name} className="space-y-1">
                    <div className="text-xs text-gray-500 text-center mb-1">
                      {month.name}
                    </div>
                    <div className="grid grid-cols-7 gap-px">
                      {Array.from({ length: month.days }, (_, day) => {
                        const dayStr = String(day + 1).padStart(2, '0');
                        const date = `${currentYear}-${monthStr}-${dayStr}`;
                        const key = `${habit.id}_${date}`;
                        const isLogged = completedHabits[key];
                        
                        return (
                          <Tooltip key={date}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isLogged ? "destructive" : "outline"}
                                size="icon"
                                className={`w-6 h-6 p-0 ${
                                  isLogged ? "bg-red-500 hover:bg-red-600" : ""
                                }`}
                                onClick={() => isLogged 
                                  ? onRemoveLog(habit.id, date)
                                  : onLogHabit(habit.id, date)
                                }
                              >
                                {isLogged ? (
                                  <X className="w-3 h-3 text-white" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 text-gray-400" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{date}</p>
                              <p>{isLogged ? 'Eliminar registro' : 'Registrar hábito'}</p>
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
        ))}
      </div>
    </TooltipProvider>
  );
};