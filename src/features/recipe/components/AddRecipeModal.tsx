import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MEAL_TYPES } from '@/features/meal/types';
import type { Recipe } from '../types';

interface AddRecipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recipe: Omit<Recipe, 'id'>, id?: string) => void;
  recipe?: Recipe;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ open, onOpenChange, onSave, recipe }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<keyof typeof MEAL_TYPES>('breakfast');

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setDescription(recipe.description || '');
      setIngredients(recipe.ingredients.map(i => `${i.quantity} ${i.name}`).join('\n'));
      setInstructions(recipe.instructions);
      setCalories(String(recipe.nutrition.calories));
      setProtein(String(recipe.nutrition.protein));
      setCarbs(String(recipe.nutrition.carbs));
      setFat(String(recipe.nutrition.fat));
      setMealType(recipe.mealType);
    } else {
      setName('');
      setDescription('');
      setIngredients('');
      setInstructions('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setMealType('breakfast');
    }
  }, [recipe, open]);

  const handleSave = () => {
    const ingredientsArr = ingredients
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        const [qty, ...rest] = line.split(' ');
        return { quantity: qty, name: rest.join(' ') };
      });

    const data: Omit<Recipe, 'id'> = {
      name,
      ingredients: ingredientsArr,
      description: description.trim() || undefined,
      instructions,
      nutrition: {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0
      },
      mealType
    };

    if (recipe) {
      onSave(data, recipe.id);
    } else {
      onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? 'Editar' : 'Agregar'} Receta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
        <div className="space-y-1">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <div className="space-y-1">
            <Label htmlFor="ingredients">Ingredientes (uno por línea)</Label>
            <Textarea id="ingredients" value={ingredients} onChange={e => setIngredients(e.target.value)} className="min-h-[120px]" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="instructions">Instrucciones</Label>
            <Textarea id="instructions" value={instructions} onChange={e => setInstructions(e.target.value)} className="min-h-[120px]" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label htmlFor="calories">Calorías</Label>
              <Input id="calories" type="number" value={calories} onChange={e => setCalories(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="protein">Proteína (g)</Label>
              <Input id="protein" type="number" value={protein} onChange={e => setProtein(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input id="carbs" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fat">Grasa (g)</Label>
              <Input id="fat" type="number" value={fat} onChange={e => setFat(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mealType">Tipo de comida</Label>
            <Select value={mealType} onValueChange={v => setMealType(v as keyof typeof MEAL_TYPES)}>
              <SelectTrigger id="mealType">
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
        <DialogFooter>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecipeModal;
