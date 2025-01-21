// src/features/pomodoro/hooks/usePomodoroStats.ts
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Query, DocumentData } from 'firebase/firestore';
import type { PomodoroStats, PomodoroSession, PomodoroData } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { format } from 'date-fns';
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

        // Calcular fechas de inicio y fin usando la zona horaria local
        const endDate = new Date();
        const startDate = new Date();
        
        if (dateRange === 'week') {
          startDate.setDate(endDate.getDate() - 7);
        } else {
          startDate.setMonth(endDate.getMonth() - 1);
        }

        // Usar getLocalDateString para obtener las fechas en formato YYYY-MM-DD
        const endDateStr = getLocalDateString(endDate);
        const startDateStr = getLocalDateString(startDate);

        let q: Query<DocumentData>;
        const pomodoroRef = collection(db, 'pomodoro');

        // Construir la consulta
        q = query(pomodoroRef, 
          where('userId', '==', user.uid),
          where('date', '>=', startDateStr),
          where('date', '<=', endDateStr)
        );

        const querySnapshot = await getDocs(q);
        let allSessions: PomodoroSession[] = [];
        let sessionsByDay: Record<string, number> = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data() as PomodoroData;
          allSessions = [...allSessions, ...data.sessions];
          
          // Contar sesiones completadas por día
          const completedSessions = data.sessions.filter(s => s.completed).length;
          sessionsByDay[data.date] = completedSessions;
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
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pomodoro stats:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, dateRange]);

  return { stats, loading, error };
};