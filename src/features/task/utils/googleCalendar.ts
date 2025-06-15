export const GOOGLE_API_BASE = 'https://www.googleapis.com/calendar/v3';

export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  htmlLink?: string;
}

export const listCalendarEvents = async (
  accessToken: string,
  calendarId = 'primary'
): Promise<CalendarEvent[]> => {
  const res = await fetch(
    `${GOOGLE_API_BASE}/calendars/${calendarId}/events`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
  return data.items as CalendarEvent[];
};

export const createEventFromTask = async (
  task: { title: string; description?: string; dueDate?: Date },
  accessToken: string,
  calendarId = 'primary'
): Promise<CalendarEvent> => {
  const body: any = {
    summary: task.title,
    description: task.description || ''
  };
  if (task.dueDate) {
    const end = new Date(task.dueDate.getTime() + 60 * 60 * 1000);
    body.start = { dateTime: task.dueDate.toISOString() };
    body.end = { dateTime: end.toISOString() };
  }
  const res = await fetch(
    `${GOOGLE_API_BASE}/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) throw new Error('Failed to create event');
  return (await res.json()) as CalendarEvent;
};
