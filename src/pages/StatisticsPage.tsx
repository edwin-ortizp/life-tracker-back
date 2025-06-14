import { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import DateSelector from '@/components/DateSelector';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DailySummary, WeeklySummary, AiInsightCard, DebugDataCard } from '@/features/statistics/components';
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
  });  const { summary: dailyData } = useDailySummary(day);
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
          <div className="grid lg:grid-cols-2 gap-4">
            <DailySummary date={day} />
            <AiInsightCard data={dailyData} date={formatDate(day)} />
            <DebugDataCard data={dailyData} />
          </div>
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <DateSelector selectedDate={weekStart} onChange={setWeekStart} />
          <div className="grid lg:grid-cols-2 gap-4">
            <WeeklySummary startDate={weekStart} />
            <AiInsightCard data={weeklyData} date={`Semana del ${formatDate(weekStart)}`} />
            <DebugDataCard data={weeklyData} />
          </div>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default StatisticsPage;
