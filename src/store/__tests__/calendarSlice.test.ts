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

    it('should manage pendingGoogleDeletions queue', () => {
        expect(useStore.getState().pendingGoogleDeletions).toEqual([]);

        useStore.getState().addPendingDeletion('google_idx_123');
        expect(useStore.getState().pendingGoogleDeletions).toEqual(['google_idx_123']);

        useStore.getState().clearPendingDeletion('google_idx_123');
        expect(useStore.getState().pendingGoogleDeletions).toEqual([]);
    });

    it('should preserve sessions with needsGoogleSync during syncGoogleEvents', () => {
        useStore.getState().addSession({
            dayIndex: 0,
            date: '2026-02-20',
            title: 'Offline Edited Session',
            startTime: '10:00',
            endTime: '11:00',
            type: 'work',
            googleEventId: 'offline_id_1',
            needsGoogleSync: true
        });

        // Simulate a Google API sync where 'offline_id_1' is NOT returned (e.g deleted on server or just a generic sync)
        useStore.getState().syncGoogleEvents([]);

        // It should NOT be purged because needsGoogleSync is true
        const state = useStore.getState();
        expect(state.calendarSessions.length).toBe(1);
        expect(state.calendarSessions[0].title).toBe('Offline Edited Session');
    });

    it('should purge synced sessions that are missing from Google API if needsGoogleSync is false', () => {
        useStore.getState().addSession({
            dayIndex: 0,
            date: '2026-02-20',
            title: 'Previously Synced Session',
            startTime: '10:00',
            endTime: '11:00',
            type: 'work',
            googleEventId: 'synced_id_2', // No needsGoogleSync flag
        });

        // Simulate a Google API sync where 'synced_id_2' is NOT returned because it was deleted on Google
        useStore.getState().syncGoogleEvents([]);

        // It SHOULD be purged
        const state = useStore.getState();
        expect(state.calendarSessions.length).toBe(0);
    });

    it('should add a new session from a Google event via syncGoogleEvents', () => {
        useStore.getState().syncGoogleEvents([{
            id: 'g_new_1',
            summary: 'Meeting from Google',
            start: { dateTime: '2026-02-20T14:00:00+01:00' },
            end: { dateTime: '2026-02-20T15:30:00+01:00' },
            colorId: '6',
        }]);

        const state = useStore.getState();
        expect(state.calendarSessions.length).toBe(1);
        expect(state.calendarSessions[0].title).toBe('Meeting from Google');
        expect(state.calendarSessions[0].googleEventId).toBe('g_new_1');
        expect(state.calendarSessions[0].startTime).toBe('14:00');
        expect(state.calendarSessions[0].endTime).toBe('15:30');
        expect(state.calendarSessions[0].id).toBeDefined();
    });

    it('should update an existing local session when Google returns matching event', () => {
        // Pre-populate with a synced session
        useStore.getState().addSession({
            dayIndex: 0,
            date: '2026-02-20',
            title: 'Old Title',
            startTime: '10:00',
            endTime: '11:00',
            type: 'work',
            googleEventId: 'g_existing_1',
        });

        const originalId = useStore.getState().calendarSessions[0].id;

        // Google returns updated data for the same event
        useStore.getState().syncGoogleEvents([{
            id: 'g_existing_1',
            summary: 'Updated from Google',
            start: { dateTime: '2026-02-20T09:00:00+01:00' },
            end: { dateTime: '2026-02-20T12:00:00+01:00' },
        }]);

        const state = useStore.getState();
        expect(state.calendarSessions.length).toBe(1);
        expect(state.calendarSessions[0].title).toBe('Updated from Google');
        expect(state.calendarSessions[0].startTime).toBe('09:00');
        expect(state.calendarSessions[0].endTime).toBe('12:00');
        // Local ID should be preserved
        expect(state.calendarSessions[0].id).toBe(originalId);
    });

    it('should skip all-day events (no dateTime) in syncGoogleEvents', () => {
        useStore.getState().syncGoogleEvents([{
            id: 'g_allday_1',
            summary: 'All Day Event',
            start: { date: '2026-02-20' },
            end: { date: '2026-02-21' },
        }]);

        expect(useStore.getState().calendarSessions.length).toBe(0);
    });

    it('should keep purely local sessions (no googleEventId) during syncGoogleEvents', () => {
        useStore.getState().addSession({
            dayIndex: 0,
            date: '2026-02-20',
            title: 'My Local Session',
            startTime: '08:00',
            endTime: '09:00',
            type: 'work',
            // No googleEventId
        });

        // Sync with unrelated Google events
        useStore.getState().syncGoogleEvents([{
            id: 'g_unrelated',
            summary: 'Google Only',
            start: { dateTime: '2026-02-20T16:00:00+01:00' },
            end: { dateTime: '2026-02-20T17:00:00+01:00' },
        }]);

        const state = useStore.getState();
        expect(state.calendarSessions.length).toBe(2);
        expect(state.calendarSessions.find((s: any) => s.title === 'My Local Session')).toBeDefined();
        expect(state.calendarSessions.find((s: any) => s.title === 'Google Only')).toBeDefined();
    });

    it('should default title to "Google Event" when summary is missing', () => {
        useStore.getState().syncGoogleEvents([{
            id: 'g_no_title',
            start: { dateTime: '2026-02-20T10:00:00+01:00' },
            end: { dateTime: '2026-02-20T11:00:00+01:00' },
        }]);

        expect(useStore.getState().calendarSessions[0].title).toBe('Google Event');
    });

    it('should set and clear googleAccessToken', () => {
        expect(useStore.getState().googleAccessToken).toBeNull();

        useStore.getState().setGoogleAccessToken('ya29.test-token');
        expect(useStore.getState().googleAccessToken).toBe('ya29.test-token');

        useStore.getState().setGoogleAccessToken(null);
        expect(useStore.getState().googleAccessToken).toBeNull();
    });
});
