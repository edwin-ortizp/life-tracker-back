export const journalViews = [
  { key: 'entries', label: 'Entradas' },
] as const;

export type JournalViewKey = typeof journalViews[number]['key'];

export const journalDefaultViewKey: JournalViewKey = 'entries';
