// src/features/water/components/StatsPeriodSelector.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMonths, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

interface StatsPeriodSelectorProps {
  onPeriodChange: (startDate: Date, endDate: Date) => void;
}

type PeriodOption = {
  label: string;
  getValue: (currentDate: Date) => { start: Date; end: Date };
};

const PERIOD_OPTIONS: Record<string, PeriodOption> = {
  lastMonth: {
    label: 'Último mes',
    getValue: (currentDate) => ({
      start: startOfMonth(subMonths(currentDate, 1)),
      end: endOfMonth(subMonths(currentDate, 1))
    })
  },
  currentMonth: {
    label: 'Mes actual',
    getValue: (currentDate) => ({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    })
  },
  last3Months: {
    label: 'Últimos 3 meses',
    getValue: (currentDate) => ({
      start: startOfMonth(subMonths(currentDate, 2)),
      end: endOfMonth(currentDate)
    })
  },
  last6Months: {
    label: 'Últimos 6 meses',
    getValue: (currentDate) => ({
      start: startOfMonth(subMonths(currentDate, 5)),
      end: endOfMonth(currentDate)
    })
  },
  lastYear: {
    label: 'Último año',
    getValue: (currentDate) => ({
      start: startOfYear(subYears(currentDate, 1)),
      end: endOfYear(subYears(currentDate, 1))
    })
  },
  currentYear: {
    label: 'Año actual',
    getValue: (currentDate) => ({
      start: startOfYear(currentDate),
      end: endOfYear(currentDate)
    })
  }
};

export const StatsPeriodSelector: React.FC<StatsPeriodSelectorProps> = ({
  onPeriodChange
}) => {
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
      <Select onValueChange={handlePeriodSelect} defaultValue="currentMonth">
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