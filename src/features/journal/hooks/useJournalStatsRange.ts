import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { getLocalDateString } from '@/utils/dates';

export interface JournalStats {
  entries: Array<{ date: string; words: number; characters: number }>;
  moodStats: Array<{ name: string; value: number }>;
  totalEntries: number;
  averageWords: number;
}

export const useJournalStatsRange = (startDate: Date, endDate: Date) => {
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const dates: string[] = [];
        const current = new Date(startDate);
        const last = new Date(endDate);

        while (current <= last) {
          dates.push(getLocalDateString(current));
          current.setDate(current.getDate() + 1);
        }

        const journalPromises = dates.map(date => {
          const docRef = doc(db, 'journal', `${user.uid}_${date}`);
          return getDoc(docRef);
        });

        const moodPromises = dates.map(date => {
          const docRef = doc(db, 'moods', `${user.uid}_${date}`);
          return getDoc(docRef);
        });

        const journalDocs = await Promise.all(journalPromises);
        const moodDocs = await Promise.all(moodPromises);

        const entriesMap = new Map(
          dates.map(date => [date, { date, words: 0, characters: 0 }])
        );

        journalDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            entriesMap.set(data.date, {
              date: data.date,
              words: data.text?.split(/\s+/).filter(Boolean).length || 0,
              characters: data.text?.length || 0
            });
          }
        });

        const entries = Array.from(entriesMap.values()).sort((a, b) =>
          a.date < b.date ? 1 : -1
        );

        const moodCounts: Record<string, number> = {};
        moodDocs.forEach(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.moods)) {
              data.moods.forEach((m: any) => {
                moodCounts[m.text] = (moodCounts[m.text] || 0) + 1;
              });
            }
          }
        });

        const moodStats = Object.entries(moodCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);

        const totalEntries = entries.filter(e => e.words > 0).length;
        const averageWords = totalEntries > 0
          ? Math.round(
              entries.reduce((acc, curr) => acc + curr.words, 0) / totalEntries
            )
          : 0;

        setStats({ entries, moodStats, totalEntries, averageWords });
      } catch (err) {
        console.error('Error al cargar estadísticas del diario:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, startDate, endDate]);

  return { stats, loading, error };
};

