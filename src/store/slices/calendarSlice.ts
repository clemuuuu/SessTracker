import type { StateCreator } from 'zustand';
import type { RevisionState, CalendarSlice } from './types';
import { v4 as uuidv4 } from 'uuid';
import { mapGoogleColorToLocal } from '../../services/googleCalendar';
import type { GoogleCalendarEvent } from '../../services/googleCalendar';

export const createCalendarSlice: StateCreator<RevisionState, [], [], CalendarSlice> = (set) => ({
    calendarSessions: [],
    pendingGoogleDeletions: [],
    googleAccessToken: null,
    setGoogleAccessToken: (token) => set({ googleAccessToken: token }),
    addSession: (sessionData) => set((state) => ({
        calendarSessions: [
            ...state.calendarSessions,
            { ...sessionData, id: uuidv4() }
        ]
    })),
    updateSession: (id, updates) => set((state) => ({
        calendarSessions: state.calendarSessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
        )
    })),
    deleteSession: (id) => set((state) => ({
        calendarSessions: state.calendarSessions.filter((s) => s.id !== id)
    })),
    addPendingDeletion: (googleEventId) => set((state) => ({
        pendingGoogleDeletions: [...state.pendingGoogleDeletions, googleEventId]
    })),
    clearPendingDeletion: (googleEventId) => set((state) => ({
        pendingGoogleDeletions: state.pendingGoogleDeletions.filter(id => id !== googleEventId)
    })),
    syncGoogleEvents: (googleEvents: GoogleCalendarEvent[]) => set((state) => {
        const newSessions = [...state.calendarSessions];

        googleEvents.forEach((gEvent: GoogleCalendarEvent) => {
            // Find if we already have this event by googleEventId
            const existingIndex = newSessions.findIndex(s => s.googleEventId === gEvent.id);

            // Parse start/end times (Google events usually have dateTime in RFC3339)
            if (!gEvent.start?.dateTime || !gEvent.end?.dateTime) {
                return; // Skip all-day events for now
            }

            const startDate = new Date(gEvent.start.dateTime);
            const endDate = new Date(gEvent.end.dateTime);

            const y = startDate.getFullYear();
            const m = String(startDate.getMonth() + 1).padStart(2, '0');
            const d = String(startDate.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            // Format HH:MM
            const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
            const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

            const color = mapGoogleColorToLocal(gEvent.colorId, gEvent.calendarColorId);

            const sessionData = {
                dayIndex: startDate.getDay() === 0 ? 6 : startDate.getDay() - 1,
                date: dateStr,
                title: gEvent.summary || 'Google Event',
                startTime,
                endTime,
                color,
                type: 'other' as const,
                googleEventId: gEvent.id
            };

            if (existingIndex >= 0) {
                // Update
                newSessions[existingIndex] = { ...newSessions[existingIndex], ...sessionData };
            } else {
                // Add
                newSessions.push({ ...sessionData, id: uuidv4() });
            }
        });

        // Remove local sessions that were synced from Google but no longer exist in the fetched list
        // Also do not remove purely local sessions, OR sessions that are awaiting sync `needsGoogleSync`!
        const fetchedGoogleIds = new Set(googleEvents.map(e => e.id));
        const filteredSessions = newSessions.filter(session => {
            if (session.googleEventId && !session.needsGoogleSync) {
                return fetchedGoogleIds.has(session.googleEventId);
            }
            return true; // Keep purely local sessions or offline dirty sessions
        });

        return { calendarSessions: filteredSessions };
    }),
});
