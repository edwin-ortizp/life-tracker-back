// src/features/statistics/index.ts
// Barrel export para el módulo de statistics

export { DailySummary } from './components/DailySummary';
export { WeeklySummary } from './components/WeeklySummary';
export { DailyDashboard } from './components/DailyDashboard';
export { WeeklyDashboard } from './components/WeeklyDashboard';
export { MoodChart } from './components/MoodChart';
export { AiInsightCard } from './components/AiInsightCard';

export { useDailySummary } from './hooks/useDailySummary';
export { useWeeklySummary } from './hooks/useWeeklySummary';

export type { DailySummaryData, WeeklySummaryData, StatisticsProps } from './types';
