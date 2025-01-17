// src/features/pomodoro/hooks/usePomodoroStats.ts
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { PomodoroStats, PomodoroSession, PomodoroData } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { format } from 'date-fns';

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

        // Calcular fechas de inicio y fin
        const endDate = new Date();
        const startDate = new Date();
        if (dateRange === 'week') {
          startDate.setDate(endDate.getDate() - 7);
        } else {
          startDate.setMonth(endDate.getMonth() - 1);
        }

        // Query para obtener los documentos entre las fechas
        const pomodoroRef = collection(db, 'pomodoro');
        const q = query(
          pomodoroRef,
          where('userId', '==', user.uid),
          where('date', '>=', startDate.toISOString().split('T')[0]),
          where('date', '<=', endDate.toISOString().split('T')[0])
        );

        const querySnapshot = await getDocs(q);
        let allSessions: PomodoroSession[] = [];
        let sessionsByDay: { [key: string]: number } = {};

        // Procesar documentos
        querySnapshot.forEach((doc) => {
          const data = doc.data() as PomodoroData;
          allSessions = [...allSessions, ...data.sessions];
          sessionsByDay[data.date] = data.sessions.length;
        });

        // Encontrar el mejor día
        let bestDay = { date: '', sessions: 0 };
        Object.entries(sessionsByDay).forEach(([date, count]) => {
          if (count > bestDay.sessions) {
            bestDay = { 
              date: format(new Date(date), 'dd/MM/yyyy'),
              sessions: count 
            };
          }
        });

        // Calcular estadísticas
        const completedSessions = allSessions.filter(s => s.completed);
        const totalTime = allSessions.reduce((acc, s) => acc + s.duration, 0);

        setStats({
          totalSessions: allSessions.length,
          completedSessions: completedSessions.length,
          totalTime,
          averageSessionTime: allSessions.length > 0 ? totalTime / allSessions.length : 0,
          completionRate: allSessions.length > 0 
            ? (completedSessions.length / allSessions.length) * 100 
            : 0,
          bestDay
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching pomodoro stats:', err);
        setError('Error al cargar las estadísticas');
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, dateRange]);

  return { stats, loading, error };
};