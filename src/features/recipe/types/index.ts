import { MEAL_TYPES } from '@/features/meal/types';

export interface RecipeIngredient {
  name: string;
  quantity: string;
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
  ingredients: RecipeIngredient[];
  instructions: string;
  nutrition: NutritionInfo;
  mealType: keyof typeof MEAL_TYPES;
}

export interface RecipeProps {}
