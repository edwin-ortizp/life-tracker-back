import React, { useState } from 'react';
import DateSelector from '@/components/DateSelector';
import { StatsPeriodSelector } from '@/features/water/components/StatsPeriodSelector';
import { RangeStats } from '@/features/water/components/RangeStats';
import Water from '@/features/water/components';
import { WaterCalendar } from '@/features/water/components/WaterCalendar';
import { WeeklyStats } from '@/features/water/components/WeeklyStats';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';

const WaterPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const { user } = useAuth();

  const handlePeriodChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (!user) {
    return (
      <PageLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Inicia sesión para ver tus estadísticas de hidratación</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Control de Hidratación</h1>
        <p className="text-gray-500">Registra y monitorea tu consumo diario de agua</p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Registro Diario</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DateSelector
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Water selectedDate={selectedDate} />
              <WeeklyStats selectedDate={selectedDate} />
            </div>
            <div className="md:col-span-1">
              <WaterCalendar selectedDate={selectedDate} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <StatsPeriodSelector onPeriodChange={handlePeriodChange} />
          <RangeStats startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default WaterPage;