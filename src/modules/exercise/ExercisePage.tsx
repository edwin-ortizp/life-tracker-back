// src/pages/ExercisePage.tsx
import React, { useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Exercise, ExerciseCalendar } from '@/modules/exercise/components';
import DateSelector from '@/shared/components/DateSelector';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Dumbbell, Plus, Settings } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import type { ModuleViewAction, ModuleViewDefinition } from '@/shared/components/module-views/types';
import { exerciseDefaultViewKey, exerciseViews, type ExerciseViewKey } from '@/modules/exercise/views';

type ExerciseRef = {
  openAddExercise: () => void;
};

type ExerciseViewProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  exerciseRef: React.RefObject<ExerciseRef | null>;
};

const ExerciseDailyView: React.FC<ExerciseViewProps> = ({
  selectedDate,
  onDateChange,
  exerciseRef
}) => (
  <div className="space-y-4">
    <DateSelector selectedDate={selectedDate} onChange={onDateChange} />
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <Exercise ref={exerciseRef} selectedDate={selectedDate} />
    </div>
  </div>
);

const ExerciseCalendarView: React.FC<ExerciseViewProps> = ({ selectedDate }) => (
  <ExerciseCalendar selectedDate={selectedDate} />
);

const ExercisePage: React.FC = () => {
  const navigate = useNavigate();
  const { viewKey } = useParams<{ viewKey: ExerciseViewKey }>();
  const resolvedViewKey = (viewKey || exerciseDefaultViewKey) as ExerciseViewKey;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();
  const exerciseRef = useRef<ExerciseRef | null>(null);

  const exerciseViewRegistry: Array<ModuleViewDefinition<ExerciseViewProps>> = exerciseViews.map((view) => ({
    ...view,
    component: view.key === 'daily' ? ExerciseDailyView : ExerciseCalendarView
  }));

  const activeView = exerciseViewRegistry.find((view) => view.key === resolvedViewKey);

  if (!activeView) {
    return <Navigate to={`/exercise/view/${exerciseDefaultViewKey}`} replace />;
  }

  if (!user) {
    return (
      <ModuleViewLayout
        title="Ejercicio"
        icon={<Dumbbell className="h-4 w-4 text-white" />}
      >
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Inicia sesion</h2>
              <p className="text-gray-500">
                Necesitas iniciar sesion para registrar y ver tus ejercicios
              </p>
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
      onClick: () => navigate('/exercise/config'),
      tooltip: 'Configuracion'
    }
  ];

  const ActiveView = activeView.component;
  const viewProps: ExerciseViewProps = {
    selectedDate,
    onDateChange: setSelectedDate,
    exerciseRef
  };

  return (
    <ModuleViewLayout
      title="Registro de Ejercicio"
      subtitle="Registra y monitorea tus actividades fisicas diarias"
      icon={<Dumbbell className="h-4 w-4 text-white" />}
      views={exerciseViewRegistry}
      activeViewKey={resolvedViewKey}
      onViewChange={(key) => navigate(`/exercise/view/${key}`)}
      actions={actions}
    >
      <div className="p-4 space-y-4">
        <ActiveView {...viewProps} />
      </div>

      <Button
        onClick={() => exerciseRef.current?.openAddExercise()}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 lg:hidden bg-black text-white hover:bg-gray-800"
        size="icon"
        title="Agregar ejercicio"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </ModuleViewLayout>
  );
};

export default ExercisePage;
