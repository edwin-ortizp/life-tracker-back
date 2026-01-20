export const negativeHabitViews = [
  { key: 'weekly', label: 'Semanal' },
  { key: 'yearly', label: 'Anual' },
] as const;

export type NegativeHabitViewKey = typeof negativeHabitViews[number]['key'];

export const negativeHabitDefaultViewKey: NegativeHabitViewKey = 'weekly';
