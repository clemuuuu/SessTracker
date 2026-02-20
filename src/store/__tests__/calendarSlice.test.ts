import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createCalendarSlice } from '../slices/calendarSlice';


describe('calendarSlice', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let useStore: any;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useStore = create<any>()((...a) => ({
            ...createCalendarSlice(...a)
        }));
    });

    it('should initialize with empty calendarSessions', () => {
        const state = useStore.getState();
        expect(state.calendarSessions).toEqual([]);
    });

    it('should add a session', () => {
        useStore.getState().addSession({
            dayIndex: 0,
            date: '2026-02-20',
            title: 'Test Session',
            startTime: '10:00',
            endTime: '11:00',
            type: 'work',
        });

        const state = useStore.getState();
        expect(state.calendarSessions.length).toBe(1);
        expect(state.calendarSessions[0].title).toBe('Test Session');
    });

    it('should update a session', () => {
        useStore.getState().addSession({
            dayIndex: 0,
            title: 'Old Title',
            startTime: '10:00',
            endTime: '11:00',
            type: 'work',
        });

        const id = useStore.getState().calendarSessions[0].id;
        useStore.getState().updateSession(id, { title: 'New Title' });

        expect(useStore.getState().calendarSessions[0].title).toBe('New Title');
    });

    it('should delete a session', () => {
        useStore.getState().addSession({
            dayIndex: 0,
            title: 'Session to delete',
            startTime: '10:00',
            endTime: '11:00',
            type: 'work',
        });

        const id = useStore.getState().calendarSessions[0].id;
        useStore.getState().deleteSession(id);

        expect(useStore.getState().calendarSessions.length).toBe(0);
    });
});
