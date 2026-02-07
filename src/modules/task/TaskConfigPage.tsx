import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { CheckSquare } from 'lucide-react';
import { taskViews } from '@/modules/task/views';

const TaskConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Tareas"
      icon={<CheckSquare className="h-4 w-4 text-white" />}
      views={taskViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/task/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Tareas en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default TaskConfigPage;
