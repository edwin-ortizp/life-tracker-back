// Utility functions for Google Calendar integration
import type { Task } from '@/features/task/types';

const SCOPES = 'https://www.googleapis.com/auth/calendar';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

let gapiLoaded = false;

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if ((window as any).gapi) {
      return resolve();
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load gapi'));
    document.body.appendChild(script);
  });
}

export async function initGoogleClient(apiKey: string, clientId: string) {
  await loadScript();
  const gapi = (window as any).gapi;
  return new Promise<void>((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client
        .init({
          apiKey,
          clientId,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPES
        })
        .then(
          () => {
            gapiLoaded = true;
            resolve();
          },
          (err: any) => reject(err)
        );
    });
  });
}

function getGapi() {
  if (!gapiLoaded) throw new Error('gapi not initialized');
  return (window as any).gapi;
}

export function signInCalendar() {
  return getGapi().auth2.getAuthInstance().signIn();
}

export function signOutCalendar() {
  return getGapi().auth2.getAuthInstance().signOut();
}

export async function createEventFromTask(task: Task) {
  const gapi = getGapi();
  const event: any = {
    summary: task.title,
    description: task.description
  };
  if (task.dueDate) {
    const iso = task.dueDate.toISOString();
    event.start = { dateTime: iso };
    event.end = { dateTime: iso };
  }
  const res = await gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });
  return res.result;
}

export async function listEvents() {
  const gapi = getGapi();
  const res = await gapi.client.calendar.events.list({
    calendarId: 'primary',
    showDeleted: false,
    singleEvents: true,
    maxResults: 2500,
    orderBy: 'startTime'
  });
  return res.result.items;
}
