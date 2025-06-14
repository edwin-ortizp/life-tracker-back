import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useWeeklySummary } from '../hooks/useWeeklySummary';

interface Props {
  startDate: Date;
}

export const WeeklyDashboard: React.FC<Props> = ({ startDate }) => {
  const { summary } = useWeeklySummary(startDate);
  const days = summary.daily.length || 1;

  const habitPct =
    (summary.totals.habits.completed / (days * summary.totals.habits.total)) * 100;
  const waterPct = (summary.totals.water.intake / (2000 * days)) * 100;
  const pomodoroPct = summary.totals.pomodoro.completionRate;

  const overall = (habitPct + waterPct + pomodoroPct) / 3;

  const taskData = [
    {
      name: 'Completadas',
      value: summary.totals.tasks.completed
    },
    {
      name: 'Pendientes',
      value: summary.totals.tasks.pending + summary.totals.tasks.overdue
    }
  ];

  const COLORS = ['#10b981', '#f97316'];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Score General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mb-2">
            {overall.toFixed(0)}%
          </div>
          <Progress value={overall} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Hábitos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mb-2">
            {summary.totals.habits.completed}
          </div>
          <Progress value={habitPct} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Hidratación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-center mb-2">
            {summary.totals.water.intake}ml
          </div>
          <Progress value={Math.min(waterPct, 100)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tareas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={30}
                  outerRadius={60}
                  label
                >
                  {taskData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
