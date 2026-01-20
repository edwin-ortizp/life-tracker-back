export const recipeViews = [
  { key: 'list', label: 'Lista' },
] as const;

export type RecipeViewKey = typeof recipeViews[number]['key'];

export const recipeDefaultViewKey: RecipeViewKey = 'list';
