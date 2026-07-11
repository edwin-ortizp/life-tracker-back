import { supabase } from '@/core/supabase';

export class MoodService {
  static readonly client = supabase;

  static async getMoodStates(userId: string) {
    return supabase
      .from('mood_states')
      .select('*')
      .eq('user_id', userId)
      .order('value', { ascending: false });
  }

  static subscribeMoodStates(userId: string, onChange: () => void) {
    return supabase
      .channel('mood_states_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_states',
          filter: `user_id=eq.${userId}`
        },
        onChange
      )
      .subscribe();
  }

  static async createMoodState(input: {
    userId: string;
    emoji: string;
    text: string;
    value: number;
    category: string;
  }) {
    return supabase.from('mood_states').insert({
      user_id: input.userId,
      emoji: input.emoji,
      text: input.text,
      value: input.value,
      category: input.category
    });
  }

  static async updateMoodState(
    id: string,
    input: {
      userId: string;
      emoji: string;
      text: string;
      value: number;
      category: string;
    }
  ) {
    return supabase
      .from('mood_states')
      .update({
        user_id: input.userId,
        emoji: input.emoji,
        text: input.text,
        value: input.value,
        category: input.category
      })
      .eq('id', id);
  }

  static async deleteMoodState(id: string) {
    return supabase.from('mood_states').delete().eq('id', id);
  }

  static async getMoodEntriesByDate(userId: string, date: string) {
    return supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('timestamp', { ascending: true });
  }

  static async insertMoodEntry(input: {
    userId: string;
    date: string;
    emoji: string;
    text: string;
    value: number;
    time: string;
    timestamp: number;
  }) {
    return supabase.from('mood_entries').insert({
      user_id: input.userId,
      date: input.date,
      emoji: input.emoji,
      text: input.text,
      value: input.value,
      time: input.time,
      timestamp: input.timestamp
    });
  }

  static async updateMoodEntry(input: {
    userId: string;
    date: string;
    originalTimestamp: number;
    emoji: string;
    text: string;
    value: number;
    time: string;
    timestamp: number;
  }) {
    return supabase
      .from('mood_entries')
      .update({
        emoji: input.emoji,
        text: input.text,
        value: input.value,
        time: input.time,
        timestamp: input.timestamp
      })
      .eq('user_id', input.userId)
      .eq('date', input.date)
      .eq('timestamp', input.originalTimestamp);
  }

  static async deleteMoodEntry(userId: string, date: string, timestamp: number) {
    return supabase
      .from('mood_entries')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('timestamp', timestamp);
  }

  static async getEnergyEntriesByDate(userId: string, date: string) {
    return supabase
      .from('energy_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('timestamp', { ascending: true });
  }

  static async insertEnergyEntry(input: {
    userId: string;
    date: string;
    level: number;
    comment: string | null;
    time: string;
    timestamp: number;
  }) {
    return supabase.from('energy_entries').insert({
      user_id: input.userId,
      date: input.date,
      level: input.level,
      comment: input.comment,
      time: input.time,
      timestamp: input.timestamp
    });
  }

  static async updateEnergyEntry(input: {
    userId: string;
    date: string;
    originalTimestamp: number;
    level: number;
    comment: string | null;
    time: string;
    timestamp: number;
  }) {
    return supabase
      .from('energy_entries')
      .update({
        level: input.level,
        comment: input.comment,
        time: input.time,
        timestamp: input.timestamp
      })
      .eq('user_id', input.userId)
      .eq('date', input.date)
      .eq('timestamp', input.originalTimestamp);
  }

  static async deleteEnergyEntry(userId: string, date: string, timestamp: number) {
    return supabase
      .from('energy_entries')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('timestamp', timestamp);
  }
}
