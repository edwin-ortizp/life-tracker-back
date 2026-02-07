import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { getLocalDateString, adjustEndDateToStartDate } from '@/shared/utils/dates';
import { format } from 'date-fns';

interface TaskDateTimeRangeInputProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
  showClearButton?: boolean;
}

const DEFAULT_HOUR = 8;
const DEFAULT_MINUTE = 0;

export const TaskDateTimeRangeInput: React.FC<TaskDateTimeRangeInputProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showClearButton = false,
}) => {
  const formatDateForInput = (date: Date): string => {
    return getLocalDateString(date);
  };

  const getTimeString = (date: Date): string => {
    return format(date, 'HH:mm');
  };

  const parseTimeString = (timeString?: string) => {
    if (!timeString) {
      return { hours: DEFAULT_HOUR, minutes: DEFAULT_MINUTE };
    }
    const [hour, minute] = timeString.split(':').map(Number);
    return { hours: hour, minutes: minute };
  };

  const createDateFromInputs = (dateString: string, timeString?: string, baseDate?: Date): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date();
    date.setFullYear(year, month - 1, day);

    if (timeString || !baseDate) {
      const { hours, minutes } = parseTimeString(timeString);
      date.setHours(hours, minutes, 0, 0);
    } else {
      date.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
    }

    return date;
  };

  const handleStartDateChange = (dateString: string | undefined) => {
    if (!dateString) {
      onStartDateChange(undefined);
      return;
    }

    const newStartDate = createDateFromInputs(dateString, undefined, startDate);

    if (endDate) {
      const newEndDate = adjustEndDateToStartDate(startDate, endDate, newStartDate);
      onEndDateChange(newEndDate);
    }

    onStartDateChange(newStartDate);
  };

  const handleStartTimeChange = (timeString: string) => {
    if (!startDate) return;

    const dateString = formatDateForInput(startDate);
    const newStartDate = createDateFromInputs(dateString, timeString || undefined);

    if (endDate) {
      const newEndDate = adjustEndDateToStartDate(startDate, endDate, newStartDate);
      onEndDateChange(newEndDate);
    }

    onStartDateChange(newStartDate);
  };

  const handleEndDateChange = (dateString: string | undefined) => {
    if (!dateString) {
      onEndDateChange(undefined);
      return;
    }

    const newDate = createDateFromInputs(dateString, undefined, endDate);
    onEndDateChange(newDate);
  };

  const handleEndTimeChange = (timeString: string) => {
    if (!endDate) return;

    const dateString = formatDateForInput(endDate);
    const newDate = createDateFromInputs(dateString, timeString || undefined);
    onEndDateChange(newDate);
  };

  const handleQuickDuration = (minutes: number) => {
    if (!startDate) return;

    const newEndDate = new Date(startDate.getTime() + minutes * 60 * 1000);
    onEndDateChange(newEndDate);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Fecha y Hora de Inicio
          </label>
          {showClearButton && startDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStartDateChange(undefined)}
              className="h-8 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-2">
          <Input
            type="date"
            className="w-full"
            value={startDate ? formatDateForInput(startDate) : ''}
            onChange={(e) => handleStartDateChange(e.target.value || undefined)}
          />
          <Input
            type="time"
            step="60"
            className="w-full"
            value={startDate ? getTimeString(startDate) : ''}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            disabled={!startDate}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Fecha y Hora de Fin (opcional)
          </label>
          {endDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEndDateChange(undefined)}
              className="h-8 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,7fr)_minmax(0,3fr)] gap-2">
          <Input
            type="date"
            className="w-full"
            value={endDate ? formatDateForInput(endDate) : ''}
            onChange={(e) => handleEndDateChange(e.target.value || undefined)}
          />
          <Input
            type="time"
            step="60"
            className="w-full"
            value={endDate ? getTimeString(endDate) : ''}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            disabled={!endDate}
          />
        </div>
      </div>

      {startDate && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-600 w-full">Duracion rapida:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDuration(30)}
            className="h-7 text-xs"
          >
            30 min
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDuration(60)}
            className="h-7 text-xs"
          >
            1 hora
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDuration(120)}
            className="h-7 text-xs"
          >
            2 horas
          </Button>
        </div>
      )}
    </div>
  );
};
