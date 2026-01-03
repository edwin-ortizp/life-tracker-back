import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, ChefHat, ShoppingCart, Package } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes.supabase';
import AddRecipeModal from './AddRecipeModal';
import ExportRecipesButton from './ExportRecipesButton';
import { MEAL_TYPES } from '@/features/meal/types';
import type { Recipe } from '../types';
import { CompactMealHeader } from '@/components/navigation/CompactMealHeader';

export const Recipes: React.FC = () => {
  const { recipes, addRecipe, updateRecipe } = useRecipes();
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
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
    <div className="w-full h-full flex flex-col">
      <CompactMealHeader 
        title="Recetas"
      >
        {/* Desktop: Icon buttons */}
        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowModal(true)}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Agregar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agregar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ExportRecipesButton recipes={recipes} iconOnly />
              </TooltipTrigger>
              <TooltipContent>
                <p>Exportar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        {/* Mobile: Three dots menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 md:hidden">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <ExportRecipesButton recipes={recipes} />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {location.pathname !== '/meal' && (
              <DropdownMenuItem asChild>
                <Link to="/meal" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Plan de Comidas
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== '/shopping-list' && (
              <DropdownMenuItem asChild>
                <Link to="/shopping-list" className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Lista de Compras
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== '/recipes' && (
              <DropdownMenuItem asChild>
                <Link to="/recipes" className="flex items-center">
                  <ChefHat className="mr-2 h-4 w-4" />
                  Recetas
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== '/prepared-meals' && (
              <DropdownMenuItem asChild>
                <Link to="/prepared-meals" className="flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Comidas Preparadas
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CompactMealHeader>
      
      <div className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4 h-full overflow-y-auto">
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
        </div>
      </div>
      
      <AddRecipeModal
        open={showModal}
        onOpenChange={(o) => { if (!o) setEditing(null); setShowModal(o); }}
        onSave={handleSave}
        recipe={editing || undefined}
      />
    </div>
  );
};

export default Recipes;
