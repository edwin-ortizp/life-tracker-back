export const mealViews = [
  { key: 'weekly', label: 'Semanal' },
] as const;

export type MealViewKey = typeof mealViews[number]['key'];

export const mealDefaultViewKey: MealViewKey = 'weekly';
