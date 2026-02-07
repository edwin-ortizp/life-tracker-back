import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Edit, Clock, ChefHat, Flame, ListPlus } from 'lucide-react';
import { useRecipes } from '../controllers/useRecipes.supabase';
import { useRecipeIngredients } from '../controllers/useRecipeIngredients';
import { useShoppingList } from '@/modules/shopping-list/controllers/useShoppingList.supabase';
import { MEAL_TYPES } from '@/modules/meal/models';
import { paths } from '@/core/routes/paths';
import AddRecipeModal from './AddRecipeModal';
import ManageIngredientsModal from './ManageIngredientsModal';

export const RecipeDetail: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { recipes, updateRecipe } = useRecipes();
  const { items: shoppingItems } = useShoppingList();
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = React.useState(false);

  const recipe = useMemo(
    () => recipes.find(r => r.id === recipeId),
    [recipes, recipeId]
  );

  const { ingredients: relatedIngredients = [], replaceAllIngredients } = useRecipeIngredients(recipeId);

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 mb-4">Receta no encontrada</p>
        <Button onClick={() => navigate(paths.recipes.view('list'))}>
          Volver a Recetas
        </Button>
      </div>
    );
  }

  const handleSave = async (data: any, id?: string) => {
    if (id) {
      await updateRecipe(id, data);
      return id;
    }
    return null;
  };

  const handleSaveIngredients = async (ingredients: any[]) => {
    if (!recipeId) return;
    const relationsToSave = ingredients.map(ing => ({
      shoppingItemId: ing.shoppingItemId,
      quantity: ing.quantity,
      unit: ing.unit,
      notes: ing.notes
    }));
    await replaceAllIngredients(relationsToSave);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(paths.recipes.view('list'))}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{recipe.name}</h1>
          <p className="text-sm text-gray-500">{MEAL_TYPES[recipe.mealType].title}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditModal(true)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{recipe.prepTime || '—'}</p>
                    <p className="text-xs text-gray-500">minutos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold capitalize">{recipe.difficulty || '—'}</p>
                    <p className="text-xs text-gray-500">dificultad</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{recipe.nutrition.calories}</p>
                    <p className="text-xs text-gray-500">kcal</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Macros</p>
                  <p className="text-sm font-medium">
                    P: {recipe.nutrition.protein}g |
                    C: {recipe.nutrition.carbs}g |
                    G: {recipe.nutrition.fat}g
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {recipe.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{recipe.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Ingredients */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-lg">
                  Ingredientes ({relatedIngredients?.length || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIngredientsModal(true)}
                >
                  <ListPlus className="w-4 h-4 mr-2" />
                  Gestionar
                </Button>
              </CardHeader>
              <CardContent>
                {relatedIngredients && relatedIngredients.length > 0 ? (
                  <ul className="space-y-3">
                    {relatedIngredients.map(ing => (
                      <li key={ing.shoppingItemId} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <div className="flex-1">
                          <p className="font-medium">{ing.shoppingItem.name}</p>
                          <p className="text-sm text-gray-600">
                            {ing.quantity} {ing.unit || 'unidades'}
                            {ing.notes && <span className="text-gray-500"> • {ing.notes}</span>}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-3">
                      No hay ingredientes agregados
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowIngredientsModal(true)}
                    >
                      <ListPlus className="w-4 h-4 mr-2" />
                      Agregar Ingredientes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instrucciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{recipe.instructions}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AddRecipeModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleSave}
        recipe={recipe}
      />

      {/* Manage Ingredients Modal */}
      <ManageIngredientsModal
        open={showIngredientsModal}
        onOpenChange={setShowIngredientsModal}
        ingredients={relatedIngredients}
        availableItems={shoppingItems}
        onSave={handleSaveIngredients}
      />
    </div>
  );
};

export default RecipeDetail;
