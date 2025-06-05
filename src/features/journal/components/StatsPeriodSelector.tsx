import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface StatsPeriodSelectorProps {
  onPeriodChange: (startDate: Date, endDate: Date) => void;
}

type PeriodOption = {
  label: string;
  getValue: (currentDate: Date) => { start: Date; end: Date };
};

const PERIOD_OPTIONS: Record<string, PeriodOption> = {
  currentWeek: {
    label: 'Semana actual',
    getValue: (currentDate) => ({
      start: startOfWeek(currentDate),
      end: endOfWeek(currentDate)
    })
  },
  currentMonth: {
    label: 'Mes actual',
    getValue: (currentDate) => ({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    })
  }
};

export const StatsPeriodSelector: React.FC<StatsPeriodSelectorProps> = ({ onPeriodChange }) => {
  const handlePeriodSelect = (value: string) => {
    const currentDate = new Date();
    const period = PERIOD_OPTIONS[value];
    if (period) {
      const { start, end } = period.getValue(currentDate);
      onPeriodChange(start, end);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-sm font-medium">Mostrar período:</span>
      <Select onValueChange={handlePeriodSelect} defaultValue="currentWeek">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PERIOD_OPTIONS).map(([value, { label }]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatsPeriodSelector;
