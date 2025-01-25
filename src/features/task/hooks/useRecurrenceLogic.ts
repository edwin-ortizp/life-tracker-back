// src/features/task/hooks/useRecurrenceLogic.ts
import { useState, useEffect } from 'react';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Task } from '../types';

export interface RecurrenceConfig {
  pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency: number;
  customDays?: number;
}

interface UseRecurrenceLogicProps {
  initialDate?: Date;
  initialConfig?: RecurrenceConfig;
}

export const useRecurrenceLogic = ({ initialDate, initialConfig }: UseRecurrenceLogicProps = {}) => {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [config, setConfig] = useState<RecurrenceConfig | undefined>(initialConfig);

  // Calcula la próxima fecha basada en el patrón de recurrencia
  const calculateNextDate = (baseDate: Date, recurrenceConfig?: RecurrenceConfig): Date => {
    if (!recurrenceConfig) return baseDate;
    
    const today = new Date(baseDate);
    today.setHours(12, 0, 0, 0);
    
    switch (recurrenceConfig.pattern) {
      case 'daily':
        return addDays(today, 1);
      case 'weekly':
        return addWeeks(today, 1);
      case 'monthly':
        return addMonths(today, 1);
      case 'custom':
        return addDays(today, recurrenceConfig.customDays || 1);
      default:
        return today;
    }
  };

  // Genera el texto descriptivo de la recurrencia
  const getRecurrenceText = (nextDate: Date, recurrenceConfig?: RecurrenceConfig): string => {
    if (!recurrenceConfig) return '';
    
    const dateText = format(nextDate, "'próximo' EEEE", { locale: es });
    
    switch (recurrenceConfig.pattern) {
      case 'daily':
        return `Diariamente (${dateText})`;
      case 'weekly':
        return `Semanalmente (${dateText})`;
      case 'monthly':
        return `Mensualmente (${format(nextDate, "'próximo' d 'de' MMMM", { locale: es })})`;
      case 'custom':
        return `Cada ${recurrenceConfig.customDays} días (${dateText})`;
      default:
        return '';
    }
  };

  // Actualiza la configuración y recalcula la fecha
  const updateRecurrenceConfig = (newPattern: RecurrenceConfig['pattern'], customDays?: number) => {
    const newConfig: RecurrenceConfig = {
      pattern: newPattern,
      frequency: 1,
      ...(newPattern === 'custom' && { customDays: customDays || 1 })
    };

    setConfig(newConfig);
    setDate(calculateNextDate(new Date(), newConfig));
  };

  // Ajusta la fecha considerando la zona horaria
  const formatDateForInput = (date: Date): string => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  return {
    date,
    setDate,
    config,
    setConfig,
    calculateNextDate,
    getRecurrenceText,
    updateRecurrenceConfig,
    formatDateForInput
  };
};