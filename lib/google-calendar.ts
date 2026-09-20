import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google Calendar: не настроены переменные окружения');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
}

function getCalendar() {
  const auth = getAuth();
  return google.calendar({ version: 'v3', auth });
}

function getCalendarId() {
  const id = process.env.GOOGLE_CALENDAR_ID;
  if (!id) throw new Error('Google Calendar: не указан GOOGLE_CALENDAR_ID');
  return id;
}

export type EventData = {
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  location?: string;
};

export async function createCalendarEvent(data: EventData) {
  const calendar = getCalendar();

  try {
    const res = await calendar.events.insert({
      calendarId: getCalendarId(),
      requestBody: {
        summary: data.title,
        description: data.description || '',
        location: data.location || '',
        start: {
          dateTime: data.startAt.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        end: {
          dateTime: data.endAt.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    });

    return res.data.id || null;
  } catch (e: any) {
    console.error('[google-calendar] create error:', e.message);
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  data: EventData
) {
  const calendar = getCalendar();

  try {
    await calendar.events.update({
      calendarId: getCalendarId(),
      eventId,
      requestBody: {
        summary: data.title,
        description: data.description || '',
        location: data.location || '',
        start: {
          dateTime: data.startAt.toISOString(),
          timeZone: 'Europe/Moscow',
        },
        end: {
          dateTime: data.endAt.toISOString(),
          timeZone: 'Europe/Moscow',
        },
      },
    });
    return true;
  } catch (e: any) {
    console.error('[google-calendar] update error:', e.message);
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = getCalendar();

  try {
    await calendar.events.delete({
      calendarId: getCalendarId(),
      eventId,
    });
    return true;
  } catch (e: any) {
    console.error('[google-calendar] delete error:', e.message);
    return false;
  }
}