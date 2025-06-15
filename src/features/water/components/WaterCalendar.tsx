import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useWaterStatsRange } from '../hooks/useWaterStatsRange';
import { getLocalDateString } from '@/utils/dates';
import { Loader2 } from 'lucide-react';

interface WaterCalendarProps {
  selectedDate: Date;
  goal?: number;
}

export const WaterCalendar: React.FC<WaterCalendarProps> = ({ selectedDate, goal = 2500 }) => {
  const [month, setMonth] = useState(startOfMonth(selectedDate));

  useEffect(() => {
    setMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd = useMemo(() => endOfMonth(month), [month]);

  const { stats, loading } = useWaterStatsRange(monthStart, monthEnd);

  const intakeMap = useMemo(() => {
    const map: Record<string, number> = {};
    stats?.dailyStats.forEach(({ date, intake }) => {
      map[date] = intake;
    });
    return map;
  }, [stats]);

  const DayContent = (props: { date: Date; displayMonth: Date; activeModifiers: Record<string, boolean> }) => {
    const dateStr = getLocalDateString(props.date);
    const intake = intakeMap[dateStr] || 0;
    const percentage = Math.min(intake / goal, 1);
    const size = 28;
    const stroke = 3;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - percentage * circumference;
    const reached = intake >= goal;

    return (
      <div className="relative flex items-center justify-center w-7 h-7">
        <svg width={size} height={size} className="absolute">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={reached ? '#bfdbfe' : '#e5e7eb'}
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={reached ? '#3b82f6' : '#9ca3af'}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <span className="text-[10px] font-medium z-10">{props.date.getDate()}</span>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Historial Mensual</CardTitle>
      </CardHeader>
      <CardContent className="relative p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        <Calendar
          month={month}
          onMonthChange={setMonth}
          showOutsideDays
          components={{ DayContent }}
          className="p-0 w-full"
        />
      </CardContent>
    </Card>
  );
};

export default WaterCalendar;
