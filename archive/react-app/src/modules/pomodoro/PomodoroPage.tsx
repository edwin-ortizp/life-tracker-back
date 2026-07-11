import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Pomodoro, PomodoroMonthlySidebar } from '@/modules/pomodoro/components';
import DateSelector from '@/shared/components/DateSelector';
import { useAuth } from '@/shared/hooks/useAuth';
import { useModuleSettings } from '@/shared/hooks/useModuleSettings';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/shared/components/module-views/types';
import { pomodoroDefaultViewKey, pomodoroViews, type PomodoroViewKey } from '@/modules/pomodoro/views';
import { Timer, Settings } from 'lucide-react';
import { paths } from '@/core/routes/paths';

type PomodoroViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  goalMinutes: number;
};

const PomodoroTimerView: React.FC<PomodoroViewProps> = ({ selectedDate, onDateChange, goalMinutes }) => (
  <div className="space-y-6">
    <DateSelector
      selectedDate={selectedDate}
      onChange={onDateChange}
    />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Pomodoro selectedDate={selectedDate} dailyGoalMinutes={goalMinutes} />
      <PomodoroMonthlySidebar
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        goalMinutes={goalMinutes}
      />
    </div>
  </div>
);

export default function PomodoroPage() {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: PomodoroViewKey }>();
  const resolvedViewKey = (viewKey || pomodoroDefaultViewKey) as PomodoroViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();
  const { settings } = useModuleSettings('pomodoro', { dailyWorkMinutesGoal: 300 });
  const goalMinutes = Number(settings.dailyWorkMinutesGoal) > 0
    ? Number(settings.dailyWorkMinutesGoal)
    : 300;

  const pomodoroViewRegistry: Array<ModuleViewDefinition<PomodoroViewProps>> = pomodoroViews.map((view) => ({
    ...view,
    component: PomodoroTimerView
  }));

  const activeView = pomodoroViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={paths.pomodoro.view(pomodoroDefaultViewKey)} replace />;
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
      onClick: () => navigate(paths.pomodoro.config),
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
      onViewChange={(key) => navigate(paths.pomodoro.view(key))}
      actions={actions}
    >
      <div className="p-4">
        <ActiveView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          goalMinutes={goalMinutes}
        />
      </div>
    </ModuleViewLayout>
  );
}
