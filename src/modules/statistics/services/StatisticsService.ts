import { supabase } from '@/core/supabase';

export class StatisticsService {
  static readonly client = supabase;

  static async getDrinkLogsRange(userId: string, fromDate: string, toDate: string) {
    return supabase
      .from('drink_logs')
      .select('date, amount')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate);
  }

  static async getExerciseLogsRange(userId: string, fromDate: string, toDate: string) {
    return supabase
      .from('exercise_logs')
      .select('id, date, calories')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate);
  }

  static async getMoodEntriesRange(userId: string, fromDate: string, toDate: string) {
    return supabase
      .from('mood_entries')
      .select('date, value')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });
  }

  static async getJournalEntriesRange(userId: string, fromDate: string, toDate: string) {
    return supabase
      .from('journal_entries')
      .select('date')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate);
  }

  static async getHabitCompletionsRange(userId: string, fromDate: string, toDate: string) {
    return supabase
      .from('habit_completions')
      .select('habit_id, date, completed')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .lte('date', toDate);
  }
}
