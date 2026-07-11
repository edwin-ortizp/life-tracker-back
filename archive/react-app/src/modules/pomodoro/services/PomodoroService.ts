import { supabase } from '@/core/supabase';

export type PomodoroSessionRangeRow = {
  date: string;
  duration: number;
  completed: boolean;
};

export class PomodoroService {
  static readonly client = supabase;

  static table(tableName: string) {
    return (supabase as any).from(tableName);
  }

  static async getSessionsRange(userId: string, start: string, end: string) {
    return supabase
      .from('pomodoro_sessions')
      .select('date, duration, completed')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .returns<PomodoroSessionRangeRow[]>();
  }
}
