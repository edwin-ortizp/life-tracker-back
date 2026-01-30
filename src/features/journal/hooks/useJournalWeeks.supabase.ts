import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface JournalSummaryRow {
  year: number;
  week: number;
  entries_count: number;
}

interface JournalSummaryResult {
  entriesByWeek: Map<string, number>;
  loading: boolean;
  error: string | null;
}

export const useJournalWeeks = (startYear: number | null, endYear: number | null): JournalSummaryResult => {
  const { user } = useAuth();
  const [entriesByWeek, setEntriesByWeek] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || startYear === null || endYear === null) {
      setEntriesByWeek(new Map());
      return;
    }

    let isMounted = true;
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('journal_weekly_summary')
          .select('year, week, entries_count')
          .eq('user_id', user.id)
          .gte('year', startYear)
          .lte('year', endYear);

        if (fetchError) throw fetchError;

        const map = new Map<string, number>();
        (data as JournalSummaryRow[] | null || []).forEach((row) => {
          const key = `${row.year}-W${String(row.week).padStart(2, '0')}`;
          map.set(key, row.entries_count);
        });

        if (isMounted) {
          setEntriesByWeek(map);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error cargando resumen semanal');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [user, startYear, endYear]);

  return useMemo(() => ({ entriesByWeek, loading, error }), [entriesByWeek, loading, error]);
};
