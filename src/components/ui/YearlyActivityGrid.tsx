// src/components/ui/YearlyActivityGrid.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { getMonths } from '@/utils/dates';

export interface YearlyActivityGridProps {
  year: number;
  renderCell: (date: string) => React.ReactNode;
}

export const YearlyActivityGrid: React.FC<YearlyActivityGridProps> = ({ year, renderCell }) => {
  const months = getMonths(year);
  return (
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
            style={{ minWidth: index === 0 ? '32px' : `${Math.ceil(month.days / 7) * 12}px` }}
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
            const firstDay = new Date(year, month.number - 1, 1).getDay();
            const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
            const totalCells = adjustedFirstDay + month.days;
            const weeks = Math.ceil(totalCells / 7);

            return (
              <div key={month.name} className="flex gap-1">
                {Array.from({ length: weeks }, (_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const dayNumber = weekIndex * 7 + dayIndex - adjustedFirstDay + 1;
                      if (dayNumber < 1 || dayNumber > month.days) {
                        return <div key={dayIndex} className="w-3 h-3" />;
                      }
                      const dayStr = String(dayNumber).padStart(2, '0');
                      const date = `${year}-${monthStr}-${dayStr}`;
                      return <React.Fragment key={date}>{renderCell(date)}</React.Fragment>;
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default YearlyActivityGrid;
