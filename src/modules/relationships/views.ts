// Legacy view registry kept for backward compatibility.
export const relationshipsViews = [
  { key: 'board', label: 'Personas' }
] as const;

export type RelationshipsViewKey = typeof relationshipsViews[number]['key'];

export const relationshipsDefaultViewKey: RelationshipsViewKey = 'board';
