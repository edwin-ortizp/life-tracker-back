// src/pages/WaterPage.tsx
import React, { useState } from 'react';
import { Water, WaterCalendar, WeeklyStats, RangeStats } from '@/features/water/components';
import DateSelector from '@/components/DateSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';

const WaterPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold">Inicia sesión para registrar tu hidratación</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registro de Hidratación</h1>
        <p className="text-gray-500">Monitorea tu consumo diario de líquidos</p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="daily">Registro Diario</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="range">Rango</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
          <div className="mt-4">
            <Water selectedDate={selectedDate} goal={2000} />
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <WaterCalendar selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="weekly">
          <WeeklyStats selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="range">
          <RangeStats />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default WaterPage;
