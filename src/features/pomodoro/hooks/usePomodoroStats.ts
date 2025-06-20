// src/features/pomodoro/hooks/usePomodoroStats.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import type { PomodoroStats, PomodoroSession, PomodoroData } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { format, eachDayOfInterval, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { getLocalDateString } from '@/utils/dates';

export const usePomodoroStats = (dateRange: 'week' | 'month' = 'week') => {
  const [stats, setStats] = useState<PomodoroStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Calcular rango de fechas
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(
          dateRange === 'week' ? subDays(endDate, 7) : subMonths(endDate, 1)
        );

        // Obtener array de todas las fechas en el rango
        const dateArray = eachDayOfInterval({ start: startDate, end: endDate });
        
        // Obtener documentos para cada fecha
        const allSessions: PomodoroSession[] = [];
        const sessionsByDay: Record<string, number> = {};

        const results = await Promise.allSettled(
          dateArray.map(async date => {
            const dateStr = getLocalDateString(date);
            const docRef = doc(db, 'pomodoro', `${user.uid}_${dateStr}`);
            try {
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const data = docSnap.data() as PomodoroData;
                return { dateStr, data };
              }
            } catch (e) {
              console.error('PomodoroStats - Error fetching doc:', e);
            }
            return null;
          })
        );

        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value) {
            const { dateStr, data } = res.value;
            allSessions.push(...data.sessions);

            const completedSessions = data.sessions.filter(s => s.completed).length;
            if (completedSessions > 0) {
              sessionsByDay[dateStr] = completedSessions;
            }
          }
        });

        // Si no hay sesiones, establecer estadísticas iniciales
        if (allSessions.length === 0) {
          setStats({
            totalSessions: 0,
            completedSessions: 0,
            totalTime: 0,
            averageSessionTime: 0,
            completionRate: 0
          });
          setLoading(false);
          return;
        }

        // Encontrar el mejor día
        const bestDayEntry = Object.entries(sessionsByDay).reduce(
          (max, [date, count]) => 
            count > max[1] ? [date, count] : max,
          ['', 0]
        );

        // Calcular estadísticas
        const completedSessions = allSessions.filter(s => s.completed);
        const totalTime = allSessions.reduce((acc, s) => acc + s.duration, 0);

        const stats: PomodoroStats = {
          totalSessions: allSessions.length,
          completedSessions: completedSessions.length,
          totalTime,
          averageSessionTime: totalTime / allSessions.length,
          completionRate: (completedSessions.length / allSessions.length) * 100,
          ...(bestDayEntry[1] > 0 && {
            bestDay: {
              date: format(new Date(bestDayEntry[0]), 'dd/MM/yyyy'),
              sessions: bestDayEntry[1]
            }
          })
        };

        setStats(stats);
      } catch (err) {
        console.error('Error fetching pomodoro stats:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, dateRange]);

  return { stats, loading, error };
};