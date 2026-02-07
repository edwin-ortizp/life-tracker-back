export interface StatsSummary {
  waterMl: number;
  exerciseCount: number;
  exerciseCalories: number;
  moodEntries: number;
  moodAverage: number;
  journalEntries: number;
  habitWeeklyCompletionPct: number;
  habitWeeklyCompleted: number;
  habitWeeklyTotal: number;
}

export interface MoodTrendPoint {
  date: string;
  label: string;
  value: number | null;
}

export interface StatisticsDashboardData {
  summary: StatsSummary;
  moodTrend: MoodTrendPoint[];
}
