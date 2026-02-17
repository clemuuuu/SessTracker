import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    type Edge,
    applyNodeChanges,
    applyEdgeChanges,
    type OnNodesChange,
    type OnEdgesChange,
    type Connection,
    addEdge
} from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import { type RevisionNode, type SubjectType } from '../types';
import { getAncestorIds, getAncestorSet, getNodeDepth } from '../utils/graphHelpers';

const MAX_DEPTH = 10;

interface HistoryEntry {
    nodes: RevisionNode[];
    edges: Edge[];
}

interface RevisionState {
    nodes: RevisionNode[];
    edges: Edge[];
    activeNodeId: string | null;
    activeAncestorIds: string[]; // IDs of ancestors of the active node
    lastTick: number | null;

    // Undo/Redo
    history: HistoryEntry[];
    historyIndex: number;

    // Actions
    addNode: (parentId: string | null, type: SubjectType, label: string) => void;
    updateNodeLabel: (id: string, label: string) => void;
    deleteNode: (id: string) => void;

    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;

    toggleTimer: (id: string) => void;
    tickCallback: () => void; // Call this periodically from a component/hook
    setNodes: (nodes: RevisionNode[]) => void;
    setEdges: (edges: Edge[]) => void;

    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

const DEFAULT_NODES: RevisionNode[] = [
    {
        id: 'root-1',
        type: 'revision',
        position: { x: 250, y: 50 },
        data: { label: 'My Studies', type: 'subject', totalTime: 0, isRunning: false },
    },
];

// Helper to push a snapshot to history
function pushHistory(state: RevisionState): Pick<RevisionState, 'history' | 'historyIndex'> {
    const entry: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        edges: JSON.parse(JSON.stringify(state.edges)),
    };
    // Truncate any future entries if we're not at the end
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(entry);
    // Keep max 50 entries
    if (newHistory.length > 50) newHistory.shift();
    return { history: newHistory, historyIndex: newHistory.length - 1 };
}

export const useRevisionStore = create<RevisionState>()(
    persist(
        (set, get) => ({
            nodes: DEFAULT_NODES,
            edges: [],
            activeNodeId: null,
            activeAncestorIds: [],
            lastTick: null,
            history: [{ nodes: DEFAULT_NODES, edges: [] }],
            historyIndex: 0,

            addNode: (parentId, type, label) => {
                // Depth limit check
                if (parentId) {
                    const depth = getNodeDepth(parentId, get().edges);
                    if (depth >= MAX_DEPTH) return;
                }

                const id = uuidv4();
                const newNode: RevisionNode = {
                    id,
                    type: 'revision',
                    position: { x: Math.random() * 400, y: Math.random() * 400 + 100 },
                    data: { label, type, totalTime: 0, isRunning: false },
                };

                set((state) => {
                    const newEdges = parentId
                        ? [
                            ...state.edges,
                            { id: `e-${parentId}-${id}`, source: parentId, target: id, animated: true },
                        ]
                        : state.edges;

                    const newState = {
                        nodes: [...state.nodes, newNode],
                        edges: newEdges,
                    };

                    return {
                        ...newState,
                        ...pushHistory({ ...state, ...newState }),
                    };
                });
            },

            updateNodeLabel: (id, label) => {
                const trimmed = label.trim();
                if (!trimmed) return; // Reject empty labels

                set((state) => {
                    const newNodes = state.nodes.map((node) =>
                        node.id === id ? { ...node, data: { ...node.data, label: trimmed } } : node
                    );
                    return {
                        nodes: newNodes,
                        ...pushHistory({ ...state, nodes: newNodes }),
                    };
                });
            },

            deleteNode: (id) => {
                set((state) => {
                    const { nodes, edges } = state;
                    const nodeToDelete = nodes.find((n) => n.id === id);

                    if (!nodeToDelete) return state;

                    // Build children map for O(n) traversal instead of repeated .filter()
                    const childrenMap = new Map<string, string[]>();
                    for (const edge of edges) {
                        const children = childrenMap.get(edge.source) || [];
                        children.push(edge.target);
                        childrenMap.set(edge.source, children);
                    }

                    const getNodesToDelete = (startId: string): string[] => {
                        const children = childrenMap.get(startId) || [];
                        return [startId, ...children.flatMap(getNodesToDelete)];
                    };

                    const idsToDelete = new Set(getNodesToDelete(id));

                    const newNodes = nodes.filter((n) => !idsToDelete.has(n.id));
                    const newEdges = edges.filter((e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target));

                    return {
                        nodes: newNodes,
                        edges: newEdges,
                        activeNodeId: idsToDelete.has(state.activeNodeId || '') ? null : state.activeNodeId,
                        activeAncestorIds: idsToDelete.has(state.activeNodeId || '') ? [] : state.activeAncestorIds,
                        ...pushHistory({ ...state, nodes: newNodes, edges: newEdges }),
                    };
                });
            },

            onNodesChange: (changes) => {
                set({
                    nodes: applyNodeChanges(changes, get().nodes) as RevisionNode[],
                });
            },

            onEdgesChange: (changes) => {
                set({
                    edges: applyEdgeChanges(changes, get().edges),
                });
            },

            onConnect: (connection) => {
                set({
                    edges: addEdge(connection, get().edges),
                });
            },

            toggleTimer: (id) => {
                const state = get();
                const now = Date.now();

                if (state.activeNodeId === id) {
                    // Stop timer
                    set((state) => ({
                        activeNodeId: null,
                        activeAncestorIds: [],
                        lastTick: null,
                        nodes: state.nodes.map(n =>
                            n.id === id ? { ...n, data: { ...n.data, isRunning: false } } : n
                        )
                    }));
                } else {
                    const ancestors = getAncestorIds(id, state.edges);

                    // Start timer
                    set((state) => ({
                        activeNodeId: id,
                        activeAncestorIds: ancestors,
                        lastTick: now,
                        nodes: state.nodes.map(n => ({
                            ...n,
                            data: {
                                ...n.data,
                                isRunning: n.id === id
                            }
                        }))
                    }));
                }
            },

            tickCallback: () => {
                const state = get();
                if (!state.activeNodeId || !state.lastTick) return;

                const now = Date.now();
                const deltaSeconds = (now - state.lastTick) / 1000;

                const nodesToUpdate = getAncestorSet(state.activeNodeId, state.edges);

                set((state) => ({
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
                }));
            },

            setNodes: (nodes) => set({ nodes }),
            setEdges: (edges) => set({ edges }),

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
