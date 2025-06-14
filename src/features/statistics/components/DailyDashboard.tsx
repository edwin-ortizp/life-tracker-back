import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useDailySummary } from '../hooks/useDailySummary';

interface Props {
  date: Date;
}

export const DailyDashboard: React.FC<Props> = ({ date }) => {
  const { summary } = useDailySummary(date);

  const habitPct = summary.habits.total
    ? (summary.habits.completed / summary.habits.total) * 100
    : 0;
  const waterPct = (summary.water.intake / 2000) * 100;
  const pomodoroPct = summary.pomodoro.completionRate;

  const overall = (habitPct + waterPct + pomodoroPct) / 3;

  const taskData = [
    {
      name: 'Completadas',
      value: summary.tasks.completed
    },
    {
      name: 'Pendientes',
      value: summary.tasks.pending + summary.tasks.overdue
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
            {summary.habits.completed}/{summary.habits.total}
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
            {summary.water.intake}ml
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
