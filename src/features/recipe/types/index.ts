import { MEAL_TYPES } from '@/features/meal/types';
import type { ShoppingItem } from '@/features/shopping-list/types';

// Tipo antiguo (para compatibilidad con JSONB legacy)
export interface RecipeIngredient {
  name: string;
  quantity: string;
}

// Nuevo tipo para la relación con shopping_items
export interface RecipeIngredientRelation {
  recipeId: string;
  shoppingItemId: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

// Tipo expandido que incluye los detalles del shopping_item
export interface RecipeIngredientWithItem extends RecipeIngredientRelation {
  shoppingItem: ShoppingItem;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  name: string;
  /** Breve descripción opcional de la receta */
  description?: string;
  /** Nivel de dificultad opcional */
  difficulty?: 'fácil' | 'media' | 'difícil';
  /** Tiempo aproximado de preparación en minutos */
  prepTime?: number;
  /** @deprecated Legacy field - use recipe_ingredients table instead */
  ingredients?: RecipeIngredient[];
  instructions: string;
  nutrition: NutritionInfo;
  mealType: keyof typeof MEAL_TYPES;
  /** Marca si es una receta favorita */
  favorite?: boolean;
}

export interface RecipeProps {}
