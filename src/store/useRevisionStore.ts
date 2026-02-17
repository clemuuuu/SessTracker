import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RevisionState } from './slices/types';
import { createNodeSlice } from './slices/nodeSlice';
import { createTimerSlice } from './slices/timerSlice';
import { createHistorySlice } from './slices/historySlice';

export const useRevisionStore = create<RevisionState>()(
    persist(
        (...a) => ({
            ...createNodeSlice(...a),
            ...createTimerSlice(...a),
            ...createHistorySlice(...a),
        }),
        {
            name: 'revision-tracker-storage',
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                activeNodeId: state.activeNodeId,
                activeAncestorIds: state.activeAncestorIds,
                lastTick: state.lastTick,
            }),
            onRehydrateStorage: () => (state) => {
                // Migration: Ensure all nodes have valid sessions array
                if (state && state.nodes) {
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
    )
);
