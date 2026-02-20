import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createUiSlice } from '../slices/uiSlice';


describe('uiSlice', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let useStore: any;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useStore = create<any>()((...a) => ({
            ...createUiSlice(...a)
        }));
    });

    it('should initialize with default values', () => {
        const state = useStore.getState();
        expect(state.windows).toEqual({});
        expect(state.activeWindowId).toBeNull();
        expect(state.scrollTarget).toBeNull();
        expect(state.maxZIndex).toBe(10);
    });

    it('should register a window', () => {
        useStore.getState().registerWindow('test-win', { x: 0, y: 0, w: 100, h: 100 });
        const state = useStore.getState();

        expect(state.windows['test-win']).toBeDefined();
        expect(state.windows['test-win'].id).toBe('test-win');
        expect(state.windows['test-win'].x).toBe(0);
        expect(state.activeWindowId).toBe('test-win');
        expect(state.maxZIndex).toBe(11);
    });

    it('should update and focus a window', () => {
        useStore.getState().registerWindow('win-1', { x: 0, y: 0, w: 100, h: 100 });
        useStore.getState().registerWindow('win-2', { x: 0, y: 0, w: 100, h: 100 });

        useStore.getState().updateWindow('win-1', { x: 50 });
        expect(useStore.getState().windows['win-1'].x).toBe(50);

        useStore.getState().focusWindow('win-1');
        expect(useStore.getState().activeWindowId).toBe('win-1');
        expect(useStore.getState().windows['win-1'].zIndex).toBe(13); // 10 -> 11 -> 12 -> 13
    });

    it('should set scroll target', () => {
        useStore.getState().scrollToArea('calendar');
        expect(useStore.getState().scrollTarget).toBe('calendar');
    });
});
