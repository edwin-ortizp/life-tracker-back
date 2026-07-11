import { supabase } from '@/core/supabase';

type JournalEntryRow = {
  user_id: string;
  date: string;
  text: string | null;
  updated_at: string | null;
  display_time: string | null;
};

type JournalWeekSummaryRow = {
  year: number;
  week: number;
  entries_count: number;
};

export class JournalService {
  static readonly client = supabase;

  static async getEntry(userId: string, date: string) {
    return supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle<JournalEntryRow>();
  }

  static async upsertEntry(input: {
    userId: string;
    date: string;
    text: string;
    displayTime: string;
    updatedAt: string;
  }) {
    return supabase.from('journal_entries').upsert(
      {
        user_id: input.userId,
        date: input.date,
        text: input.text,
        display_time: input.displayTime,
        updated_at: input.updatedAt
      },
      {
        onConflict: 'user_id,date'
      }
    );
  }

  static async getEntriesByDateRange(userId: string, start: string, end: string) {
    return supabase
      .from('journal_entries')
      .select('date, text')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);
  }

  static async getWeeklySummaryByYearRange(userId: string, startYear: number, endYear: number) {
    return supabase
      .from('journal_weekly_summary')
      .select('year, week, entries_count')
      .eq('user_id', userId)
      .gte('year', startYear)
      .lte('year', endYear)
      .returns<JournalWeekSummaryRow[]>();
  }

  static async getEntryDates(userId: string) {
    return supabase.from('journal_entries').select('date').eq('user_id', userId);
  }

  static async deleteWeeklySummary(userId: string) {
    return supabase.from('journal_weekly_summary').delete().eq('user_id', userId);
  }

  static async upsertWeeklySummary(
    rows: Array<{ user_id: string; year: number; week: number; entries_count: number }>
  ) {
    return supabase
      .from('journal_weekly_summary')
      .upsert(rows, { onConflict: 'user_id,year,week' });
  }
}
