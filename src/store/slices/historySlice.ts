import type { StateCreator } from 'zustand';
import type { RevisionState, HistorySlice } from './types';

export const createHistorySlice: StateCreator<RevisionState, [], [], HistorySlice> = (set, get) => ({
    history: [],
    historyIndex: 0,

    pushHistory: (state) => {
        const entry = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
        };
        // Truncate future
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(entry);
        if (newHistory.length > 50) newHistory.shift();

        return {
            history: newHistory,
            historyIndex: newHistory.length - 1
        };
    },

    undo: () => {
        const state = get();
        if (state.historyIndex <= 0) return;

        const newIndex = state.historyIndex - 1;
        const entry = state.history[newIndex];

        set({
            nodes: JSON.parse(JSON.stringify(entry.nodes)),
            edges: JSON.parse(JSON.stringify(entry.edges)),
            historyIndex: newIndex,
            activeNodeId: null,
            activeAncestorIds: [],
            lastTick: null,
        });
    },

    redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;

        const newIndex = state.historyIndex + 1;
        const entry = state.history[newIndex];

        set({
            nodes: JSON.parse(JSON.stringify(entry.nodes)),
            edges: JSON.parse(JSON.stringify(entry.edges)),
            historyIndex: newIndex,
            activeNodeId: null,
            activeAncestorIds: [],
            lastTick: null,
        });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,
});
