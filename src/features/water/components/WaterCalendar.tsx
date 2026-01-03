import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useWaterStatsRange } from '../hooks/useWaterStatsRange';
import { getMonthDates } from '@/utils/dates';

interface WaterCalendarProps {
  selectedDate: Date;
}

export const WaterCalendar: React.FC<WaterCalendarProps> = ({ selectedDate }) => {
  const { start, end } = useMemo(() => getMonthDates(selectedDate), [selectedDate]);
  const { stats, loading } = useWaterStatsRange(start, end);

  const maxIntake = useMemo(() => {
    return Math.max(...stats.map(s => s.intake), 2000); // Min 2L for scale
  }, [stats]);

  const getColorIntensity = (intake: number) => {
    const intensity = Math.min((intake / maxIntake) * 100, 100);
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 25) return 'bg-blue-200';
    if (intensity < 50) return 'bg-blue-300';
    if (intensity < 75) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  if (loading) {
    return <Card><CardContent className="p-6">Cargando...</CardContent></Card>;
  }

  const statsMap = new Map(stats.map(({ date, intake }) => [date, intake]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario de Hidratación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}

          {Array.from({ length: 35 }, (_, i) => {
            const dayIndex = i - new Date(start).getDay();
            const currentDate = new Date(start);
            currentDate.setDate(currentDate.getDate() + dayIndex);
            const dateStr = currentDate.toISOString().split('T')[0];
            const intake = statsMap.get(dateStr) || 0;

            const isCurrentMonth = currentDate.getMonth() === selectedDate.getMonth();

            return (
              <div
                key={i}
                className={`aspect-square flex flex-col items-center justify-center p-1 rounded ${
                  isCurrentMonth ? getColorIntensity(intake) : 'bg-gray-50'
                }`}
                title={`${dateStr}: ${intake} ml`}
              >
                <span className={`text-xs ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {currentDate.getDate()}
                </span>
                {isCurrentMonth && intake > 0 && (
                  <span className="text-xs font-bold text-gray-900">
                    {(intake / 1000).toFixed(1)}L
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs">
          <span>Menos</span>
          <div className="flex gap-1">
            {['bg-gray-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500'].map((color, i) => (
              <div key={i} className={`w-4 h-4 rounded ${color}`} />
            ))}
          </div>
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  );
};
