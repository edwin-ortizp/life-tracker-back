export const preparedMealsViews = [
  { key: 'list', label: 'Lista' },
] as const;

export type PreparedMealsViewKey = typeof preparedMealsViews[number]['key'];

export const preparedMealsDefaultViewKey: PreparedMealsViewKey = 'list';
