import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateString } from '@/utils/dates';

interface WeekEntriesState {
  entries: Record<string, string>;
  loading: boolean;
  error: string | null;
}

export const useJournalWeekEntries = (startDate: Date | null, endDate: Date | null): WeekEntriesState => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !startDate || !endDate) {
      setEntries({});
      return;
    }

    let isMounted = true;
    const loadEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const start = getLocalDateString(startDate);
        const end = getLocalDateString(endDate);
        const { data, error: fetchError } = await supabase
          .from('journal_entries')
          .select('date, text')
          .eq('user_id', user.id)
          .gte('date', start)
          .lte('date', end);

        if (fetchError) throw fetchError;

        const map: Record<string, string> = {};
        (data || []).forEach((row) => {
          if (row.date) {
            map[row.date] = row.text || '';
          }
        });

        if (isMounted) {
          setEntries(map);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error cargando entradas de la semana');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEntries();
    return () => {
      isMounted = false;
    };
  }, [user, startDate, endDate]);

  return { entries, loading, error };
};
