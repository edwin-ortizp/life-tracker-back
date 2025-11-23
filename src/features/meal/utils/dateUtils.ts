// src/features/meal/utils/dateUtils.ts
// Utilidades específicas para el módulo de comidas

import type { Meal } from '../types';

/**
 * Horas predeterminadas para cada tipo de comida
 */
export const MEAL_HOURS: Record<Meal['type'], number> = {
  breakfast: 8,
  morningSnack: 11,
  lunch: 14,
  afternoonSnack: 17,
  dinner: 20
};

/**
 * Verifica si una comida ya pasó (está en el pasado)
 * @param dateStr - Fecha en formato YYYY-MM-DD
 * @param type - Tipo de comida
 * @returns true si la comida ya pasó
 */
export const isPastMeal = (dateStr: string, type: Meal['type']): boolean => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const mealDate = new Date(year, month - 1, day, MEAL_HOURS[type] || 0, 0, 0, 0);
  return mealDate.getTime() < Date.now();
};
