import { useState, Suspense, lazy } from 'react';
import PageLayout from '@/components/PageLayout';
import DateSelector from '@/components/DateSelector';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
const DailySummary = lazy(() => import('@/features/statistics/components/DailySummary').then(m => ({ default: m.DailySummary })));
const WeeklySummary = lazy(() => import('@/features/statistics/components/WeeklySummary').then(m => ({ default: m.WeeklySummary })));
const AiInsightCard = lazy(() => import('@/features/statistics/components/AiInsightCard').then(m => ({ default: m.AiInsightCard })));
const DailyDashboard = lazy(() => import('@/features/statistics/components/DailyDashboard').then(m => ({ default: m.DailyDashboard })));
const WeeklyDashboard = lazy(() => import('@/features/statistics/components/WeeklyDashboard').then(m => ({ default: m.WeeklyDashboard })));
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
  
  const { summary: weeklyData } = useWeeklySummary(weekStart);

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
          <Suspense fallback={<div className="h-24" />}>
            <DailyDashboard date={day} />
          </Suspense>
          <Suspense fallback={<div className="h-24" />}>
            <DailySummary date={day} />
          </Suspense>
          <Suspense fallback={<div className="h-24" />}>
            <AiInsightCard date={formatDate(day)} dayDate={day} />
          </Suspense>
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <DateSelector selectedDate={weekStart} onChange={setWeekStart} />
          <Suspense fallback={<div className="h-24" />}>
            <WeeklyDashboard startDate={weekStart} />
          </Suspense>
          <Suspense fallback={<div className="h-24" />}>
            <WeeklySummary startDate={weekStart} />
          </Suspense>
          <Suspense fallback={<div className="h-24" />}>
            <AiInsightCard data={weeklyData} date={`Semana del ${formatDate(weekStart)}`} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default StatisticsPage;
