import React, { useCallback, useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getLocalDateString } from '@/shared/utils/dates';
import { useWaterMonthlyProgress, type DailyWaterAggregate } from '../controllers/useWaterMonthlyProgress';

interface WaterMonthlySidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  goalMl?: number;
}

interface CalendarCell {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  dayNumber: number;
  aggregate: DailyWaterAggregate;
}

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const circleRadius = 19;
const circleCircumference = 2 * Math.PI * circleRadius;

const EMPTY_DAY: DailyWaterAggregate = {
  date: '',
  intakeMl: 0,
  entries: 0,
  goalMl: 0,
  percent: 0,
  met: false
};

const getGridStart = (monthStart: Date) => {
  const mondayOffset = (monthStart.getDay() + 6) % 7;
  const start = new Date(monthStart);
  start.setDate(start.getDate() - mondayOffset);
  return start;
};

const getGridEnd = (monthEnd: Date) => {
  const mondayBasedDay = (monthEnd.getDay() + 6) % 7;
  const daysUntilSunday = 6 - mondayBasedDay;
  const end = new Date(monthEnd);
  end.setDate(end.getDate() + daysUntilSunday);
  return end;
};

export const WaterMonthlySidebar: React.FC<WaterMonthlySidebarProps> = ({
  selectedDate,
  onDateChange,
  goalMl
}) => {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selectedDate));

  const { dailyStatsMap, loading, goalMl: resolvedGoalMl } = useWaterMonthlyProgress(visibleMonth, goalMl);
  const todayKey = getLocalDateString(new Date());

  const monthStart = useMemo(() => startOfMonth(visibleMonth), [visibleMonth]);
  const monthEnd = useMemo(() => endOfMonth(visibleMonth), [visibleMonth]);

  const calendarCells = useMemo<CalendarCell[]>(() => {
    const gridStart = getGridStart(monthStart);
    const gridEnd = getGridEnd(monthEnd);

    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => {
      const dateKey = getLocalDateString(day);
      const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
      const aggregate = dailyStatsMap.get(dateKey) ?? {
        ...EMPTY_DAY,
        date: dateKey,
        goalMl: resolvedGoalMl
      };

      return {
        date: day,
        dateKey,
        isCurrentMonth,
        isToday: dateKey === todayKey,
        isFuture: dateKey > todayKey,
        dayNumber: day.getDate(),
        aggregate
      };
    });
  }, [dailyStatsMap, monthEnd, monthStart, resolvedGoalMl, todayKey, visibleMonth]);

  const stats = useMemo(() => {
    const currentMonthDays = calendarCells.filter((cell) => cell.isCurrentMonth);
    const totalDays = currentMonthDays.length;

    let completedDays = 0;
    let hydrationDays = 0;
    let totalIntake = 0;

    currentMonthDays.forEach((cell) => {
      const day = cell.aggregate;
      if (day.met) {
        completedDays += 1;
      }

      if (day.entries > 0) {
        hydrationDays += 1;
        totalIntake += day.intakeMl;
      }
    });

    const averageIntake = hydrationDays > 0 ? Math.round(totalIntake / hydrationDays) : 0;

    const streakEndDate = todayKey < getLocalDateString(monthEnd) ? new Date() : monthEnd;
    const streakDates = eachDayOfInterval({ start: monthStart, end: streakEndDate }).reverse();

    let currentStreak = 0;
    for (const date of streakDates) {
      const key = getLocalDateString(date);
      const day = dailyStatsMap.get(key);

      if (!day || day.entries === 0) {
        continue;
      }

      if (day.met) {
        currentStreak += 1;
        continue;
      }

      break;
    }

    return {
      completedDays,
      hydrationDays,
      totalDays,
      averageIntake,
      currentStreak
    };
  }, [calendarCells, dailyStatsMap, monthEnd, monthStart, todayKey]);

  const monthLabel = useMemo(
    () => format(visibleMonth, 'MMMM yyyy', { locale: es }),
    [visibleMonth]
  );

  const handlePrevMonth = useCallback(() => {
    setVisibleMonth((prev) => startOfMonth(subMonths(prev, 1)));
  }, []);

  const handleNextMonth = useCallback(() => {
    setVisibleMonth((prev) => startOfMonth(addMonths(prev, 1)));
  }, []);

  const handleDayClick = useCallback((cell: CalendarCell) => {
    if (!cell.isCurrentMonth || cell.isFuture) {
      return;
    }

    onDateChange(new Date(cell.date));
  }, [onDateChange]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <CardTitle className="text-base font-semibold capitalize text-center">
            {monthLabel}
          </CardTitle>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAY_LABELS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              const progress = Math.max(0, Math.min(cell.aggregate.percent, 100));
              const dashOffset = circleCircumference - (progress / 100) * circleCircumference;
              const isSelectable = cell.isCurrentMonth && !cell.isFuture;

              let strokeColor = '#e9ecef';
              if (cell.aggregate.entries > 0) {
                strokeColor = cell.aggregate.percent > 100 ? '#0d6efd' : '#4098ff';
              }

              if (cell.isFuture) {
                strokeColor = '#dee2e6';
              }

              return (
                <Tooltip key={cell.dateKey}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleDayClick(cell)}
                      disabled={!isSelectable}
                      className={cn(
                        'relative flex h-12 w-12 items-center justify-center rounded-full transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        !cell.isCurrentMonth && 'opacity-45',
                        cell.isFuture && 'cursor-not-allowed opacity-55',
                        cell.isToday && 'bg-blue-500/10 ring-1 ring-blue-500/25',
                        isSelectable && 'hover:bg-muted/60'
                      )}
                    >
                      <svg className="absolute h-11 w-11 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                        <circle
                          cx="24"
                          cy="24"
                          r={circleRadius}
                          fill="none"
                          stroke={cell.isFuture ? '#edf0f2' : '#e9ecef'}
                          strokeWidth="4"
                        />
                        {cell.aggregate.entries > 0 && !cell.isFuture && (
                          <circle
                            cx="24"
                            cy="24"
                            r={circleRadius}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={circleCircumference}
                            strokeDashoffset={dashOffset}
                          />
                        )}
                      </svg>

                      <span
                        className={cn(
                          'relative z-10 text-sm font-semibold',
                          cell.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
                          cell.aggregate.entries === 0 && 'text-muted-foreground',
                          cell.isFuture && 'text-muted-foreground/80'
                        )}
                      >
                        {cell.dayNumber}
                      </span>
                    </button>
                  </TooltipTrigger>

                  <TooltipContent side="left" className="max-w-[220px] space-y-1 text-sm">
                    <p className="font-medium capitalize">
                      {format(cell.date, 'EEEE d MMMM', { locale: es })}
                    </p>
                    <p>{Math.round(cell.aggregate.intakeMl)} / {Math.round(cell.aggregate.goalMl)} ml</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(cell.aggregate.percent)}% del objetivo
                    </p>
                    {cell.aggregate.met && (
                      <p className="text-xs font-medium text-green-600">✓ Objetivo cumplido</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {loading && (
          <p className="text-xs text-muted-foreground">Cargando progreso mensual...</p>
        )}

        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold">Estadísticas del mes</h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Card className="border border-border bg-[#f8f9fa]">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Racha actual</p>
                <p className="mt-1 text-lg font-semibold text-blue-600">
                  {stats.currentStreak} días <Droplets className="mb-1 ml-1 inline h-4 w-4 text-blue-600" />
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-[#f8f9fa]">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Días cumplidos</p>
                <p className="mt-1 text-lg font-semibold">
                  {stats.completedDays} / {stats.totalDays}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-[#f8f9fa]">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Días con hidratación</p>
                <p className="mt-1 text-lg font-semibold">
                  {stats.hydrationDays} / {stats.totalDays}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-[#f8f9fa] sm:col-span-2 lg:col-span-1 xl:col-span-2">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Promedio diario</p>
                <p className="mt-1 text-lg font-semibold">
                  {stats.averageIntake} ml
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaterMonthlySidebar;
