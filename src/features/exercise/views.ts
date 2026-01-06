export const exerciseViews = [
  { key: 'daily', label: 'Registro diario' },
  { key: 'calendar', label: 'Calendario' },
] as const;

export type ExerciseViewKey = typeof exerciseViews[number]['key'];

export const exerciseDefaultViewKey: ExerciseViewKey = 'daily';
