export const journalViews = [
  { key: 'entries', label: 'Entradas' },
  { key: 'life-calendar', label: 'Life Calendar' },
] as const;

export type JournalViewKey = typeof journalViews[number]['key'];

export const journalDefaultViewKey: JournalViewKey = 'entries';
