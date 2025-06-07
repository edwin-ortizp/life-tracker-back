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
import { cn } from '@/lib/utils';
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
              <div className="inline-block min-w-full">
                {/* Month labels */}
                <div className="flex gap-1 mb-2 ml-8">
                  {months.map((month, index) => (
                    <div
                      key={month.name}
                      className={cn(
                        'text-xs text-gray-500 text-center',
                        index === 0 ? 'w-8' : 'w-14'
                      )}
                      style={{
                        minWidth: index === 0 ? '32px' : `${Math.ceil(month.days / 7) * 12}px`
                      }}
                    >
                      {month.name.slice(0, 3)}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="flex gap-1">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 text-xs text-gray-500 pr-2">
                    <div className="h-3"></div>
                    <div className="h-3 flex items-center">L</div>
                    <div className="h-3"></div>
                    <div className="h-3 flex items-center">M</div>
                    <div className="h-3"></div>
                    <div className="h-3 flex items-center">V</div>
                    <div className="h-3"></div>
                  </div>

                  {/* Calendar grid */}
                  <div className="flex gap-1">
                    {months.map((month) => {
                      const monthStr = String(month.number).padStart(2, '0');
                      const firstDay = new Date(currentYear, month.number - 1, 1).getDay();
                      const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

                      // Calculate weeks for this month
                      const totalCells = adjustedFirstDay + month.days;
                      const weeks = Math.ceil(totalCells / 7);

                      return (
                        <div key={month.name} className="flex gap-1">
                          {Array.from({ length: weeks }, (_, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                              {Array.from({ length: 7 }, (_, dayIndex) => {
                                const dayNumber = weekIndex * 7 + dayIndex - adjustedFirstDay + 1;

                                if (dayNumber < 1 || dayNumber > month.days) {
                                  return <div key={dayIndex} className="w-3 h-3"></div>;
                                }

                                const dayStr = String(dayNumber).padStart(2, '0');
                                const date = `${currentYear}-${monthStr}-${dayStr}`;
                                const key = `${habit.id}_${date}`;
                                const isLogged = completedHabits[key];
                                const isToday = new Date().toISOString().split('T')[0] === date;

                                return (
                                  <Tooltip key={date}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant={isLogged ? 'destructive' : 'ghost'}
                                        size="icon"
                                        className={cn(
                                          'w-3 h-3 p-0 rounded-sm border transition-all duration-200 hover:scale-110',
                                          isLogged
                                            ? 'bg-red-600 border-red-700 hover:bg-red-700'
                                            : 'bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300',
                                          isToday && 'ring-2 ring-blue-400 ring-offset-1'
                                        )}
                                        onClick={() =>
                                          isLogged
                                            ? onRemoveLog(habit.id, date)
                                            : onLogHabit(habit.id, date)
                                        }
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
                              })}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};