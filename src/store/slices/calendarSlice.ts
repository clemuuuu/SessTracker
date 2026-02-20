import type { StateCreator } from 'zustand';
import type { RevisionState, CalendarSlice } from './types';
import { v4 as uuidv4 } from 'uuid';

export const createCalendarSlice: StateCreator<RevisionState, [], [], CalendarSlice> = (set) => ({
    calendarSessions: [],
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
});
