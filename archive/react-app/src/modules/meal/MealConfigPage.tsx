import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/shared/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Utensils } from 'lucide-react';
import { mealViews } from '@/modules/meal/views';

const MealConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Comidas"
      icon={<Utensils className="h-4 w-4 text-white" />}
      views={mealViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/meal/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Comidas en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default MealConfigPage;
