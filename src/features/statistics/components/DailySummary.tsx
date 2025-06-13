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
import { DRINKS } from '@/features/water/types';

interface Props {
  date: Date;
}

export const DailySummary: React.FC<Props> = ({ date }) => {
  const { summary, loading, refetch } = useDailySummary(date);

  // Helper function to get drink name in Spanish
  const getDrinkName = (type: string) => {
    return DRINKS[type as keyof typeof DRINKS]?.name || type;
  };

  const chartData = [
    { name: 'Pomodoros', value: summary.pomodoro.count },
    { name: 'Tareas', value: summary.tasks.completed },
    { name: 'Hábitos', value: summary.habits.completed },
    { name: 'Negativos', value: summary.negativeHabits.count }
  ];

  const hasData = Object.values(summary).some(moduleData =>
    Object.values(moduleData).some(v => typeof v === 'number' && v > 0)
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
            <p className="font-bold">{summary.journal.words}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ánimos</p>
            <p className="font-bold">{summary.mood.count}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Min Ejercicio</p>
            <p className="font-bold">{summary.exercise.minutes}</p>
          </div>          <div>
            <p className="text-sm text-muted-foreground">Hidratación (ml)</p>
            <p className="font-bold">{summary.water.intake}</p>
            {summary.water.drinkDetails && summary.water.drinkDetails.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">                {summary.water.drinkDetails.slice(0, 2).map((drink) => (
                  <div key={drink.type}>
                    {getDrinkName(drink.type)}: {drink.amount}ml ({drink.count}x)
                  </div>
                ))}
                {summary.water.drinkDetails.length > 2 && (
                  <div>+{summary.water.drinkDetails.length - 2} más</div>
                )}
              </div>
            )}
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
          )}        </div>
        {!loading && summary.water.drinkDetails && summary.water.drinkDetails.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Detalle de Bebidas</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">              {summary.water.drinkDetails.map((drink) => (
                <div key={drink.type} className="flex justify-between p-2 rounded bg-muted/50">
                  <span className="font-medium">{getDrinkName(drink.type)}</span>
                  <span>{drink.amount}ml ({drink.count}x)</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!loading && !hasData && (
          <p className="text-center text-sm text-muted-foreground">
            No hay datos registrados para este día.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
