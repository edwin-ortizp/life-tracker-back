import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { useExerciseStatsRange } from '../controllers/useExerciseStatsRange';
import { getMonthDates } from '@/shared/utils/dates';

interface ExerciseCalendarProps {
  selectedDate: Date;
}

export const ExerciseCalendar: React.FC<ExerciseCalendarProps> = ({ selectedDate }) => {
  const { start, end } = useMemo(() => getMonthDates(selectedDate), [selectedDate]);
  const { stats, loading } = useExerciseStatsRange(start, end);

  const maxCalories = useMemo(() => {
    return Math.max(...stats.map(s => s.calories), 100);
  }, [stats]);

  const getColorIntensity = (calories: number) => {
    const intensity = Math.min((calories / maxCalories) * 100, 100);
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 25) return 'bg-orange-200';
    if (intensity < 50) return 'bg-orange-300';
    if (intensity < 75) return 'bg-orange-400';
    return 'bg-orange-500';
  };

  if (loading) {
    return <Card><CardContent className="p-6">Cargando...</CardContent></Card>;
  }

  const statsMap = new Map(stats.map(({ date, calories }) => [date, calories]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario de Ejercicios</CardTitle>
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
            const calories = statsMap.get(dateStr) || 0;

            const isCurrentMonth = currentDate.getMonth() === selectedDate.getMonth();

            return (
              <div
                key={i}
                className={`aspect-square flex flex-col items-center justify-center p-1 rounded ${
                  isCurrentMonth ? getColorIntensity(calories) : 'bg-gray-50'
                }`}
                title={`${dateStr}: ${calories} cal`}
              >
                <span className={`text-xs ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {currentDate.getDate()}
                </span>
                {isCurrentMonth && calories > 0 && (
                  <span className="text-xs font-bold text-gray-900">
                    {calories}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs">
          <span>Menos</span>
          <div className="flex gap-1">
            {['bg-gray-100', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400', 'bg-orange-500'].map((color, i) => (
              <div key={i} className={`w-4 h-4 rounded ${color}`} />
            ))}
          </div>
          <span>Más</span>
        </div>
      </CardContent>
    </Card>
  );
};
