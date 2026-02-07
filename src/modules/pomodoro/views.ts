export const pomodoroViews = [
  { key: 'timer', label: 'Timer' },
] as const;

export type PomodoroViewKey = typeof pomodoroViews[number]['key'];

export const pomodoroDefaultViewKey: PomodoroViewKey = 'timer';
