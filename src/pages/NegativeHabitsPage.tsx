// src/pages/NegativeHabitsPage.tsx
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNegativeHabitData } from '../features/negative-habits/hooks/useNegativeHabitData.supabase';
import { WeeklyView } from '../features/negative-habits/components/WeeklyView';
import { YearlyView } from '../features/negative-habits/components/YearlyView';
import { AddHabitModal } from '../features/negative-habits/components/AddHabitModal';
import { NegativeHabitAiMenu } from '../features/negative-habits/components/NegativeHabitAiMenu';
import type { NegativeHabitLog } from '@/features/negative-habits/types';
import DateSelector from '@/components/DateSelector';
import { getLocalDateString } from '@/utils/dates';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/components/module-views/types';
import { negativeHabitDefaultViewKey, negativeHabitViews, type NegativeHabitViewKey } from '@/features/negative-habits/views';
import { Ban, Settings } from 'lucide-react';

type NegativeHabitViewProps = {
  selectedDate: Date;
  habits: { [key: string]: NegativeHabitLog };
  status: string;
  error: string | null;
  logHabit: (habitId: number, date: string, note?: string) => Promise<void>;
  removeLog: (habitId: number, date: string) => Promise<void>;
  isOnline: boolean;
};

const NegativeHabitsWeeklyView: React.FC<NegativeHabitViewProps> = ({
  selectedDate,
  habits,
  status,
  logHabit,
  removeLog,
  isOnline
}) => (
  <WeeklyView
    habits={habits}
    onLogHabit={(habitId, note) => logHabit(habitId, getLocalDateString(selectedDate), note)}
    onRemoveLog={removeLog}
    disabled={status === 'saving' || !isOnline}
  />
);

const NegativeHabitsYearlyView: React.FC<NegativeHabitViewProps> = ({
  habits,
  logHabit,
  removeLog
}) => (
  <YearlyView
    habits={habits}
    onLogHabit={logHabit}
    onRemoveLog={removeLog}
  />
);

const NegativeHabitsPage = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: NegativeHabitViewKey }>();
  const resolvedViewKey = (viewKey || negativeHabitDefaultViewKey) as NegativeHabitViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const {
    habits,
    status,
    error,
    logHabit,
    removeLog,
  } = useNegativeHabitData();
  const { isOnline } = useNetworkStatus();

  const negativeHabitViewRegistry: Array<ModuleViewDefinition<NegativeHabitViewProps>> = negativeHabitViews.map((view) => ({
    ...view,
    component: view.key === 'weekly' ? NegativeHabitsWeeklyView : NegativeHabitsYearlyView
  }));

  const activeView = negativeHabitViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={`/negative/view/${negativeHabitDefaultViewKey}`} replace />;
  }

  if (!user) {
    return (
      <ModuleViewLayout
        title="Habitos Negativos"
        icon={<Ban className="h-4 w-4 text-white" />}
      >
        <div className="p-4">
          <Card className="w-full">
            <CardContent className="p-4 text-center">
              <p>Inicia sesion para registrar tus habitos negativos</p>
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
      onClick: () => navigate('/negative/config'),
      tooltip: 'Configuracion'
    }
  ];

  const ActiveView = activeView.component;

  return (
    <ModuleViewLayout
      title="Habitos Negativos"
      subtitle="Identifica y reduce comportamientos que quieres cambiar"
      icon={<Ban className="h-4 w-4 text-white" />}
      views={negativeHabitViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(`/negative/view/${key}`)}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        <DateSelector
          selectedDate={selectedDate}
          onChange={setSelectedDate}
        />

        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="font-medium text-lg">Registro de Habitos</h3>
                <p className="text-sm text-gray-500">
                  Identifica y registra los habitos que deseas cambiar
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NegativeHabitAiMenu habits={habits} />
              </div>
            </div>

            <ActiveView
              selectedDate={selectedDate}
              habits={habits}
              status={status}
              error={error}
              logHabit={logHabit}
              removeLog={removeLog}
              isOnline={isOnline}
            />

            {error && (
              <p className="mt-4 text-sm text-red-500">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLogHabit={async (habitId, note) => {
          await logHabit(habitId, getLocalDateString(selectedDate), note);
          setIsModalOpen(false);
        }}
        selectedDate={selectedDate}
      />
    </ModuleViewLayout>
  );
};

export default NegativeHabitsPage;
