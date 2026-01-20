import React from 'react';
import { UtensilsCrossed, Plus } from 'lucide-react';
import { DailyWidget } from './DailyWidget';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface QuickAccessMealProps {
  date: Date;
  variant?: 'compact' | 'detailed';
}

export const QuickAccessMeal: React.FC<QuickAccessMealProps> = ({
  date: _date,
  variant = 'compact'
}) => {
  const navigate = useNavigate();

  // For now, we'll show static data since meal planning doesn't have daily summary integration
  // This can be enhanced later with actual meal data
  const currentHour = new Date().getHours();
  let currentMeal = 'Planificar comidas';
  
  if (currentHour >= 6 && currentHour < 11) {
    currentMeal = 'Desayuno';
  } else if (currentHour >= 11 && currentHour < 16) {
    currentMeal = 'Almuerzo';
  } else if (currentHour >= 16 && currentHour < 21) {
    currentMeal = 'Cena';
  } else {
    currentMeal = 'Snack';
  }

  const handlePlanMeal = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/meal/view/weekly');
  };

  return (
    <DailyWidget
      title="Comidas"
      icon={UtensilsCrossed}
      variant={variant}
      onClick={() => navigate('/meal/view/weekly')}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-orange-600">
              {currentMeal}
            </p>
            <p className="text-xs text-gray-500">
              Planificación semanal
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePlanMeal}
            className="flex items-center gap-1 bg-orange-50 hover:bg-orange-100 border-orange-200"
          >
            <Plus className="w-3 h-3" />
            {variant === 'detailed' && 'Planificar'}
          </Button>
        </div>
        
        {variant === 'detailed' && (
          <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
            <p>🍽️ Organiza tu menú semanal y lista de compras</p>
          </div>
        )}
      </div>
    </DailyWidget>
  );
};

export default QuickAccessMeal;
