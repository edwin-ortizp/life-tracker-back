import React from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleViewLayout from '@/components/module-views/ModuleViewLayout';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { shoppingListViews } from '@/features/shopping-list/views';

const ShoppingListConfigPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ModuleViewLayout
      title="Configuracion de Lista de Compras"
      icon={<ShoppingCart className="h-4 w-4 text-white" />}
      views={shoppingListViews.map((view) => ({ ...view, component: () => null }))}
      onViewChange={(key) => navigate(`/shopping-list/view/${key}`)}
    >
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-sm text-gray-600">
            No hay configuraciones especificas para Lista de Compras en este modulo.
          </CardContent>
        </Card>
      </div>
    </ModuleViewLayout>
  );
};

export default ShoppingListConfigPage;
