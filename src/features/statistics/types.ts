export interface DailyStats {
  userId: string;
  date: string; // YYYY-MM-DD
  journalWords: number;
  moodCount: number;
  habitsCompleted: number;
  negativeHabitCount: number;
  exerciseMinutes: number;
  tasksCompleted: number;
  pomodoroCount: number;
  waterIntake: number;
}
