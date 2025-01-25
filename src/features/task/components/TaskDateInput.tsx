import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { getLocalDateString } from '@/utils/dates';

interface TaskDateInputProps {
  value?: Date;
  onChange: (date?: Date) => void;
  showClearButton?: boolean;
  label?: string;
}

export const TaskDateInput: React.FC<TaskDateInputProps> = ({
  value,
  onChange,
  showClearButton = false,
  label = "Fecha límite"
}) => {
  // Función para formatear la fecha para el input considerando zona horaria local
  const formatDateForInput = (date: Date): string => {
    return getLocalDateString(date);
  };

  // Función para parsear la fecha del input considerando zona horaria local
  const parseDateFromInput = (dateString: string): Date => {
    const date = new Date(dateString);
    // Establecer la hora en el mediodía para evitar problemas con zonas horarias
    date.setHours(12, 0, 0, 0);
    return date;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {label}
        </label>
        {showClearButton && value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
          >
            Quitar fecha
          </Button>
        )}
      </div>
      <Input
        type="date"
        value={value ? formatDateForInput(value) : ''}
        onChange={(e) => {
          if (!e.target.value) {
            onChange(undefined);
            return;
          }
          const date = parseDateFromInput(e.target.value);
          onChange(date);
        }}
      />
    </div>
  );
};
