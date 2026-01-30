import { addWeeks, getISOWeek, getISOWeekYear, startOfISOWeek } from 'date-fns';

export const getIsoWeekId = (date: Date): string => {
  const isoYear = getISOWeekYear(date);
  const isoWeek = getISOWeek(date);
  const weekLabel = String(isoWeek).padStart(2, '0');
  return `${isoYear}-W${weekLabel}`;
};

export const getStartOfIsoWeek = (isoYear: number, isoWeek: number): Date => {
  const jan4 = new Date(isoYear, 0, 4);
  const yearStartWeek = startOfISOWeek(jan4);
  return addWeeks(yearStartWeek, Math.max(0, isoWeek - 1));
};
