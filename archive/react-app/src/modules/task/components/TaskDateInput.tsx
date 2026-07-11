import React from 'react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Calendar, X } from 'lucide-react';
import { getLocalDateString } from '@/shared/utils/dates';
import { NativeMobileDatePicker } from '@/shared/components/ui/native-mobile-date-picker';
import { useIsMobile } from '@/shared/hooks/useIsMobile';

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
  const isMobile = useIsMobile();

  // Formatear la fecha para el input usando la utilidad getLocalDateString
  const formatDateForInput = (date: Date): string => {
    return getLocalDateString(date);
  };

  // Función para parsear la fecha del input considerando zona horaria local
  const parseDateFromInput = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date();
    date.setFullYear(year, month - 1, day);
    // Establecer la hora en el mediodía para evitar problemas con zonas horarias
    date.setHours(12, 0, 0, 0);
    return date;
  };

  // Mobile: Use native drawer picker
  if (isMobile) {
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
              className="h-8 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <NativeMobileDatePicker
          value={value}
          onChange={onChange}
          placeholder="Seleccionar fecha"
        />
      </div>
    );
  }

  // Desktop: Use native HTML date input
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