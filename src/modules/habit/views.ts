export const habitViews = [
  { key: 'tracker', label: 'Registro diario' },
  { key: 'analytics', label: 'Analisis' },
] as const;

export type HabitViewKey = typeof habitViews[number]['key'];

export const habitDefaultViewKey: HabitViewKey = 'tracker';
