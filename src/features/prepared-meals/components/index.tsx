import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePreparedMeals } from '../hooks/usePreparedMeals';
import type { PreparedMeal } from '../types';
import AddPreparedMealModal from './AddPreparedMealModal';
import { MealHeader } from '@/components/MealHeader';

export const PreparedMeals: React.FC = () => {
  const { meals, addMeal, updateMeal, deleteMeal } = usePreparedMeals();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PreparedMeal | null>(null);

  const handleSave = (data: Omit<PreparedMeal, 'id'>, id?: string) => {
    if (id) updateMeal(id, data);
    else addMeal(data);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <MealHeader 
        title="Comidas Preparadas"
        subtitle="Gestiona tus comidas listas para servir"
      >
        <Button onClick={() => setShowModal(true)}>Agregar</Button>
      </MealHeader>
      
      <Card className="flex-1 m-0 border-0 rounded-none">
        <CardContent className="p-4 space-y-4 overflow-y-auto flex-1">
          {meals.length === 0 ? (
            <p className="text-center text-gray-500">No hay comidas guardadas</p>
          ) : (
            <div className="space-y-2">
              {meals.map(meal => (
                <div key={meal.id} className="flex justify-between items-center border p-2 rounded">
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    {meal.portions !== undefined && (
                      <p className="text-sm text-gray-500">Porciones: {meal.portions}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(meal); setShowModal(true); }}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMeal(meal.id)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddPreparedMealModal
        open={showModal || !!editing}
        onOpenChange={(open) => { if (!open) setEditing(null); setShowModal(open); }}
        onSave={handleSave}
        meal={editing || undefined}
      />
    </div>
  );
};

export default PreparedMeals;
