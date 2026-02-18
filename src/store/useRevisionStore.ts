import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RevisionState } from './slices/types';
import { createNodeSlice } from './slices/nodeSlice';
import { createTimerSlice } from './slices/timerSlice';
import { createHistorySlice } from './slices/historySlice';
import { createTodoSlice } from './slices/todoSlice';
import { createUiSlice } from './slices/uiSlice';

export const useRevisionStore = create<RevisionState>()(
    persist(
        (...a) => ({
            ...createNodeSlice(...a),
            ...createTimerSlice(...a),
            ...createHistorySlice(...a),
            ...createTodoSlice(...a),
            ...createUiSlice(...a),
        }),
        {
            name: 'revision-tracker-storage',
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                activeNodeId: state.activeNodeId,
                activeAncestorIds: state.activeAncestorIds,
                lastTick: state.lastTick,
                todos: state.todos,
                // We persist windows to keep layout, excluding activeWindowId and maxZIndex to reset focus order slightly or keep it. 
                // Let's persist windows.
                windows: state.windows,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Migration: Ensure todos array exists
                    if (!Array.isArray(state.todos)) {
                        state.todos = [];
                    }

                    // Ensure windows object exists
                    if (!state.windows) {
                        state.windows = {};
                    }

                    // Migration: Ensure all nodes have valid sessions array
                    if (state.nodes) {
                        state.nodes = state.nodes.map(node => ({
                            ...node,
                            data: {
                                ...node.data,
                                sessions: Array.isArray(node.data.sessions) ? node.data.sessions : []
                            }
                        }));
                    }
                }
            }
        }
    )
);
