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
        }
    )
);
