import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useWeeklySummary } from '../hooks/useWeeklySummary';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, CheckCircle, Droplet, ListChecks } from 'lucide-react';
import StatCard from './StatCard';

interface Props {
  startDate: Date;
}

export const WeeklySummary: React.FC<Props> = ({ startDate }) => {
  const { summary, loading, refetch } = useWeeklySummary(startDate);

  const chartData = summary.daily.map(d => ({
    date: d.date.slice(5),
    pomodoros: d.summary.pomodoro.count,
    tasks: d.summary.tasks.completed,
    habits: d.summary.habits.completed
  }));

  const habitsPercent = summary.totals.habits.total
    ? (summary.totals.habits.completed / summary.totals.habits.total) * 100
    : 0;
  const tasksPercent = summary.totals.tasks.todayPlanned
    ? (summary.totals.tasks.completed / summary.totals.tasks.todayPlanned) * 100
    : 0;
  const hydrationGoal = 2000 * 7;
  const hydrationPercent = Math.min(100, (summary.totals.water.intake / hydrationGoal) * 100);
  const generalScore = Math.round(
    (habitsPercent + tasksPercent + summary.totals.pomodoro.completionRate) / 3
  );

  const hasData = summary.daily.some(d =>
    Object.values(d.summary).some(moduleData => 
      Object.values(moduleData).some(v => typeof v === 'number' && v > 0)
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Score General"
            value={`${generalScore}%`}
            progress={generalScore}
            icon={<Gauge className="w-5 h-5" />}
          />
          <StatCard
            title="Hábitos"
            value={`${summary.totals.habits.completed}/${summary.totals.habits.total}`}
            progress={habitsPercent}
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <StatCard
            title="Tareas"
            value={`${summary.totals.tasks.completed}/${summary.totals.tasks.todayPlanned}`}
            progress={tasksPercent}
            icon={<ListChecks className="w-5 h-5" />}
          />
          <StatCard
            title="Hidratación"
            value={`${summary.totals.water.intake} ml`}
            progress={hydrationPercent}
            icon={<Droplet className="w-5 h-5" />}
          />
        </div>
        <div className="h-64">
          {loading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} stackOffset="expand">
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="pomodoros" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" name="Pomodoros" />
                <Area type="monotone" dataKey="tasks" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" name="Tareas" />
                <Area type="monotone" dataKey="habits" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" name="Hábitos" />
              </AreaChart>
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
