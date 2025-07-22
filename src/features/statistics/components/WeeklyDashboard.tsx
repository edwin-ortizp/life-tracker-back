import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import {
  Gauge,
  CheckCircle2,
  Droplet,
  Timer,
  ListChecks,
  Smile
} from 'lucide-react';
import { MoodChart } from './MoodChart';
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
      value: summary.totals.tasks.todayPending + summary.totals.tasks.overdue
    }
  ];

  const COLORS = ['#10b981', '#f97316'];

  const moodData = summary.daily.map(d => ({
    label: d.date.slice(5),
    value: d.summary.mood.average
  }));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <Card className="p-2">
        <CardHeader className="flex items-center gap-2 p-2 pb-1">
          <span className="p-1 rounded bg-purple-500 text-white">
            <Gauge className="w-4 h-4" />
          </span>
          <CardTitle className="text-sm">Score General</CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          <div className="text-xl font-bold text-center">{overall.toFixed(0)}%</div>
          <Progress value={overall} className="h-2" />
        </CardContent>
      </Card>
      <Card className="p-2">
        <CardHeader className="flex items-center gap-2 p-2 pb-1">
          <span className="p-1 rounded bg-green-600 text-white">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <CardTitle className="text-sm">Hábitos</CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          <div className="text-xl font-bold text-center">{summary.totals.habits.completed}</div>
          <Progress value={habitPct} className="h-2" />
        </CardContent>
      </Card>
      <Card className="p-2">
        <CardHeader className="flex items-center gap-2 p-2 pb-1">
          <span className="p-1 rounded bg-blue-600 text-white">
            <Droplet className="w-4 h-4" />
          </span>
          <CardTitle className="text-sm">Hidratación</CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          <div className="text-xl font-bold text-center">{summary.totals.water.intake}ml</div>
          <Progress value={Math.min(waterPct, 100)} className="h-2" />
        </CardContent>
      </Card>
      <Card className="p-2">
        <CardHeader className="flex items-center gap-2 p-2 pb-1">
          <span className="p-1 rounded bg-red-600 text-white">
            <Timer className="w-4 h-4" />
          </span>
          <CardTitle className="text-sm">Pomodoros</CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-1">
          <div className="text-xl font-bold text-center">
            {summary.totals.pomodoro.workMinutes} / {summary.totals.pomodoro.expectedMinutes} min
          </div>
          <Progress value={pomodoroPct} className="h-2" />
        </CardContent>
      </Card>
      <Card className="p-2">
        <CardHeader className="flex items-center gap-2 p-2 pb-1">
          <span className="p-1 rounded bg-orange-500 text-white">
            <ListChecks className="w-4 h-4" />
          </span>
          <CardTitle className="text-sm">Tareas</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskData} dataKey="value" nameKey="name" innerRadius={20} outerRadius={40}>
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
      {moodData.length > 0 && (
        <Card className="p-2 col-span-full sm:col-auto">
          <CardHeader className="flex items-center gap-2 p-2 pb-1">
            <span className="p-1 rounded bg-yellow-600 text-white">
              <Smile className="w-4 h-4" />
            </span>
            <CardTitle className="text-sm">Ánimo</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <MoodChart data={moodData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
