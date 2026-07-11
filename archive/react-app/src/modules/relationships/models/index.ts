export const RELATIONSHIP_CATEGORIES = {
  FAMILY: 'familia',
  FRIENDSHIP: 'amistad',
  SOCIAL: 'social'
} as const;

export type RelationshipCategory = typeof RELATIONSHIP_CATEGORIES[keyof typeof RELATIONSHIP_CATEGORIES];

export const RELATIONSHIP_CATEGORY_LABELS: Record<RelationshipCategory, string> = {
  familia: 'Familia',
  amistad: 'Amistad',
  social: 'Social'
};

export const RELATIONSHIP_EVENT_TYPES = {
  BIRTHDAY: 'birthday',
  EXAM: 'exam',
  SURGERY: 'surgery',
  TRAVEL: 'travel',
  GRIEF: 'grief',
  MEDICAL_CHECK: 'medical_check',
  CUSTOM: 'custom'
} as const;

export type RelationshipEventType = typeof RELATIONSHIP_EVENT_TYPES[keyof typeof RELATIONSHIP_EVENT_TYPES];

export const RELATIONSHIP_EVENT_TYPE_LABELS: Record<RelationshipEventType, string> = {
  birthday: 'Cumpleaños',
  exam: 'Examen',
  surgery: 'Cirugía',
  travel: 'Viaje',
  grief: 'Duelo',
  medical_check: 'Chequeo médico',
  custom: 'Personalizado'
};

export type RelationshipNoteEntry = {
  timestamp: string;
  text: string;
};

export interface Circle {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  contactFrequencyDays?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipPerson {
  id: string;
  userId: string;
  circleId: string;
  fullName: string;
  nickname?: string;
  category: RelationshipCategory;
  birthdayDate?: string;
  birthdayMonth?: number;
  birthdayDay?: number;
  lastContactAt?: string;
  nextContactSuggestedAt?: string;
  notes: RelationshipNoteEntry[];
  isArchived: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipEvent {
  id: string;
  userId: string;
  relationshipId: string;
  title: string;
  eventType: RelationshipEventType;
  eventDate: string;
  startDate?: string;
  endDate?: string;
  isArchived: boolean;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipTaskLink {
  id: string;
  userId: string;
  relationshipId: string;
  taskId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelatedTask {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  isPrivate: boolean;
  category?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipCreateInput {
  circleId: string;
  fullName: string;
  nickname?: string;
  category: RelationshipCategory;
  birthdayDate?: string;
  birthdayMonth?: number;
  birthdayDay?: number;
  lastContactAt?: string;
  nextContactSuggestedAt?: string;
}

export interface RelationshipTaskCreateInput {
  title: string;
  category?: string;
  isPrivate?: boolean;
}

export interface RelationshipNoteWithContactUpdateInput {
  text: string;
  timestamp?: string;
  lastContactAt?: string;
  nextContactSuggestedAt?: string;
}

export interface RelationshipNoteUpdateInput {
  noteIndex: number;
  text: string;
  timestamp: string;
}

export type RelationshipUrgency = 'overdue' | 'due_soon' | 'upcoming' | 'unscheduled';

export const RELATIONSHIPS_FILTER_KEYS = {
  OVERDUE: 'overdue',
  EVENTS_WEEK: 'events_week',
  NO_NEXT_CONTACT: 'no_next_contact'
} as const;

export type RelationshipsFilterKey = typeof RELATIONSHIPS_FILTER_KEYS[keyof typeof RELATIONSHIPS_FILTER_KEYS];
