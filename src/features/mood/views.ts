export const moodViews = [
  { key: 'tracker', label: 'Registro diario' },
  { key: 'analytics', label: 'Analisis' },
] as const;

export type MoodViewKey = typeof moodViews[number]['key'];

export const moodDefaultViewKey: MoodViewKey = 'tracker';
