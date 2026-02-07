// src/pages/WaterPage.tsx
import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Water, WaterCalendar, WeeklyStats, RangeStats } from '@/modules/water/components';
import DateSelector from '@/shared/components/DateSelector';
import { useAuth } from '@/shared/hooks/useAuth';
import { Card, CardContent } from '@/shared/components/ui/card';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/shared/components/module-views/types';
import { waterDefaultViewKey, waterViews, type WaterViewKey } from '@/modules/water/views';
import { Droplet, Settings } from 'lucide-react';

type WaterViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

const WaterDailyView: React.FC<WaterViewProps> = ({ selectedDate, onDateChange }) => (
  <div className="space-y-4">
    <DateSelector selectedDate={selectedDate} onChange={onDateChange} />
    <div className="mt-4">
      <Water selectedDate={selectedDate} goal={2000} />
    </div>
  </div>
);

const WaterCalendarView: React.FC<WaterViewProps> = ({ selectedDate }) => (
  <WaterCalendar selectedDate={selectedDate} />
);

const WaterWeeklyView: React.FC<WaterViewProps> = ({ selectedDate }) => (
  <WeeklyStats selectedDate={selectedDate} />
);

const WaterRangeView: React.FC<WaterViewProps> = () => (
  <RangeStats />
);

const WaterPage: React.FC = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: WaterViewKey }>();
  const resolvedViewKey = (viewKey || waterDefaultViewKey) as WaterViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  const waterViewRegistry: Array<ModuleViewDefinition<WaterViewProps>> = waterViews.map((view) => ({
    ...view,
    component: view.key === 'daily'
      ? WaterDailyView
      : view.key === 'calendar'
      ? WaterCalendarView
      : view.key === 'weekly'
      ? WaterWeeklyView
      : WaterRangeView
  }));

  const activeView = waterViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={`/water/view/${waterDefaultViewKey}`} replace />;
  }

  if (!user) {
    return (
      <ModuleViewLayout
        title="Registro de Hidratacion"
        icon={<Droplet className="h-4 w-4 text-white" />}
      >
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold">Inicia sesion para registrar tu hidratacion</h2>
            </CardContent>
          </Card>
        </div>
      </ModuleViewLayout>
    );
  }

  const actions: ModuleViewAction[] = [
    {
      id: 'config',
      label: 'Configuracion',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate('/water/config'),
      tooltip: 'Configuracion'
    }
  ];

  const ActiveView = activeView.component;

  return (
    <ModuleViewLayout
      title="Registro de Hidratacion"
      subtitle="Monitorea tu consumo diario de liquidos"
      icon={<Droplet className="h-4 w-4 text-white" />}
      views={waterViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(`/water/view/${key}`)}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        <ActiveView selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
    </ModuleViewLayout>
  );
};

export default WaterPage;
