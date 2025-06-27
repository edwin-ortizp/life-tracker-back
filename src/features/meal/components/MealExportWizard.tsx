import React, { useState } from 'react';
import { ModularExportWizard, ModularExportWizardConfig } from '@/components/ui/modular-export-wizard';
import { useShoppingList } from '@/features/shopping-list/hooks/useShoppingList';
import { useRecipes } from '@/features/recipe/hooks/useRecipes';
import { usePreparedMeals } from '@/features/prepared-meals/hooks/usePreparedMeals';
import { useMealPlan } from '../hooks/useMealPlan';
import { Package, ChefHat, Calendar, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

interface MealExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MealExportWizard: React.FC<MealExportWizardProps> = ({
  open,
  onOpenChange
}) => {
  const { items } = useShoppingList();
  const { recipes } = useRecipes();
  const { meals: preparedMeals } = usePreparedMeals();
  const { mealPlan } = useMealPlan();
  
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({
    mealPlan: { dateRange: 'today' }
  });

  const handleCustomFieldChange = (moduleId: string, fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [fieldId]: value
      }
    }));
  };

  const config: ModularExportWizardConfig = {
    title: 'Exportar Datos de Comidas',
    modules: [
      {
        id: 'ingredients',
        label: 'Ingredientes',
        description: 'Lista de ingredientes disponibles con cantidades',
        icon: <Package className="w-4 h-4" />,
        fields: [
          {
            id: 'in-stock',
            label: 'En stock',
            description: 'Elementos que ya tienes disponibles'
          },
          {
            id: 'low-stock',
            label: 'Stock bajo',
            description: 'Elementos que necesitas reponer pronto'
          },
          {
            id: 'to-buy',
            label: 'Pendientes de compra',
            description: 'Elementos que planeas comprar'
          },
          {
            id: 'excludeNonFood',
            label: 'Excluir no comestibles',
            description: 'Filtrar elementos de aseo y limpieza'
          },
          {
            id: 'withQuantities',
            label: 'Incluir cantidades',
            description: 'Agregar cantidades específicas de cada ingrediente'
          },
          {
            id: 'groupByStatus',
            label: 'Agrupar por estado',
            description: 'Organizar por en stock, stock bajo, pendiente'
          }
        ],
        dataGenerator: (selectedFields, _customValues) => {
          const EXCLUDED_WORDS = ['aseo', 'otro', 'limpieza'];
          let filtered = items;

          // Filtrar por categorías no alimentarias
          if (selectedFields.includes('excludeNonFood')) {
            filtered = filtered.filter(item => {
              if (!item.category) return true;
              const category = item.category.toLowerCase();
              return !EXCLUDED_WORDS.some(word => category.includes(word));
            });
          }

          // Filtrar por estado - solo incluir los estados seleccionados
          const statusFilters: string[] = [];
          if (selectedFields.includes('in-stock')) statusFilters.push('in-stock');
          if (selectedFields.includes('low-stock')) statusFilters.push('low-stock');
          if (selectedFields.includes('to-buy')) statusFilters.push('to-buy');

          // Si se seleccionó al menos un estado, filtrar por esos estados
          if (statusFilters.length > 0) {
            filtered = filtered.filter(item => statusFilters.includes(item.status));
          }

          const includeQuantities = selectedFields.includes('withQuantities');
          const groupByStatus = selectedFields.includes('groupByStatus');

          if (groupByStatus) {
            const grouped = filtered.reduce<Record<string, any>>((acc, item) => {
              const statusMap: Record<string, string> = {
                'in-stock': 'en_stock',
                'low-stock': 'stock_bajo',
                'to-buy': 'pendiente_compra'
              };
              
              const key = statusMap[item.status] || item.status;
              if (!acc[key]) acc[key] = [];
              
              const itemData = includeQuantities 
                ? { name: item.name, quantity: item.quantity }
                : { name: item.name };
              
              acc[key].push(itemData);
              return acc;
            }, {});

            return { ingredientes: grouped };
          } else {
            const itemList = filtered.map(item => 
              includeQuantities 
                ? { name: item.name, quantity: item.quantity, status: item.status }
                : { name: item.name, status: item.status }
            );
            return { ingredientes: itemList };
          }
        }
      },
      {
        id: 'preparedMeals',
        label: 'Comidas Preparadas',
        description: 'Lista de comidas ya preparadas',
        icon: <ChefHat className="w-4 h-4" />,
        dataGenerator: (_selectedFields, _customValues) => {
          return {
            comidasPreparadas: preparedMeals.map(meal => ({
              name: meal.name,
              ...(meal.portions !== undefined && { porciones: meal.portions })
            }))
          };
        }
      },
      {
        id: 'mealPlan',
        label: 'Plan de Comidas',
        description: 'Plan de comidas con selector de rango',
        icon: <Calendar className="w-4 h-4" />,
        fields: [
          {
            id: 'dateRange',
            label: 'Rango de fechas',
            description: 'Selecciona qué período exportar',
            type: 'custom',
            component: (
              <Select 
                value={customFieldValues.mealPlan?.dateRange || 'today'}
                onValueChange={(value) => handleCustomFieldChange('mealPlan', 'dateRange', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el rango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Solo hoy ({format(new Date(), 'dd/MM/yyyy', { locale: es })})</SelectItem>
                  <SelectItem value="yesterday-today">Ayer y hoy</SelectItem>
                  <SelectItem value="current-week">Semana actual</SelectItem>
                  <SelectItem value="all">Todo el plan</SelectItem>
                </SelectContent>
              </Select>
            )
          }
        ],
        dataGenerator: (_selectedFields, customValues) => {
          const dateRange = customValues?.dateRange || 'today';
          const today = new Date();
          const todayStr = format(today, 'yyyy-MM-dd');
          
          let filteredPlan = { ...mealPlan };
          
          switch (dateRange) {
            case 'today':
              filteredPlan = { [todayStr]: mealPlan[todayStr] || {} };
              break;
            case 'yesterday-today':
              const yesterday = subDays(today, 1);
              const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
              filteredPlan = {
                [yesterdayStr]: mealPlan[yesterdayStr] || {},
                [todayStr]: mealPlan[todayStr] || {}
              };
              break;
            case 'current-week':
              const weekStart = startOfWeek(today, { weekStartsOn: 1 });
              const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
              filteredPlan = {};
              for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
                const dateStr = format(d, 'yyyy-MM-dd');
                if (mealPlan[dateStr]) {
                  filteredPlan[dateStr] = mealPlan[dateStr];
                }
              }
              break;
            case 'all':
            default:
              filteredPlan = mealPlan;
              break;
          }
          
          return { 
            planComidas: filteredPlan,
            rango: dateRange,
            fechas: Object.keys(filteredPlan).sort()
          };
        }
      },
      {
        id: 'recipes',
        label: 'Recetas',
        description: 'Recetas disponibles con campos personalizables',
        icon: <BookOpen className="w-4 h-4" />,
        fields: [
          {
            id: 'allRecipes',
            label: 'Todas las recetas',
            description: 'Incluir todas las recetas (por defecto solo favoritas)'
          },
          {
            id: 'name',
            label: 'Nombre',
            description: 'Nombre de la receta'
          },
          {
            id: 'description',
            label: 'Descripción',
            description: 'Descripción de la receta'
          },
          {
            id: 'ingredients',
            label: 'Ingredientes',
            description: 'Lista de ingredientes y cantidades'
          },
          {
            id: 'instructions',
            label: 'Pasos de preparación',
            description: 'Instrucciones paso a paso'
          },
          {
            id: 'prepTime',
            label: 'Tiempo estimado',
            description: 'Tiempo de preparación en minutos'
          },
          {
            id: 'mealType',
            label: 'Tipo de comida',
            description: 'Categoría de la comida'
          },
          {
            id: 'difficulty',
            label: 'Dificultad',
            description: 'Nivel de dificultad'
          },
          {
            id: 'nutrition',
            label: 'Información nutricional',
            description: 'Calorías, proteínas, carbohidratos, grasas'
          }
        ],
        dataGenerator: (selectedFields, _customValues) => {
          // Determinar qué recetas incluir
          const includeAll = selectedFields.includes('allRecipes');
          const recipesToExport = includeAll 
            ? recipes 
            : recipes.filter(r => r.favorite === true);
          
          const result = recipesToExport.map(recipe => {
            const recipeData: any = {};
            
            // Si no se seleccionaron campos específicos, incluir campos básicos
            if (selectedFields.length === 0 || (selectedFields.length === 1 && selectedFields[0] === 'allRecipes')) {
              return {
                name: recipe.name,
                description: recipe.description,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                mealType: recipe.mealType,
                favorite: recipe.favorite
              };
            }

            // Incluir solo los campos seleccionados
            if (selectedFields.includes('name')) recipeData.name = recipe.name;
            if (selectedFields.includes('description') && recipe.description) {
              recipeData.description = recipe.description;
            }
            if (selectedFields.includes('ingredients')) {
              recipeData.ingredients = recipe.ingredients;
            }
            if (selectedFields.includes('instructions')) {
              recipeData.instructions = recipe.instructions;
            }
            if (selectedFields.includes('prepTime') && recipe.prepTime) {
              recipeData.prepTime = recipe.prepTime;
            }
            if (selectedFields.includes('mealType')) {
              recipeData.mealType = recipe.mealType;
            }
            if (selectedFields.includes('difficulty') && recipe.difficulty) {
              recipeData.difficulty = recipe.difficulty;
            }
            if (selectedFields.includes('nutrition')) {
              recipeData.nutrition = recipe.nutrition;
            }
            
            return recipeData;
          });

          return { 
            recetas: result,
            total: result.length,
            tipo: includeAll ? 'todas' : 'favoritas'
          };
        }
      }
    ]
  };

  return (
    <ModularExportWizard
      open={open}
      onOpenChange={onOpenChange}
      config={config}
      customFieldValues={customFieldValues}
      onCustomFieldChange={handleCustomFieldChange}
    />
  );
};