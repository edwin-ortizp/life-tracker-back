import React from 'react';
import { ModularExportWizard, ModularExportWizardConfig } from '@/components/ui/modular-export-wizard';
import { useRecipes } from '../hooks/useRecipes';
import type { Recipe } from '../types';
import { BookOpen, Star, Clock, ChefHat, Info } from 'lucide-react';

interface RecipeExportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecipeExportWizard: React.FC<RecipeExportWizardProps> = ({
  open,
  onOpenChange
}) => {
  const { recipes } = useRecipes();

  const config: ModularExportWizardConfig = {
    title: 'Exportar Recetas',
    modules: [
      {
        id: 'recipes',
        label: 'Recetas',
        description: 'Recetas con campos y opciones personalizables',
        icon: <BookOpen className="w-4 h-4" />,
        fields: [
          {
            id: 'allRecipes',
            label: 'Todas las recetas',
            description: 'Incluir todas las recetas (por defecto solo favoritas)'
          },
          {
            id: 'groupByMealType',
            label: 'Agrupar por tipo de comida',
            description: 'Organizar por desayuno, almuerzo, cena, etc.'
          },
          {
            id: 'groupByDifficulty',
            label: 'Agrupar por dificultad',
            description: 'Organizar por nivel de dificultad'
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
            id: 'difficulty',
            label: 'Dificultad',
            description: 'Nivel de dificultad (fácil, media, difícil)'
          },
          {
            id: 'prepTime',
            label: 'Tiempo de preparación',
            description: 'Tiempo estimado en minutos'
          },
          {
            id: 'ingredients',
            label: 'Ingredientes',
            description: 'Lista de ingredientes con cantidades'
          },
          {
            id: 'instructions',
            label: 'Pasos de preparación',
            description: 'Instrucciones detalladas'
          },
          {
            id: 'nutrition',
            label: 'Información nutricional',
            description: 'Calorías, proteínas, carbohidratos, grasas'
          },
          {
            id: 'mealType',
            label: 'Tipo de comida',
            description: 'Categoría de la comida'
          },
          {
            id: 'favorite',
            label: 'Estado favorito',
            description: 'Si la receta está marcada como favorita'
          }
        ],
        dataGenerator: (selectedFields, customValues) => {
          // Determinar qué recetas incluir
          const includeAll = selectedFields.includes('allRecipes');
          const recipesToExport = includeAll 
            ? recipes 
            : recipes.filter(recipe => recipe.favorite === true);

          // Función para formatear una receta según los campos seleccionados
          const formatRecipe = (recipe: Recipe) => {
            const result: any = {};

            // Si solo se seleccionó "allRecipes" o ningún campo específico, incluir campos básicos
            const fieldsToInclude = selectedFields.filter(f => f !== 'allRecipes' && f !== 'groupByMealType' && f !== 'groupByDifficulty');
            
            if (fieldsToInclude.length === 0) {
              return {
                name: recipe.name,
                description: recipe.description,
                difficulty: recipe.difficulty,
                prepTime: recipe.prepTime,
                ingredients: recipe.ingredients,
                instructions: recipe.instructions,
                nutrition: recipe.nutrition,
                mealType: recipe.mealType,
                favorite: recipe.favorite
              };
            }

            // Incluir solo los campos seleccionados
            if (selectedFields.includes('name')) result.name = recipe.name;
            if (selectedFields.includes('description') && recipe.description) {
              result.description = recipe.description;
            }
            if (selectedFields.includes('difficulty') && recipe.difficulty) {
              result.difficulty = recipe.difficulty;
            }
            if (selectedFields.includes('prepTime') && recipe.prepTime) {
              result.prepTime = recipe.prepTime;
            }
            if (selectedFields.includes('ingredients')) {
              result.ingredients = recipe.ingredients;
            }
            if (selectedFields.includes('instructions')) {
              result.instructions = recipe.instructions;
            }
            if (selectedFields.includes('nutrition')) {
              result.nutrition = recipe.nutrition;
            }
            if (selectedFields.includes('mealType')) {
              result.mealType = recipe.mealType;
            }
            if (selectedFields.includes('favorite')) {
              result.favorite = recipe.favorite;
            }

            return result;
          };

          // Determinar estructura de agrupación
          if (selectedFields.includes('groupByMealType') && selectedFields.includes('groupByDifficulty')) {
            // Agrupación doble: por tipo de comida y dificultad
            const grouped = recipesToExport.reduce<Record<string, Record<string, any[]>>>((acc, recipe) => {
              const mealType = recipe.mealType;
              const difficulty = recipe.difficulty || 'sin_especificar';
              
              if (!acc[mealType]) acc[mealType] = {};
              if (!acc[mealType][difficulty]) acc[mealType][difficulty] = [];
              
              acc[mealType][difficulty].push(formatRecipe(recipe));
              return acc;
            }, {});

            return { recetas: grouped };
          } else if (selectedFields.includes('groupByMealType')) {
            // Solo por tipo de comida
            const grouped = recipesToExport.reduce<Record<string, any[]>>((acc, recipe) => {
              const key = recipe.mealType;
              if (!acc[key]) acc[key] = [];
              acc[key].push(formatRecipe(recipe));
              return acc;
            }, {});

            return { recetas: grouped };
          } else if (selectedFields.includes('groupByDifficulty')) {
            // Solo por dificultad
            const grouped = recipesToExport.reduce<Record<string, any[]>>((acc, recipe) => {
              const key = recipe.difficulty || 'sin_especificar';
              if (!acc[key]) acc[key] = [];
              acc[key].push(formatRecipe(recipe));
              return acc;
            }, {});

            return { recetas: grouped };
          } else {
            // Lista simple
            return {
              recetas: recipesToExport.map(formatRecipe),
              total: recipesToExport.length,
              tipo: includeAll ? 'todas' : 'favoritas',
              exportedAt: new Date().toISOString()
            };
          }
        }
      }
    ]
  };

  return (
    <ModularExportWizard
      open={open}
      onOpenChange={onOpenChange}
      config={config}
    />
  );
};