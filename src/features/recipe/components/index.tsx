import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useRecipes } from '../hooks/useRecipes';
import AddRecipeModal from './AddRecipeModal';
import ExportRecipesButton from './ExportRecipesButton';
import { MEAL_TYPES } from '@/features/meal/types';
import type { Recipe } from '../types';

export const Recipes: React.FC = () => {
  const { recipes, addRecipe, updateRecipe } = useRecipes();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [query, setQuery] = useState('');
  const [mealFilter, setMealFilter] = useState('');
  const [sort, setSort] = useState<'az' | 'za'>('az');

  const filtered = useMemo(() => {
    let list = recipes.filter(r =>
      r.name.toLowerCase().includes(query.toLowerCase())
    );

    if (mealFilter) {
      list = list.filter(r => r.mealType === mealFilter);
    }

    const sorted = [...list];
    sorted.sort((a, b) =>
      sort === 'az'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

    return sorted;
  }, [recipes, query, mealFilter, sort]);

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
          <div className="flex gap-2">
            <ExportRecipesButton recipes={recipes} />
            <Button onClick={() => setShowModal(true)}>Agregar</Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Input
            placeholder="Buscar"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="sm:w-60"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={sort} onValueChange={v => setSort(v as 'az' | 'za')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="az">Nombre A-Z</SelectItem>
                <SelectItem value="za">Nombre Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={mealFilter || 'all'}
              onValueChange={v => setMealFilter(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(MEAL_TYPES).map(([key, info]) => (
                  <SelectItem key={key} value={key}>{info.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500">No hay recetas guardadas</p>
        ) : (
          <div className="space-y-4">
            {filtered.map(recipe => (
              <Card key={recipe.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{recipe.name}</CardTitle>
                    <CardDescription>{MEAL_TYPES[recipe.mealType].title}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(recipe); setShowModal(true); }}>Editar</Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recipe.description && (
                    <p className="text-sm whitespace-pre-wrap">{recipe.description}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Dificultad:</span> {recipe.difficulty || 'N/A'} |{' '}
                    <span className="font-medium">Tiempo:</span> {recipe.prepTime ? `${recipe.prepTime} min` : 'N/A'}
                  </p>
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
                      {recipe.nutrition.calories} kcal |{' '}
                      {recipe.nutrition.protein}g P |{' '}
                      {recipe.nutrition.carbs}g C |{' '}
                      {recipe.nutrition.fat}g G
                    </p>
                  </div>
                </CardContent>
              </Card>
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
