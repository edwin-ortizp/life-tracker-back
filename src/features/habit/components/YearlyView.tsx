// src/features/habit/components/YearlyView.tsx
import React from 'react';
import { getMonths } from '../utils/dateUtils';
import { HabitGroup } from './HabitGroup';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="space-y-8">
      {habits.map((habit) => (
        <div key={habit.id} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">{habit.icon}</span>
            <div>
              <span className="font-semibold text-base">{habit.name}</span>
              <span className="text-sm text-gray-600 ml-2">({habit.goal})</span>
            </div>
          </div>
          
          {/* GitHub-style contribution graph */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Month labels */}
              <div className="flex gap-1 mb-2 ml-8">
                {months.map((month, index) => (
                  <div 
                    key={month.name} 
                    className={cn(
                      "text-xs text-gray-500 text-center",
                      index === 0 ? "w-8" : "w-14"
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
                    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
                    
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
                              const isCompleted = completedHabits[`${habit.id}_${date}`];
                              const isToday = new Date().toISOString().split('T')[0] === date;
                              
                              return (
                                <Button
                                  key={dayIndex}
                                  variant="ghost"
                                  onClick={() => onToggle(habit.id, date)}
                                  className={cn(
                                    "w-3 h-3 p-0 rounded-sm border transition-all duration-200 hover:scale-110",
                                    isCompleted
                                      ? "bg-green-600 border-green-700 hover:bg-green-700"
                                      : "bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300",
                                    isToday && "ring-2 ring-blue-400 ring-offset-1"
                                  )}
                                  title={`${habit.name} - ${dayNumber}/${month.number}/${currentYear}${isCompleted ? ' (Completado)' : ''}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
                <span>Menos</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-200 border border-green-300 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-400 border border-green-500 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-600 border border-green-700 rounded-sm"></div>
                </div>
                <span>Más</span>
              </div>
            </div>
          </div>
        </div>
      ))}
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