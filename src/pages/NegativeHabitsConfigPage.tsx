import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Ban } from 'lucide-react';
import { negativeHabitViews } from '@/features/negative-habits/views';

const NegativeHabitsConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Habitos Negativos"
      icon={<Ban className="h-4 w-4 text-white" />}
      views={negativeHabitViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/negative/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Habitos Negativos en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default NegativeHabitsConfigPage;
