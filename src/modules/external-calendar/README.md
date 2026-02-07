# External Calendar Integration

This feature allows users to view Google Calendar events directly in Life Tracker's daily calendar view without OAuth authentication.

## How It Works

1. **Public iCal URLs**: Users add Google Calendar public URLs in iCal format
2. **Manual Sync**: Click sync button to fetch latest events
3. **LocalStorage**: Events cached locally (no Firestore sync)
4. **Visual Integration**: Events appear as dashed blocks at z-index 4
5. **Hide/Show**: Click events to hide them locally

## CORS Solution

Google Calendar's public iCal URLs have CORS restrictions that prevent direct browser fetching.

**Current Solution**: CORS Proxy (`https://corsproxy.io`)
- Simple, no backend required
- Third-party service (consider reliability)
- URL is proxied through corsproxy.io

### Alternative Solutions

#### Option 1: Firebase Cloud Functions (Recommended for Production)

Create a serverless function to proxy calendar requests:

```javascript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const fetchCalendar = functions.https.onRequest(async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    res.status(400).send('URL parameter required');
    return;
  }

  try {
    const response = await fetch(url);
    const data = await response.text();

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'text/calendar');
    res.send(data);
  } catch (error) {
    res.status(500).send('Error fetching calendar');
  }
});
```

Then update `icalParser.ts`:
```typescript
const backendProxyUrl = `https://YOUR_PROJECT.cloudfunctions.net/fetchCalendar?url=${encodeURIComponent(url)}`;
```

**Pros:**
- Full control over proxy
- Better reliability
- Can add caching, rate limiting
- No third-party dependencies

**Cons:**
- Requires Firebase Cloud Functions setup
- Additional infrastructure

#### Option 2: Vercel/Netlify Edge Function

Similar to Firebase but using Vercel or Netlify:

```javascript
// api/calendar.js (Vercel)
export default async function handler(req, res) {
  const { url } = req.query;

  const response = await fetch(url);
  const data = await response.text();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/calendar');
  res.send(data);
}
```

#### Option 3: Browser Extension

Create a companion Chrome/Edge extension that can bypass CORS:

```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchCalendar') {
    fetch(request.url)
      .then(res => res.text())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open
  }
});
```

## Files Structure

```
external-calendar/
├── types/
│   └── index.ts              # TypeScript interfaces
├── hooks/
│   └── useExternalCalendars.ts  # Main React hook
├── components/
│   ├── ExternalCalendarEvent.tsx    # Event display
│   ├── AddCalendarDialog.tsx        # Add calendar modal
│   ├── CalendarListItem.tsx         # Calendar list item
│   └── CalendarSyncButton.tsx       # Sync button
├── utils/
│   ├── icalParser.ts         # iCal parsing + CORS proxy
│   ├── storage.ts            # LocalStorage operations
│   └── eventLayoutCalculator.ts  # Positioning logic
└── constants.ts              # Colors and config
```

## Data Storage

All data stored in **localStorage only** (key: `life-tracker-external-calendars`):

```typescript
{
  calendars: ExternalCalendar[],    // Calendar configs
  events: CalendarEvent[],          // Synced events
  hiddenEventIds: string[],         // UIDs of hidden events
  lastGlobalSync?: number           // Last sync timestamp
}
```

## Visual Design

- **Background**: Calendar color at 40% opacity
- **Border**: 2px dashed, calendar color at 100%
- **Z-index**: 4 (between background grid and habits)
- **Non-draggable**: Read-only events

## Usage

### 1. Get Calendar URL
1. Google Calendar → Settings → Your Calendar
2. "Integrate calendar" section
3. Copy "Secret address in iCal format"

### 2. Add to Life Tracker
1. Settings page → "Calendarios Externos"
2. Click "Agregar Calendario"
3. Paste URL, choose name and color
4. Click "Agregar"

### 3. Sync Events
- Click sync button (⟳) in Settings or Calendar view
- Events appear in daily calendar grid
- Click event to hide/show

## Privacy Notes

- **Public URLs**: Anyone with the URL can view events
- **"Busy/Free" Mode**: For work calendars, use Google Calendar's "show only if I'm occupied" setting
- **Local Only**: Events never synced to Firestore
- **No Account Access**: No OAuth, no access to private calendars

## Future Enhancements

- [ ] Multiple calendar color customization
- [ ] Event filtering by keyword
- [ ] Auto-sync interval option
- [ ] Export to .ics file
- [ ] Support for other calendar providers (Outlook, Apple)
- [ ] Backend proxy for better reliability
- [ ] Recurring event support improvements
