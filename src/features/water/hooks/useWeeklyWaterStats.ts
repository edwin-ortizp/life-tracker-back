import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString, getWeekDates } from '@/utils/dates';

interface DayIntake {
  date: string;
  intake: number;
  drinks: Record<string, number>;
}

export function useWeeklyWaterStats(selectedDate: Date) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DayIntake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      setLoading(true);

      const { start, end } = getWeekDates(selectedDate);

      const { data, error } = await supabase
        .from('water_intake')
        .select('date, drink_type, amount_ml')
        .eq('user_id', user.id)
        .gte('date', getLocalDateString(start))
        .lte('date', getLocalDateString(end))
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading weekly water stats:', error);
        setLoading(false);
        return;
      }

      // Aggregate by date
      const statsByDate: Record<string, DayIntake> = {};

      data?.forEach((entry) => {
        if (!statsByDate[entry.date]) {
          statsByDate[entry.date] = {
            date: entry.date,
            intake: 0,
            drinks: {}
          };
        }
        statsByDate[entry.date].intake += entry.amount_ml || 0;

        if (!statsByDate[entry.date].drinks[entry.drink_type]) {
          statsByDate[entry.date].drinks[entry.drink_type] = 0;
        }
        statsByDate[entry.date].drinks[entry.drink_type] += entry.amount_ml || 0;
      });

      setStats(Object.values(statsByDate));
      setLoading(false);
    };

    loadStats();
  }, [user, selectedDate]);

  return { stats, loading };
}
