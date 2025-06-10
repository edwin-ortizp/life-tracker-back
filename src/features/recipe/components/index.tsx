import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRecipes } from '../hooks/useRecipes';
import AddRecipeModal from './AddRecipeModal';
import { MEAL_TYPES } from '@/features/meal/types';
import type { Recipe } from '../types';

export const Recipes: React.FC = () => {
  const { recipes, addRecipe, updateRecipe } = useRecipes();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);

  const handleSave = (data: Omit<Recipe, 'id'>, id?: string) => {
    if (id) {
      updateRecipe(id, data);
    } else {
      addRecipe(data);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardContent className="p-4 space-y-4 overflow-y-auto flex-1">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-lg">Recetas</h3>
          <Button onClick={() => setShowModal(true)}>Agregar</Button>
        </div>
        {recipes.length === 0 ? (
          <p className="text-center text-gray-500">No hay recetas guardadas</p>
        ) : (
          <div className="space-y-4">
            {recipes.map(recipe => (
              <div key={recipe.id} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{recipe.name}</h4>
                    <span className="text-sm text-gray-500">
                      {MEAL_TYPES[recipe.mealType].title}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(recipe); setShowModal(true); }}>Editar</Button>
                </div>
                <div>
                  <p className="text-sm font-medium">Ingredientes:</p>
                  <ul className="list-disc pl-4 text-sm">
                    {recipe.ingredients.map((ing, idx) => (
                      <li key={idx}>{ing.quantity} {ing.name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium">Instrucciones:</p>
                  <p className="text-sm whitespace-pre-wrap">{recipe.instructions}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Información Nutricional:</p>
                  <p className="text-sm">
                    {recipe.nutrition.calories} kcal |
                    {" "}{recipe.nutrition.protein}g P |
                    {recipe.nutrition.carbs}g C |
                    {recipe.nutrition.fat}g G
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <AddRecipeModal
        open={showModal}
        onOpenChange={(o) => { if (!o) setEditing(null); setShowModal(o); }}
        onSave={handleSave}
        recipe={editing || undefined}
      />
    </Card>
  );
};

export default Recipes;
