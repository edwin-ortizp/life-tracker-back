// src/features/negative-habits/components/YearlyView/YearlyHabitList.tsx
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { NegativeHabit, NegativeHabitLog } from '../../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import YearlyActivityGrid from '@/components/ui/YearlyActivityGrid';

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
            <YearlyActivityGrid
              year={currentYear}
              renderCell={(date) => {
                const key = `${habit.id}_${date}`;
                const isLogged = completedHabits[key];
                const isToday = new Date().toISOString().split('T')[0] === date;
                return (
                  <Tooltip key={date}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isLogged ? 'destructive' : 'ghost'}
                        onClick={() =>
                          isLogged ? onRemoveLog(habit.id, date) : onLogHabit(habit.id, date)
                        }
                        className={cn(
                          'w-3 h-3 p-0 rounded-full border transition-all duration-200 hover:scale-110',
                          isLogged
                            ? 'bg-red-600 border-red-700 hover:bg-red-700'
                            : 'bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300',
                          isToday && 'ring-2 ring-blue-400 ring-offset-1'
                        )}
                        aria-label={isLogged ? 'Eliminar registro' : 'Registrar hábito'}
                      />
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
                    </TooltipContent>
                  </Tooltip>
                );
              }}
            />
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};
