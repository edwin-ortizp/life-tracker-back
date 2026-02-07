import { Coffee, UtensilsCrossed, Moon, Sun, Cookie } from 'lucide-react';

export interface Meal {
  id: string;
  type: 'breakfast' | 'morningSnack' | 'lunch' | 'afternoonSnack' | 'dinner';
  name: string;
  notes?: string;
  recipe?: string;
  calories?: number;
}

export interface MealPlanEntry {
  [mealType: string]: Meal;
}

export interface MealPlan {
  [date: string]: MealPlanEntry;
}

export interface MealProps {
  selectedDate?: Date;
}

export const MEAL_TYPES = {
  breakfast: {
    icon: Coffee,
    title: 'Desayuno',
    color: 'bg-amber-100',
    hoverColor: 'hover:bg-amber-200',
    order: 1
  },
  morningSnack: {
    icon: Sun,
    title: 'Media Mañana',
    color: 'bg-orange-100',
    hoverColor: 'hover:bg-orange-200',
    order: 2
  },
  lunch: {
    icon: UtensilsCrossed,
    title: 'Almuerzo',
    color: 'bg-emerald-100',
    hoverColor: 'hover:bg-emerald-200',
    order: 3
  },
  afternoonSnack: {
    icon: Cookie,
    title: 'Merienda',
    color: 'bg-purple-100',
    hoverColor: 'hover:bg-purple-200',
    order: 4
  },
  dinner: {
    icon: Moon,
    title: 'Cena',
    color: 'bg-indigo-100',
    hoverColor: 'hover:bg-indigo-200',
    order: 5
  }
} as const;

// Utilidad para obtener el título en español
export const getMealTypeTitle = (type: keyof typeof MEAL_TYPES): string => {
  return MEAL_TYPES[type].title;
};