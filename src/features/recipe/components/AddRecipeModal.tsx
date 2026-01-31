import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MEAL_TYPES } from '@/features/meal/types';
import type { Recipe, RecipeIngredientRelation } from '../types';
import { IngredientsSelector } from './IngredientsSelector';
import { useShoppingList } from '@/features/shopping-list/hooks/useShoppingList.supabase';
import { useRecipeIngredients } from '../hooks/useRecipeIngredients';

interface AddRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recipe: Omit<Recipe, 'id'>, id?: string) => Promise<string | null>;
  recipe?: Recipe;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ open, onOpenChange, onSave, recipe }) => {
  const { items: shoppingItems } = useShoppingList();
  const { ingredients: relatedIngredients, replaceAllIngredients: saveRelatedIngredients } = useRecipeIngredients(recipe?.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [difficulty, setDifficulty] = useState<'fácil' | 'media' | 'difícil'>('fácil');
  const [prepTime, setPrepTime] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<keyof typeof MEAL_TYPES>('breakfast');
  const [relatedIngredientsInput, setRelatedIngredientsInput] = useState<Array<{
    shoppingItemId: string;
    shoppingItemName: string;
    quantity: number;
    unit?: string;
    notes?: string;
  }>>([]);

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setInstructions(recipe.instructions);
      setDifficulty(recipe.difficulty || 'fácil');
      setPrepTime(recipe.prepTime !== undefined ? String(recipe.prepTime) : '');
      setCalories(String(recipe.nutrition.calories));
      setProtein(String(recipe.nutrition.protein));
      setCarbs(String(recipe.nutrition.carbs));
      setFat(String(recipe.nutrition.fat));
      setMealType(recipe.mealType);

      // Cargar ingredientes relacionados
      setRelatedIngredientsInput(
        relatedIngredients.map(ing => ({
          shoppingItemId: ing.shoppingItemId,
          shoppingItemName: ing.shoppingItem.name,
          quantity: ing.quantity,
          unit: ing.unit,
          notes: ing.notes
        }))
      );
    } else {
      setName('');
      setDescription('');
      setInstructions('');
      setDifficulty('fácil');
      setPrepTime('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setMealType('breakfast');
      setRelatedIngredientsInput([]);
    }
  }, [recipe, open, relatedIngredients]);

  const handleSave = async () => {
    const data: Omit<Recipe, 'id'> = {
      name,
      description: description.trim() || undefined,
      difficulty,
      prepTime: prepTime ? Number(prepTime) : undefined,
      instructions,
      nutrition: {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0
      },
      mealType
    };

    let recipeId: string | null = null;
    if (recipe) {
      recipeId = await onSave(data, recipe.id);
    } else {
      recipeId = await onSave(data);
    }

    // Guardar las relaciones con shopping items
    if (recipeId && relatedIngredientsInput.length > 0) {
      const relationsToSave = relatedIngredientsInput.map(ing => ({
        shoppingItemId: ing.shoppingItemId,
        quantity: ing.quantity,
        unit: ing.unit,
        notes: ing.notes
      }));
      await saveRelatedIngredients(relationsToSave);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? 'Editar' : 'Agregar'} Receta</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Información básica */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-semibold">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm font-medium">Dificultad</Label>
                <Select value={difficulty} onValueChange={v => setDifficulty(v as 'fácil' | 'media' | 'difícil') }>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fácil">Fácil</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prepTime" className="text-sm font-medium">Tiempo (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  value={prepTime}
                  onChange={e => setPrepTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          {/* Ingredientes */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Ingredientes</Label>
              <span className="text-sm text-gray-500">
                {relatedIngredientsInput.length} ingrediente{relatedIngredientsInput.length !== 1 ? 's' : ''}
              </span>
            </div>
            <IngredientsSelector
              ingredients={relatedIngredientsInput}
              onChange={setRelatedIngredientsInput}
              availableItems={shoppingItems}
            />
          </div>
          {/* Instrucciones */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-base font-semibold">Instrucciones</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="min-h-[150px] text-base"
              placeholder="1. Precalentar el horno a 180°C&#10;2. Mezclar ingredientes secos...&#10;3. Agregar ingredientes húmedos..."
            />
          </div>

          {/* Información nutricional y tipo */}
          <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Información Nutricional</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="calories" className="text-xs">Calorías</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="protein" className="text-xs">Proteína (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={protein}
                    onChange={e => setProtein(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carbs" className="text-xs">Carbohidratos (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={e => setCarbs(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fat" className="text-xs">Grasa (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={fat}
                    onChange={e => setFat(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mealType" className="text-sm font-semibold">Tipo de Comida</Label>
              <Select value={mealType} onValueChange={v => setMealType(v as keyof typeof MEAL_TYPES)}>
                <SelectTrigger id="mealType" className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_TYPES).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecipeModal;
