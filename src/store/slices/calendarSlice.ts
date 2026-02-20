import type { StateCreator } from 'zustand';
import type { RevisionState, CalendarSlice, CalendarSession } from './types';
import { v4 as uuidv4 } from 'uuid';

export const createCalendarSlice: StateCreator<RevisionState, [], [], CalendarSlice> = (set) => ({
    sessions: [
        // Mock data initial pour ne pas avoir un calendrier vide au premier chargement
        { id: 'mock-1', dayIndex: 2, title: 'Math - Algèbre', startTime: '10:00', endTime: '11:30', type: 'work', color: 'bg-amber-500' },
        { id: 'mock-2', dayIndex: 2, title: 'Physique', startTime: '14:00', endTime: '16:00', type: 'work', color: 'bg-cyan-500' },
        { id: 'mock-3', dayIndex: 4, title: 'Anglais', startTime: '11:00', endTime: '12:00', type: 'work', color: 'bg-emerald-500' },
    ],
    addSession: (sessionData) => set((state) => ({
        sessions: [
            ...state.sessions,
            { ...sessionData, id: uuidv4() }
        ]
    })),
    updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
        )
    })),
    deleteSession: (id) => set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id)
    })),
});
