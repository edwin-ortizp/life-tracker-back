import { Coffee, UtensilsCrossed, Moon } from 'lucide-react';

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  name: string;
  notes?: string;
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
    hoverColor: 'hover:bg-amber-200'
  },
  lunch: {
    icon: UtensilsCrossed,
    title: 'Almuerzo',
    color: 'bg-emerald-100',
    hoverColor: 'hover:bg-emerald-200'
  },
  dinner: {
    icon: Moon,
    title: 'Cena',
    color: 'bg-indigo-100',
    hoverColor: 'hover:bg-indigo-200'
  }
} as const;