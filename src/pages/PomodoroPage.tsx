import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Pomodoro } from '@/features/pomodoro/components';
import DateSelector from '@/components/DateSelector';
import { useAuth } from '@/hooks/useAuth';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/components/module-views/types';
import { pomodoroDefaultViewKey, pomodoroViews, type PomodoroViewKey } from '@/features/pomodoro/views';
import { Timer, Settings } from 'lucide-react';

type PomodoroViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

const PomodoroTimerView: React.FC<PomodoroViewProps> = ({ selectedDate, onDateChange }) => (
  <div className="space-y-6">
    <DateSelector
      selectedDate={selectedDate}
      onChange={onDateChange}
    />
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Pomodoro selectedDate={selectedDate} />
      </div>
      <div className="space-y-6" />
    </div>
  </div>
);

export default function PomodoroPage() {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: PomodoroViewKey }>();
  const resolvedViewKey = (viewKey || pomodoroDefaultViewKey) as PomodoroViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  const pomodoroViewRegistry: Array<ModuleViewDefinition<PomodoroViewProps>> = pomodoroViews.map((view) => ({
    ...view,
    component: PomodoroTimerView
  }));

  const activeView = pomodoroViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={`/pomodoro/view/${pomodoroDefaultViewKey}`} replace />;
  }

  if (!user) {
    return (
      <ModuleViewLayout
        title="Pomodoro Timer"
        icon={<Timer className="h-4 w-4 text-white" />}
      >
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold">Inicia sesion para ver tus estadisticas</h2>
        </div>
      </ModuleViewLayout>
    );
  }

  const actions: ModuleViewAction[] = [
    {
      id: 'config',
      label: 'Configuracion',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => navigate('/pomodoro/config'),
      tooltip: 'Configuracion'
    }
  ];

  const ActiveView = activeView.component;

  return (
    <ModuleViewLayout
      title="Pomodoro Timer"
      subtitle="Gestiona tus sesiones de trabajo y productividad"
      icon={<Timer className="h-4 w-4 text-white" />}
      views={pomodoroViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(`/pomodoro/view/${key}`)}
      actions={actions}
    >
      <div className="p-4">
        <ActiveView selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>
    </ModuleViewLayout>
  );
}
