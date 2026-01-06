export const taskViews = [
  { key: 'list', label: 'Lista' },
  { key: 'kanban', label: 'Kanban' },
  { key: 'calendar', label: 'Calendario' },
  { key: 'analytics', label: 'Analisis' },
] as const;

export type TaskViewKey = typeof taskViews[number]['key'];

export const taskDefaultViewKey: TaskViewKey = 'list';
