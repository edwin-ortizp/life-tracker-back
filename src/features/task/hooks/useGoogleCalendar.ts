import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Task, TaskFormData } from '../types';
import { listCalendarEvents, createEventFromTask } from '../utils/googleCalendar';

export const useGoogleCalendar = () => {
  const { user, googleToken } = useAuth();

  const exportTask = async (task: Task) => {
    if (!googleToken) throw new Error('No Google token');
    const event = await createEventFromTask(task, googleToken);
    await updateDoc(doc(db, 'tasks', task.id), { calendarEventId: event.id });
    return event;
  };

  const importEvents = async (existing: Task[]): Promise<TaskFormData[]> => {
    if (!googleToken) throw new Error('No Google token');
    const events = await listCalendarEvents(googleToken);
    const existingIds = existing.map(t => t.calendarEventId).filter(Boolean);
    return events
      .filter(e => e.id && !existingIds.includes(e.id))
      .map(e => ({
        title: e.summary || 'Evento',
        description: e.description || '',
        dueDate: e.start?.dateTime ? new Date(e.start.dateTime) : e.start?.date ? new Date(e.start.date) : undefined,
        category: 'personal',
        calendarEventId: e.id
      }));
  };

  const linkTask = async (taskId: string, eventId: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'tasks', taskId), { calendarEventId: eventId });
  };

  return { exportTask, importEvents, linkTask };
};
