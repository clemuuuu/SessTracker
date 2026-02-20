// src/services/googleCalendar.ts

export interface GoogleCalendarEvent {
    id: string;
    summary?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    colorId?: string;
    calendarColorId?: string;
    calendarBackgroundColor?: string;
}

export interface GoogleCalendarListEntry {
    id: string;
    summary: string;
    selected: boolean;
    colorId?: string;
    backgroundColor?: string;
}

export interface LocalSessionData {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    color?: string;
}

export const fetchGoogleEvents = async (accessToken: string, timeMin: Date, timeMax: Date): Promise<{ items: GoogleCalendarEvent[] }> => {
    // 1. Fetch the list of all calendars the user has access to
    const calendarListUrl = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
    const listResponse = await fetch(calendarListUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });

    if (!listResponse.ok) {
        throw new Error('Failed to fetch calendar list');
    }

    const listData = await listResponse.json();
    const calendars = listData.items || [];

    // 2. Fetch events for each calendar
    const allEvents: GoogleCalendarEvent[] = [];

    // Create an array of fetch promises
    const fetchPromises = calendars.filter((cal: GoogleCalendarListEntry) => cal.selected).map(async (calendar: GoogleCalendarListEntry) => {
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`);
        url.searchParams.append('timeMin', timeMin.toISOString());
        url.searchParams.append('timeMax', timeMax.toISOString());
        url.searchParams.append('singleEvents', 'true');
        url.searchParams.append('orderBy', 'startTime');
        url.searchParams.append('fields', 'items(id,summary,start,end,colorId)');

        try {
            const resp = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
            });
            if (resp.ok) {
                const data = await resp.json();
                if (data.items) {
                    // Tag each event with its originating calendar ID if needed, but not strictly required
                    const enrichedItems: GoogleCalendarEvent[] = data.items.map((item: GoogleCalendarEvent) => ({
                        ...item,
                        calendarColorId: calendar.colorId,
                        calendarBackgroundColor: calendar.backgroundColor
                    }));
                    allEvents.push(...enrichedItems);
                }
            }
        } catch (e) {
            console.error(`Failed to fetch events for calendar ${calendar.summary}:`, e);
        }
    });

    // Wait for all calendar events to download
    await Promise.all(fetchPromises);

    return { items: allEvents };
};

// --- PHASE 2: WRITING ---

// Helper: Convert "YYYY-MM-DD" and "HH:MM" into a local RFC3339 string with timezone offset
const toLocalRFC3339 = (dateString: string, timeString: string) => {
    const d = new Date(`${dateString}T${timeString}:00`);
    const tzo = -d.getTimezoneOffset();
    const dif = tzo >= 0 ? '+' : '-';
    const pad = (num: number) => {
        const norm = Math.floor(Math.abs(num));
        return (norm < 10 ? '0' : '') + norm;
    };
    return `${dateString}T${timeString}:00${dif}${pad(tzo / 60)}:${pad(tzo % 60)}`;
};

// Map Forest Scheduler tailwind colors to Google Calendar colorIds
// Google Colors: 1: Lavender, 2: Sage, 3: Grape, 4: Flamingo, 5: Banana, 6: Tangerine, 7: Peacock, 8: Graphite, 9: Blueberry, 10: Basil, 11: Tomato
export const mapLocalColorToGoogle = (localColor: string): string | undefined => {
    switch (localColor) {
        case 'bg-amber-500': return '6'; // Tangerine
        case 'bg-cyan-500': return '7'; // Peacock
        case 'bg-emerald-500': return '10'; // Basil
        case 'bg-rose-500': return '11'; // Tomato
        case 'bg-violet-500': return '3'; // Grape
        case 'bg-indigo-500': return '9'; // Blueberry
        default: return undefined; // Default calendar color
    }
};

export const mapGoogleColorToLocal = (googleColorId?: string, calendarColorId?: string): string => {
    // 1. Explicit Event Colors (1-11)
    if (googleColorId) {
        switch (googleColorId) {
            case '6': return 'bg-amber-500';
            case '7': return 'bg-cyan-500';
            case '10': return 'bg-emerald-500';
            case '11': return 'bg-rose-500';
            case '3': return 'bg-violet-500';
            case '9': return 'bg-indigo-500';
            case '4': return 'bg-rose-500'; // Flamingo -> Rose
            case '5': return 'bg-amber-500'; // Banana -> Amber
            case '2': return 'bg-emerald-500'; // Sage -> Emerald
            case '1': return 'bg-violet-500'; // Lavender -> Violet
            case '8': return 'bg-cyan-500'; // Graphite -> Slate (cyan for now as slate isn't in options)
            default: return 'bg-cyan-500'; // Default if unknown
        }
    }

    // 2. Calendar Default Colors (1-24)
    if (calendarColorId) {
        switch (calendarColorId) {
            case '1': case '2': case '3': case '4': case '21': case '22': return 'bg-rose-500'; // Reds/Pinks
            case '5': case '6': case '11': case '12': return 'bg-amber-500'; // Oranges/Yellows
            case '7': case '8': case '9': case '10': case '13': return 'bg-emerald-500'; // Greens
            case '14': case '15': case '16': return 'bg-cyan-500'; // Blues
            case '17': case '18': case '23': case '24': return 'bg-violet-500'; // Purples
            case '19': case '20': return 'bg-slate-500'; // Grays
            default: return 'bg-cyan-500';
        }
    }

    return 'bg-cyan-500'; // Ultimate fallback
};

export const createGoogleEvent = async (accessToken: string, sessionData: LocalSessionData) => {
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    const eventBody: any = {
        summary: sessionData.title,
        start: {
            dateTime: toLocalRFC3339(sessionData.date!, sessionData.startTime),
        },
        end: {
            dateTime: toLocalRFC3339(sessionData.date!, sessionData.endTime),
        },
    };

    const googleColorId = mapLocalColorToGoogle(sessionData.color);
    if (googleColorId) {
        eventBody.colorId = googleColorId;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(eventBody),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to create event on Google Calendar: ${errText}`);
    }

    return response.json();
};

export const updateGoogleEvent = async (accessToken: string, eventId: string, sessionData: LocalSessionData) => {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId || '')}`;

    const eventBody: any = {
        summary: sessionData.title,
        start: {
            dateTime: toLocalRFC3339(sessionData.date, sessionData.startTime),
        },
        end: {
            dateTime: toLocalRFC3339(sessionData.date, sessionData.endTime),
        },
    };

    const googleColorId = mapLocalColorToGoogle(sessionData.color);
    if (googleColorId) {
        eventBody.colorId = googleColorId;
    }

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(eventBody),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update event on Google Calendar: ${errText}`);
    }

    return response.json();
};

export const deleteGoogleEvent = async (accessToken: string, eventId: string) => {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId || '')}`;

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok && response.status !== 410) { // 410 is "Gone" (already deleted)
        throw new Error('Failed to delete event from Google Calendar');
    }

    return true;
};
