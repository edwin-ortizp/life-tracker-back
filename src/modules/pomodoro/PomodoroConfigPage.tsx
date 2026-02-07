import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Timer } from 'lucide-react';
import { pomodoroViews } from '@/modules/pomodoro/views';

const PomodoroConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Pomodoro"
      icon={<Timer className="h-4 w-4 text-white" />}
      views={pomodoroViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/pomodoro/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Pomodoro en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default PomodoroConfigPage;
