export const waterViews = [
  { key: 'daily', label: 'Registro diario' },
  { key: 'calendar', label: 'Calendario' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'range', label: 'Rango' },
] as const;

export type WaterViewKey = typeof waterViews[number]['key'];

export const waterDefaultViewKey: WaterViewKey = 'daily';
