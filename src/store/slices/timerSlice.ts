import type { StateCreator } from 'zustand';
import type { RevisionState, TimerSlice } from './types';
import { getAncestorIds, getAncestorSet } from '../../utils/graphHelpers';

export const createTimerSlice: StateCreator<RevisionState, [], [], TimerSlice> = (set, get) => ({
    activeNodeId: null,
    activeAncestorIds: [],
    lastTick: null,

    toggleTimer: (id) => {
        const state = get();
        const now = Date.now();

        if (state.activeNodeId === id) {
            // Stop timer
            set({
                activeNodeId: null,
                activeAncestorIds: [],
                lastTick: null,
                nodes: state.nodes.map(n =>
                    n.id === id ? { ...n, data: { ...n.data, isRunning: false } } : n
                )
            });
        } else {
            const ancestors = getAncestorIds(id, state.edges);

            // Start timer
            const newNodes = state.nodes.map(n => ({
                ...n,
                data: {
                    ...n.data,
                    // Deactivate old active node if any, activate new one
                    isRunning: n.id === id
                }
            }));

            set({
                activeNodeId: id,
                activeAncestorIds: ancestors,
                lastTick: now,
                nodes: newNodes
            });
        }
    },

    tickCallback: () => {
        const state = get();
        if (!state.activeNodeId || !state.lastTick) return;

        const now = Date.now();
        const deltaSeconds = (now - state.lastTick) / 1000;

        const nodesToUpdate = getAncestorSet(state.activeNodeId, state.edges);

        set({
            lastTick: now,
            nodes: state.nodes.map((node) =>
                nodesToUpdate.has(node.id)
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            totalTime: (node.data.totalTime || 0) + deltaSeconds,
                        },
                    }
                    : node
            ),
        });
    },
});
