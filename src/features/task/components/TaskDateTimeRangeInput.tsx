import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, X, Clock } from 'lucide-react';
import { getLocalDateString, adjustEndDateToStartDate } from '@/utils/dates';
import { NativeMobileDatePicker } from '@/components/ui/native-mobile-date-picker';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { format } from 'date-fns';

interface TaskDateTimeRangeInputProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
  showClearButton?: boolean;
}

// Generar opciones de hora cada 30 minutos de 06:00 a 22:00
const generateTimeOptions = (): string[] => {
  const times: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    times.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < 22) {
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return times;
};

export const TaskDateTimeRangeInput: React.FC<TaskDateTimeRangeInputProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showClearButton = false,
}) => {
  const isMobile = useIsMobile();
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  // Formatear la fecha para el input usando la utilidad getLocalDateString
  const formatDateForInput = (date: Date): string => {
    return getLocalDateString(date);
  };

  // Extraer hora y minuto de una fecha
  const getTimeString = (date: Date): string => {
    return format(date, 'HH:mm');
  };

  // Crear fecha desde string de fecha y hora
  const createDateFromInputs = (dateString: string, timeString?: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date();
    date.setFullYear(year, month - 1, day);

    if (timeString) {
      const [hour, minute] = timeString.split(':').map(Number);
      date.setHours(hour, minute, 0, 0);
    } else {
      // Sin hora específica, establecer al mediodía para evitar problemas de zona horaria
      date.setHours(12, 0, 0, 0);
    }

    return date;
  };

  // Handlers para fecha de inicio
  const handleStartDateChange = (dateString: string | undefined) => {
    if (!dateString) {
      onStartDateChange(undefined);
      return;
    }

    const timeString = startDate ? getTimeString(startDate) : undefined;
    const newStartDate = createDateFromInputs(dateString, timeString);

    // Ajustar endDate si es necesario para preservar la duración
    if (endDate) {
      const newEndDate = adjustEndDateToStartDate(startDate, endDate, newStartDate);
      onEndDateChange(newEndDate);
    }

    onStartDateChange(newStartDate);
  };

  const handleStartTimeChange = (timeString: string) => {
    if (!startDate) return;

    const dateString = formatDateForInput(startDate);
    const newStartDate = createDateFromInputs(dateString, timeString);

    // Ajustar endDate si es necesario para preservar la duración
    if (endDate) {
      const newEndDate = adjustEndDateToStartDate(startDate, endDate, newStartDate);
      onEndDateChange(newEndDate);
    }

    onStartDateChange(newStartDate);
  };

  // Handlers para fecha de fin
  const handleEndDateChange = (dateString: string | undefined) => {
    if (!dateString) {
      onEndDateChange(undefined);
      return;
    }

    const timeString = endDate ? getTimeString(endDate) : undefined;
    const newDate = createDateFromInputs(dateString, timeString);
    onEndDateChange(newDate);
  };

  const handleEndTimeChange = (timeString: string) => {
    if (!endDate) return;

    const dateString = formatDateForInput(endDate);
    const newDate = createDateFromInputs(dateString, timeString);
    onEndDateChange(newDate);
  };

  // Botones rápidos de duración
  const handleQuickDuration = (minutes: number) => {
    if (!startDate) return;

    const newEndDate = new Date(startDate.getTime() + minutes * 60 * 1000);
    onEndDateChange(newEndDate);
  };

  const handleRemoveTime = () => {
    if (startDate) {
      const dateString = formatDateForInput(startDate);
      const newDate = createDateFromInputs(dateString); // Sin hora
      onStartDateChange(newDate);
    }
    onEndDateChange(undefined);
  };

  return (
    <div className="space-y-4">
      {/* Fecha y Hora de Inicio */}
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

        <div className="flex gap-2">
          {/* Date input */}
          {isMobile ? (
            <div className="flex-1">
              <NativeMobileDatePicker
                value={startDate}
                onChange={onStartDateChange}
                placeholder="Seleccionar fecha"
              />
            </div>
          ) : (
            <Input
              type="date"
              className="flex-1"
              value={startDate ? formatDateForInput(startDate) : ''}
              onChange={(e) => handleStartDateChange(e.target.value || undefined)}
            />
          )}

          {/* Time select */}
          <Select
            value={startDate ? getTimeString(startDate) : ''}
            onValueChange={handleStartTimeChange}
            disabled={!startDate}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Hora">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {startDate ? getTimeString(startDate) : 'Hora'}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fecha y Hora de Fin */}
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

        <div className="flex gap-2">
          {/* Date input */}
          {isMobile ? (
            <div className="flex-1">
              <NativeMobileDatePicker
                value={endDate}
                onChange={onEndDateChange}
                placeholder="Seleccionar fecha"
              />
            </div>
          ) : (
            <Input
              type="date"
              className="flex-1"
              value={endDate ? formatDateForInput(endDate) : ''}
              onChange={(e) => handleEndDateChange(e.target.value || undefined)}
            />
          )}

          {/* Time select */}
          <Select
            value={endDate ? getTimeString(endDate) : ''}
            onValueChange={handleEndTimeChange}
            disabled={!endDate}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Hora">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {endDate ? getTimeString(endDate) : 'Hora'}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botones rápidos de duración */}
      {startDate && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-600 w-full">Duración rápida:</span>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveTime}
            className="h-7 text-xs"
          >
            Sin hora
          </Button>
        </div>
      )}
    </div>
  );
};
