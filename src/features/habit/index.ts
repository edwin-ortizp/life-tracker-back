// src/features/habit/index.ts
// Barrel export para el módulo de habit

export { HabitTracker } from './components/HabitTracker';
export { HabitGroup } from './components/HabitGroup';
export { WeeklyView } from './components/WeeklyView';
export { MonthlyView } from './components/MonthlyView';
export { YearlyView } from './components/YearlyView';

export { useHabitData } from './hooks/useHabitData';

export { HABITS, HABIT_COLORS } from './types';
export type { Habit, HabitProps } from './types';
