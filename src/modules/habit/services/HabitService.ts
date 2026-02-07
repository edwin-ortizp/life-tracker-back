import { supabase } from '@/core/supabase';

export class HabitService {
  static readonly client = supabase;

  static async getHabitCompletionsByRange(userId: string, startDate: string, endDate: string) {
    return supabase
      .from('habit_completions')
      .select('habit_id, date, completed')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
  }

  static async upsertHabitCompletion(input: {
    userId: string;
    habitId: number;
    date: string;
    completed: boolean;
  }) {
    return supabase.from('habit_completions').upsert(
      {
        user_id: input.userId,
        habit_id: input.habitId,
        date: input.date,
        completed: input.completed
      },
      {
        onConflict: 'user_id,habit_id,date'
      }
    );
  }

  // Temporary compatibility helper for legacy calls.
  static table(tableName: string) {
    return (supabase as any).from(tableName);
  }
}
