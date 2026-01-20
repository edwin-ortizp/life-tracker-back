export const shoppingListViews = [
  { key: 'list', label: 'Lista' },
  { key: 'kanban', label: 'Kanban' },
] as const;

export type ShoppingListViewKey = typeof shoppingListViews[number]['key'];

export const shoppingListDefaultViewKey: ShoppingListViewKey = 'list';
