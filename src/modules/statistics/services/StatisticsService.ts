import { supabase } from '@/core/supabase';

export class StatisticsService {
  static readonly client = supabase;

  static async getDrinkLogsByDate(userId: string, date: string) {
    return supabase
      .from('drink_logs')
      .select('amount')
      .eq('user_id', userId)
      .eq('date', date);
  }

  static async getExerciseLogsByDate(userId: string, date: string) {
    return supabase
      .from('exercise_logs')
      .select('id, calories')
      .eq('user_id', userId)
      .eq('date', date);
  }

  static async getMoodEntriesByDate(userId: string, date: string) {
    return supabase
      .from('mood_entries')
      .select('value')
      .eq('user_id', userId)
      .eq('date', date);
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

  static async getJournalEntriesByDate(userId: string, date: string) {
    return supabase
      .from('journal_entries')
      .select('date')
      .eq('user_id', userId)
      .eq('date', date);
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
