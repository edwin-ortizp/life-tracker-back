import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { habitViews } from '@/modules/habit/views';

const HabitConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Habitos"
      icon={<CheckSquare className="h-4 w-4 text-white" />}
      views={habitViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/habit/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Habitos en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default HabitConfigPage;
