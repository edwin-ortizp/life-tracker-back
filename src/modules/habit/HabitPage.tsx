import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Habit } from '@/modules/habit/components';
import DateSelector from '@/shared/components/DateSelector';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HABITS } from '@/modules/habit/models';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/shared/components/module-views/types';
import { habitDefaultViewKey, habitViews, type HabitViewKey } from '@/modules/habit/views';
import { CheckSquare, Settings } from 'lucide-react';

type HabitViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  habitStats: any[];
};

const HabitTrackerView: React.FC<HabitViewProps> = ({ selectedDate, onDateChange }) => (
  <div className="space-y-4">
    <DateSelector selectedDate={selectedDate} onChange={onDateChange} />
    <div className="grid grid-cols-1">
      <Habit selectedDate={selectedDate} />
    </div>
  </div>
);

const HabitAnalyticsView: React.FC<HabitViewProps> = ({ habitStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 lg:gap-6 xl:gap-8 desktop-grid-responsive">
    <Card className="desktop-card-enhanced">
      <CardContent className="p-4 lg:p-6">
        <h3 className="font-medium mb-4">Tendencias de Habitos</h3>
        <div className="h-64 md:h-80 lg:h-96">
          <ResponsiveContainer>
            <LineChart data={habitStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {HABITS.map(habit => (
                <Line
                  key={habit.id}
                  type="monotone"
                  dataKey={habit.name}
                  name={`${habit.icon} ${habit.name}`}
                  stroke={`var(--${habit.name.toLowerCase()}-color)`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    <Card className="desktop-card-enhanced">
      <CardContent className="p-4 lg:p-6">
        <h3 className="font-medium mb-4">Resumen del Mes</h3>
      </CardContent>
    </Card>
  </div>
);

const HabitPage = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: HabitViewKey }>();
  const resolvedViewKey = (viewKey || habitDefaultViewKey) as HabitViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habitStats] = useState<any[]>([]);

  const habitViewRegistry: Array<ModuleViewDefinition<HabitViewProps>> = habitViews.map((view) => ({
    ...view,
    component: view.key === 'tracker' ? HabitTrackerView : HabitAnalyticsView
  }));

  const activeView = habitViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={`/habit/view/${habitDefaultViewKey}`} replace />;
  }

  const actions: ModuleViewAction[] = [
    {
      id: 'config',
      label: 'Configuracion',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate('/habit/config'),
      tooltip: 'Configuracion'
    }
  ];

  const ActiveView = activeView.component;

  return (
    <ModuleViewLayout
      title="Seguimiento de Habitos"
      subtitle="Registra y analiza tus habitos diarios para mejorar tu estilo de vida"
      icon={<CheckSquare className="h-4 w-4 text-white" />}
      views={habitViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(`/habit/view/${key}`)}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        <ActiveView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          habitStats={habitStats}
        />
      </div>
    </ModuleViewLayout>
  );
};

export default HabitPage;
