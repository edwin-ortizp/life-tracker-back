// src/features/statistics/types/index.ts

/**
 * Datos del resumen diario con métricas de todos los módulos
 */
export interface DailySummaryData {
  journal: {
    words: number;
  };
  mood: {
    count: number;
    average: number; // Promedio de valores numéricos (1-10)
    highest: number; // Valor más alto del día
    lowest: number; // Valor más bajo del día
    details?: Array<{
      emoji: string;
      text: string;
      value: number;
      time: string;
    }>;
  };
  habits: {
    completed: number;
    total: number;
    incompletedByTimeOfDay?: Array<{
      timeOfDay: 'morning' | 'afternoon' | 'night' | 'anytime';
      habits: Array<{
        id: number;
        name: string;
        icon: string;
        goal: string;
      }>;
    }>;
  };
  negativeHabits: {
    count: number;
  };
  exercise: {
    minutes: number;
    calories: number;
  };
  tasks: {
    completed: number; // Tasks completed on this specific day (by updatedAt)
    activeAndOverdue: number; // Incomplete tasks due today or in the past (dueDate <= today)
    todayPending: number; // Incomplete tasks due today only
    overdue: number; // Incomplete tasks due in the past
  };
  pomodoro: {
    count: number;
    expectedMinutes: number;
    workMinutes: number;
    completionRate: number; // As a percentage
    averageSessionLength: number;
  };
  water: {
    intake: number;
    drinkDetails?: Array<{
      type: string;
      amount: number;
      count: number;
    }>;
  };
}

/**
 * Datos del resumen semanal con totales y datos diarios
 */
export interface WeeklySummaryData {
  daily: { date: string; summary: DailySummaryData }[];
  totals: DailySummaryData;
}

/**
 * Props comunes para componentes de estadísticas
 */
export interface StatisticsProps {
  date?: Date;
  startDate?: Date;
}
