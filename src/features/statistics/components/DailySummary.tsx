import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useDailySummary } from '../hooks/useDailySummary';

interface Props {
  date: Date;
}

export const DailySummary: React.FC<Props> = ({ date }) => {
  const data = useDailySummary(date);

  if (!data) return null;

  const chartData = [
    { name: 'Pomodoros', value: data.pomodoroCount },
    { name: 'Tareas', value: data.tasksCompleted },
    { name: 'Hábitos', value: data.habitsCompleted },
    { name: 'Negativos', value: data.negativeHabitCount }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Diario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Palabras Diario</p>
            <p className="font-bold">{data.journalWords}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ánimos</p>
            <p className="font-bold">{data.moodCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min Ejercicio</p>
            <p className="font-bold">{data.exerciseMinutes}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hidratación (ml)</p>
            <p className="font-bold">{data.waterIntake}</p>
          </div>
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
