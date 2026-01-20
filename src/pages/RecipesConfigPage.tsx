import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ChefHat } from 'lucide-react';
import { recipeViews } from '@/features/recipe/views';

const RecipesConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Recetas"
      icon={<ChefHat className="h-4 w-4 text-white" />}
      views={recipeViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/recipes/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Recetas en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default RecipesConfigPage;
