// src/modules/exercise/components/TimeRangeSelector.tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

interface TimeRangeSelectorProps {
  value: 'week' | 'month' | 'year';
  onChange: (value: 'week' | 'month' | 'year') => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <Select value={value} onValueChange={onChange as (value: string) => void}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <SelectValue placeholder="Seleccionar período" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Última semana</SelectItem>
        <SelectItem value="month">Último mes</SelectItem>
        <SelectItem value="year">Último año</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default TimeRangeSelector;