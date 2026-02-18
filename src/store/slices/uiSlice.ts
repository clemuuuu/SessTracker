import type { StateCreator } from 'zustand';
import type { RevisionState, UiSlice, WindowState } from './types';

export const createUiSlice: StateCreator<RevisionState, [], [], UiSlice> = (set, get) => ({
    windows: {},
    activeWindowId: null,
    maxZIndex: 10,

    registerWindow: (id, config) => {
        const state = get();
        if (state.windows[id]) return; // Already registered

        set((prev) => ({
            windows: {
                ...prev.windows,
                [id]: {
                    id,
                    ...config,
                    zIndex: prev.maxZIndex + 1,
                    isSnapped: 'float',
                    opacity: 0.9,
                },
            },
            maxZIndex: prev.maxZIndex + 1,
            activeWindowId: id,
        }));
    },

    updateWindow: (id, updates) => {
        set((state) => ({
            windows: {
                ...state.windows,
                [id]: { ...state.windows[id], ...updates },
            },
        }));
    },

    focusWindow: (id) => {
        set((state) => {
            if (state.activeWindowId === id) return state;
            const newZIndex = state.maxZIndex + 1;
            return {
                windows: {
                    ...state.windows,
                    [id]: { ...state.windows[id], zIndex: newZIndex },
                },
                activeWindowId: id,
                maxZIndex: newZIndex,
            };
        });
    },

    snapWindow: (id, input) => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const state = get().windows[id];
        if (!state) return;

        let nextSnap = state.isSnapped;

        // State Machine for Snapping
        switch (state.isSnapped) {
            case 'float':
                if (input === 'left') nextSnap = 'left';
                if (input === 'right') nextSnap = 'right';
                if (input === 'up') nextSnap = 'top'; // or maximize? User said "control haut plaque en haut" so Top Half.
                if (input === 'down') nextSnap = 'bottom'; // or minimize? User said "plaque en bas".
                break;

            case 'left':
                if (input === 'right') nextSnap = 'float'; // Unsnap
                if (input === 'up') nextSnap = 'top-left';
                if (input === 'down') nextSnap = 'bottom-left';
                break;

            case 'right':
                if (input === 'left') nextSnap = 'float';
                if (input === 'up') nextSnap = 'top-right';
                if (input === 'down') nextSnap = 'bottom-right';
                break;

            case 'top':
                if (input === 'down') nextSnap = 'float';
                if (input === 'left') nextSnap = 'top-left';
                if (input === 'right') nextSnap = 'top-right';
                break;

            case 'bottom':
                if (input === 'up') nextSnap = 'float';
                if (input === 'left') nextSnap = 'bottom-left';
                if (input === 'right') nextSnap = 'bottom-right';
                break;

            case 'top-left':
                if (input === 'right') nextSnap = 'top'; // Slide to top center
                if (input === 'down') nextSnap = 'left'; // Slide to left center
                break;

            case 'top-right':
                if (input === 'left') nextSnap = 'top';
                if (input === 'down') nextSnap = 'right';
                break;

            case 'bottom-left':
                if (input === 'right') nextSnap = 'bottom';
                if (input === 'up') nextSnap = 'left';
                break;

            case 'bottom-right':
                if (input === 'left') nextSnap = 'bottom';
                if (input === 'up') nextSnap = 'right';
                break;

            case 'maximize':
                if (input === 'down') nextSnap = 'float';
                break;
        }

        // Apply Geometry
        let newConfig: Partial<WindowState> = { isSnapped: nextSnap };

        const halfW = screenW / 2;
        const halfH = screenH / 2;

        switch (nextSnap) {
            case 'maximize':
                newConfig = { x: 0, y: 0, w: screenW, h: screenH };
                break;
            case 'float':
                // Reset to center
                newConfig = { x: screenW / 4, y: screenH / 4, w: halfW, h: halfH };
                break;
            case 'left':
                newConfig = { x: 0, y: 0, w: halfW, h: screenH };
                break;
            case 'right':
                newConfig = { x: halfW, y: 0, w: halfW, h: screenH };
                break;
            case 'top':
                newConfig = { x: 0, y: 0, w: screenW, h: halfH };
                break;
            case 'bottom':
                newConfig = { x: 0, y: halfH, w: screenW, h: halfH };
                break;
            case 'top-left':
                newConfig = { x: 0, y: 0, w: halfW, h: halfH };
                break;
            case 'top-right':
                newConfig = { x: halfW, y: 0, w: halfW, h: halfH };
                break;
            case 'bottom-left':
                newConfig = { x: 0, y: halfH, w: halfW, h: halfH };
                break;
            case 'bottom-right':
                newConfig = { x: halfW, y: halfH, w: halfW, h: halfH };
                break;
        }

        newConfig.isSnapped = nextSnap;
        get().updateWindow(id, newConfig);
        get().focusWindow(id);
    },
});
