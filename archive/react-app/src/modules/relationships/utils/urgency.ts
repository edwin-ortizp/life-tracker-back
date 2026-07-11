import type { RelationshipEvent, RelationshipPerson, RelationshipUrgency } from '@/modules/relationships/models';

export const startOfLocalDay = (input: Date) => new Date(input.getFullYear(), input.getMonth(), input.getDate());
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const parseIsoLikeDate = (isoLike: string) => {
  if (DATE_ONLY_REGEX.test(isoLike)) {
    const [year, month, day] = isoLike.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(isoLike);
};

export const getDaysFromToday = (isoLike?: string) => {
  if (!isoLike) return null;
  const target = startOfLocalDay(parseIsoLikeDate(isoLike));
  const today = startOfLocalDay(new Date());
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
};

export const getRelationshipUrgency = (nextContactIso?: string): RelationshipUrgency => {
  const days = getDaysFromToday(nextContactIso);

  if (days === null) return 'unscheduled';
  if (days < 0) return 'overdue';
  if (days <= 2) return 'due_soon';
  return 'upcoming';
};

export const hasUpcomingEventInDays = (events: RelationshipEvent[], daysAhead = 7) => {
  if (events.length === 0) return false;

  const today = startOfLocalDay(new Date());
  const limit = new Date(today);
  limit.setDate(limit.getDate() + daysAhead);

  return events.some((event) => {
    if (event.isArchived) return false;
    const eventDate = startOfLocalDay(parseIsoLikeDate(event.eventDate));
    return eventDate.getTime() >= today.getTime() && eventDate.getTime() <= limit.getTime();
  });
};

export const isOverdueRelationship = (person: RelationshipPerson) => {
  return getRelationshipUrgency(person.nextContactSuggestedAt) === 'overdue';
};
