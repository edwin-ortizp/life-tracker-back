import { supabase } from '@/core/supabase';

export type DrinkLogRow = {
  user_id: string;
  date: string;
  drink_type: string;
  amount: number;
  hydration_value: number;
  timestamp: number;
  time: string;
};

export type WaterIntakeRow = {
  date: string;
  drink_type: string;
  amount_ml: number;
};

export type DrinkLogRangeRow = {
  date: string;
  hydration_value: number | null;
  amount: number | null;
};

export class WaterService {
  static readonly client = supabase;

  static async getDrinkLogs(userId: string, date: string) {
    return supabase
      .from('drink_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('timestamp', { ascending: true })
      .returns<DrinkLogRow[]>();
  }

  static async getDrinkLogsRange(userId: string, start: string, end: string) {
    return supabase
      .from('drink_logs')
      .select('date, hydration_value, amount')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .returns<DrinkLogRangeRow[]>();
  }

  static async insertDrinkLog(input: {
    userId: string;
    date: string;
    drinkType: string;
    amount: number;
    hydrationValue: number;
    timestamp: number;
    time: string;
  }) {
    return supabase.from('drink_logs').insert({
      user_id: input.userId,
      date: input.date,
      drink_type: input.drinkType,
      amount: input.amount,
      hydration_value: input.hydrationValue,
      timestamp: input.timestamp,
      time: input.time
    });
  }

  static async updateDrinkLog(input: {
    userId: string;
    date: string;
    originalTimestamp: number;
    drinkType: string;
    amount: number;
    hydrationValue: number;
    timestamp: number;
    time: string;
  }) {
    return supabase
      .from('drink_logs')
      .update({
        drink_type: input.drinkType,
        amount: input.amount,
        hydration_value: input.hydrationValue,
        timestamp: input.timestamp,
        time: input.time
      })
      .eq('user_id', input.userId)
      .eq('date', input.date)
      .eq('timestamp', input.originalTimestamp);
  }

  static async deleteDrinkLog(userId: string, date: string, timestamp: number) {
    return supabase
      .from('drink_logs')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('timestamp', timestamp);
  }

  static async getDrinkTypes(userId: string) {
    return supabase
      .from('drink_types')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
  }

  static async createDrinkType(input: {
    userId: string;
    name: string;
    hydrationFactor: number;
    color: string;
    icon: string;
    category: string;
  }) {
    return supabase.from('drink_types').insert({
      user_id: input.userId,
      name: input.name,
      hydration_factor: input.hydrationFactor,
      color: input.color,
      icon: input.icon,
      category: input.category
    });
  }

  static async updateDrinkType(
    id: string,
    input: {
      userId: string;
      name: string;
      hydrationFactor: number;
      color: string;
      icon: string;
      category: string;
    }
  ) {
    return supabase
      .from('drink_types')
      .update({
        user_id: input.userId,
        name: input.name,
        hydration_factor: input.hydrationFactor,
        color: input.color,
        icon: input.icon,
        category: input.category
      })
      .eq('id', id);
  }

  static async deleteDrinkType(id: string) {
    return supabase.from('drink_types').delete().eq('id', id);
  }

  static subscribeDrinkTypes(userId: string, onChange: () => void) {
    return supabase
      .channel('drink_types_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drink_types',
          filter: `user_id=eq.${userId}`
        },
        onChange
      )
      .subscribe();
  }

  static async getWaterIntakeRange(userId: string, start: string, end: string) {
    return supabase
      .from('water_intake')
      .select('date, drink_type, amount_ml')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .returns<WaterIntakeRow[]>();
  }
}
