import type { StateCreator } from 'zustand';
import type { RevisionState, TimerSlice } from './types';
import { getAncestorIds, getAncestorSet } from '../../utils/graphHelpers';

import { v4 as uuidv4 } from 'uuid';

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
                nodes: state.nodes.map(n => {
                    if (n.id === id) {
                        const currentSession = n.data.sessions[n.data.sessions.length - 1];
                        const updatedSessions = [...n.data.sessions];
                        if (currentSession && !currentSession.endTime) {
                            updatedSessions[updatedSessions.length - 1] = {
                                ...currentSession,
                                endTime: now,
                                duration: (now - currentSession.startTime) / 1000
                            };
                        }

                        return {
                            ...n,
                            data: {
                                ...n.data,
                                isRunning: false,
                                sessions: updatedSessions
                            }
                        };
                    }
                    return n;
                })
            });
        } else {
            const ancestors = getAncestorIds(id, state.edges);

            // Start timer
            const newNodes = state.nodes.map(n => {
                // If this is the new active node, start a session
                if (n.id === id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            isRunning: true,
                            sessions: [
                                ...n.data.sessions,
                                {
                                    id: uuidv4(),
                                    startTime: now,
                                    duration: 0
                                }
                            ]
                        }
                    };
                }

                // If this was the PREVIOUS active node, stop its session
                if (n.id === state.activeNodeId) {
                    const currentSession = n.data.sessions[n.data.sessions.length - 1];
                    const updatedSessions = [...n.data.sessions];
                    if (currentSession && !currentSession.endTime) {
                        updatedSessions[updatedSessions.length - 1] = {
                            ...currentSession,
                            endTime: now,
                            duration: (now - currentSession.startTime) / 1000
                        };
                    }
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            isRunning: false,
                            sessions: updatedSessions
                        }
                    };
                }

                return n;
            });

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
                            // If this is the active node (not just ancestor), update current session
                            sessions: node.id === state.activeNodeId
                                ? node.data.sessions.map((s, i) =>
                                    i === node.data.sessions.length - 1
                                        ? { ...s, duration: (now - s.startTime) / 1000 }
                                        : s
                                )
                                : node.data.sessions
                        },
                    }
                    : node
            ),
        });
    },
});
