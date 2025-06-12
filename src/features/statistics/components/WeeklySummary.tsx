import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { useWeeklySummary } from '../hooks/useWeeklySummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  startDate: Date;
}

export const WeeklySummary: React.FC<Props> = ({ startDate }) => {
  const { summary, loading, refetch } = useWeeklySummary(startDate);

  const chartData = summary.daily.map(d => ({
    date: d.date.slice(5),
    pomodoros: d.summary.pomodoroCount,
    tasks: d.summary.tasksCompleted,
    habits: d.summary.habitsCompleted
  }));

  const hasData = summary.daily.some(d =>
    Object.entries(d.summary).some(
      ([key, value]) => key !== 'userId' && key !== 'date' && Number(value) > 0
    )
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resumen Semanal</CardTitle>
        <Button size="sm" variant="outline" onClick={refetch} disabled={loading}>
          Recalcular
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64">
          {loading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line dataKey="pomodoros" stroke="#3b82f6" name="Pomodoros" />
                <Line dataKey="tasks" stroke="#10b981" name="Tareas" />
                <Line dataKey="habits" stroke="#a855f7" name="Hábitos" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {!loading && !hasData && (
          <p className="text-center text-sm text-muted-foreground">
            No hay datos registrados para esta semana.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
