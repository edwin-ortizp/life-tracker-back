import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { preparedMealsViews } from '@/features/prepared-meals/views';

const PreparedMealsConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Comidas Preparadas"
      icon={<Package className="h-4 w-4 text-white" />}
      views={preparedMealsViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/prepared-meals/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Comidas Preparadas en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default PreparedMealsConfigPage;
