import React, { useState, useEffect, useMemo } from 'react';
import DateSelector from '@/components/DateSelector';
import { StatsPeriodSelector } from '@/features/water/components/StatsPeriodSelector';
import { RangeStats } from '@/features/water/components/RangeStats';
import Water from '@/features/water/components';
import { WaterCalendar } from '@/features/water/components/WaterCalendar';
import { WeeklyStats } from '@/features/water/components/WeeklyStats';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useModuleSettings } from '@/hooks/useModuleSettings';

const WaterPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const { user } = useAuth();
  
  // Memoize defaults to prevent re-renders
  const waterDefaults = useMemo(() => ({ dailyGoal: 2000 }), []);
  const { settings, saveSettings } = useModuleSettings('water', waterDefaults);
  const [goalInput, setGoalInput] = useState(settings.dailyGoal);

  useEffect(() => {
    setGoalInput(settings.dailyGoal);
  }, [settings.dailyGoal]);

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
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DateSelector
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <Water selectedDate={selectedDate} goal={settings.dailyGoal} />
              <WeeklyStats selectedDate={selectedDate} />
            </div>
            <div>
              <WaterCalendar selectedDate={selectedDate} goal={settings.dailyGoal} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <StatsPeriodSelector onPeriodChange={handlePeriodChange} />
          <RangeStats startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="goal">Meta diaria (ml)</Label>
                <Input
                  id="goal"
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(Number(e.target.value))}
                />
              </div>
              <Button onClick={() => saveSettings({ dailyGoal: goalInput })}>
                Guardar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default WaterPage;
