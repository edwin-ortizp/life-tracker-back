// src/modules/task/hooks/useRecurrenceLogic.ts
import { useState } from 'react';
import {
  calculateNextRecurrenceDate,
  getRecurrenceText,
  formatDateForInput
} from '@/shared/utils/dates';

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
    return calculateNextRecurrenceDate(
      baseDate,
      recurrenceConfig.pattern,
      recurrenceConfig.customDays
    );
  };

  // Genera el texto descriptivo de la recurrencia
  const getRecurrenceDescription = (nextDate: Date, recurrenceConfig?: RecurrenceConfig): string => {
    if (!recurrenceConfig) return '';
    return getRecurrenceText(
      nextDate,
      recurrenceConfig.pattern,
      recurrenceConfig.customDays
    );
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

  return {
    date,
    setDate,
    config,
    setConfig,
    calculateNextDate,
    getRecurrenceText: getRecurrenceDescription,
    updateRecurrenceConfig,
    formatDateForInput
  };
};