export interface DailyStatsSummary {
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
  value: number;
}

export interface StatisticsDashboardData {
  summary: DailyStatsSummary;
  moodTrend: MoodTrendPoint[];
}
