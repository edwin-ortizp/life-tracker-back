import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useDailySummary } from '../hooks/useDailySummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  date: Date;
}

export const DailySummary: React.FC<Props> = ({ date }) => {
  const { summary, loading, refetch } = useDailySummary(date);

  const chartData = [
    { name: 'Pomodoros', value: summary.pomodoroCount },
    { name: 'Tareas', value: summary.tasksCompleted },
    { name: 'Hábitos', value: summary.habitsCompleted },
    { name: 'Negativos', value: summary.negativeHabitCount }
  ];

  const hasData = Object.entries(summary).some(
    ([key, value]) => key !== 'userId' && key !== 'date' && Number(value) > 0
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Resumen Diario</CardTitle>
        <Button size="sm" variant="outline" onClick={refetch} disabled={loading}>
          Recalcular
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Palabras Diario</p>
            <p className="font-bold">{summary.journalWords}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ánimos</p>
            <p className="font-bold">{summary.moodCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min Ejercicio</p>
            <p className="font-bold">{summary.exerciseMinutes}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hidratación (ml)</p>
            <p className="font-bold">{summary.waterIntake}</p>
          </div>
        </div>
        <div className="h-40">
          {loading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {!loading && !hasData && (
          <p className="text-center text-sm text-muted-foreground">
            No hay datos registrados para este día.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
