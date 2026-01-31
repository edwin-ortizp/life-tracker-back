import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical, Settings } from 'lucide-react';
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
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  const handleSave = async (data: Omit<Recipe, 'id'>, id?: string): Promise<string | null> => {
    if (id) {
      await updateRecipe(id, data);
      return id;
    } else {
      const newId = await addRecipe(data);
      return newId;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <CompactMealHeader
        title="Recetas"
        views={[{ key: 'list', label: 'Lista' }]}
        activeViewKey="list"
        onViewChange={() => navigate('/recipes/view/list')}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate('/recipes/config')}>
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Configuracion</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configuracion</p>
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
            <DropdownMenuItem onClick={() => navigate('/recipes/config')}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {location.pathname !== '/meal/view/weekly' && (
              <DropdownMenuItem asChild>
                <Link to="/meal/view/weekly" className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Plan de Comidas
                </Link>
              </DropdownMenuItem>
            )}
            {!location.pathname.startsWith('/shopping-list') && (
              <DropdownMenuItem asChild>
                <Link to="/shopping-list/view/list" className="flex items-center">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Lista de Compras
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== '/recipes/view/list' && (
              <DropdownMenuItem asChild>
                <Link to="/recipes/view/list" className="flex items-center">
                  <ChefHat className="mr-2 h-4 w-4" />
                  Recetas
                </Link>
              </DropdownMenuItem>
            )}
            {location.pathname !== '/prepared-meals/view/list' && (
              <DropdownMenuItem asChild>
                <Link to="/prepared-meals/view/list" className="flex items-center">
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
              <Card
                key={recipe.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{recipe.name}</CardTitle>
                    <CardDescription>{MEAL_TYPES[recipe.mealType].title}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(recipe);
                      setShowModal(true);
                    }}
                  >
                    Editar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recipe.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Dificultad:</span>
                      <span className="text-gray-600 capitalize">{recipe.difficulty || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Tiempo:</span>
                      <span className="text-gray-600">{recipe.prepTime ? `${recipe.prepTime} min` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Calorías:</span>
                      <span className="text-gray-600">{recipe.nutrition.calories} kcal</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Haz click para ver la receta completa
                  </p>
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
