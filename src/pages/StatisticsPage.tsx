import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import DateSelector from '@/components/DateSelector';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DailySummary, WeeklySummary, AiInsightCard } from '@/features/statistics/components';
import { useDailySummary } from '@/features/statistics/hooks/useDailySummary';
import { useWeeklySummary } from '@/features/statistics/hooks/useWeeklySummary';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (d: Date) => format(d, 'PP', { locale: es });

const StatisticsPage = () => {
  const [day, setDay] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d;
  });
  const dailyData = useDailySummary(day);
  const weeklyData = useWeeklySummary(weekStart);

  const dailySummaryText = dailyData
    ? `Resumen del ${formatDate(day)}\n` +
      `Palabras diario: ${dailyData.journalWords}\n` +
      `Ánimos: ${dailyData.moodCount}\n` +
      `Hábitos completados: ${dailyData.habitsCompleted}\n` +
      `Hábitos negativos: ${dailyData.negativeHabitCount}\n` +
      `Min ejercicio: ${dailyData.exerciseMinutes}\n` +
      `Tareas: ${dailyData.tasksCompleted}\n` +
      `Pomodoros: ${dailyData.pomodoroCount}\n` +
      `Agua (ml): ${dailyData.waterIntake}`
    : '';

  const weeklySummaryText = weeklyData
    ? `Resumen semanal ${formatDate(weekStart)}\n` +
      `Palabras diario: ${weeklyData.totals.journalWords}\n` +
      `Ánimos: ${weeklyData.totals.moodCount}\n` +
      `Hábitos completados: ${weeklyData.totals.habitsCompleted}\n` +
      `Hábitos negativos: ${weeklyData.totals.negativeHabitCount}\n` +
      `Min ejercicio: ${weeklyData.totals.exerciseMinutes}\n` +
      `Tareas: ${weeklyData.totals.tasksCompleted}\n` +
      `Pomodoros: ${weeklyData.totals.pomodoroCount}\n` +
      `Agua (ml): ${weeklyData.totals.waterIntake}`
    : '';

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
      </div>
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Diario</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="space-y-4">
          <DateSelector selectedDate={day} onChange={setDay} />
          <DailySummary date={day} />
          <AiInsightCard summary={dailySummaryText} />
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <DateSelector selectedDate={weekStart} onChange={setWeekStart} />
          <WeeklySummary startDate={weekStart} />
          <AiInsightCard summary={weeklySummaryText} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default StatisticsPage;
