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

interface RevisionState {
    nodes: RevisionNode[];
    edges: Edge[];
    activeNodeId: string | null;
    activeAncestorIds: string[]; // IDs of ancestors of the active node
    lastTick: number | null;

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
}

const DEFAULT_NODES: RevisionNode[] = [
    {
        id: 'root-1',
        type: 'revision',
        position: { x: 250, y: 50 },
        data: { label: 'My Studies', type: 'subject', totalTime: 0, isRunning: false },
    },
];

export const useRevisionStore = create<RevisionState>()(
    persist(
        (set, get) => ({
            nodes: DEFAULT_NODES,
            edges: [],
            activeNodeId: null,
            activeAncestorIds: [],
            lastTick: null,

            addNode: (parentId, type, label) => {
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

                    return {
                        nodes: [...state.nodes, newNode],
                        edges: newEdges,
                    };
                });
            },

            updateNodeLabel: (id, label) => {
                set({
                    nodes: get().nodes.map((node) =>
                        node.id === id ? { ...node, data: { ...node.data, label } } : node
                    ),
                });
            },

            deleteNode: (id) => {
                set((state) => {
                    const { nodes, edges } = state;
                    const nodeToDelete = nodes.find((n) => n.id === id);

                    if (!nodeToDelete) return state;

                    // Recursive deletion helper
                    const getNodesToDelete = (startId: string): string[] => {
                        const node = nodes.find((n) => n.id === startId);
                        if (!node) return [];

                        // Should properly use getOutgoers but we need the edges too.
                        // Simplified: find edges where source is startId, get target, recurse.
                        const childIds = edges
                            .filter(e => e.source === startId)
                            .map(e => e.target);

                        return [startId, ...childIds.flatMap(getNodesToDelete)];
                    };

                    const idsToDelete = new Set(getNodesToDelete(id));

                    return {
                        nodes: nodes.filter((n) => !idsToDelete.has(n.id)),
                        edges: edges.filter((e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target)),
                        activeNodeId: idsToDelete.has(state.activeNodeId || '') ? null : state.activeNodeId,
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
                    // Helper to find all ancestors of a node
                    const getAncestors = (startId: string, edges: Edge[]): string[] => {
                        const ancestors: string[] = [];
                        let currentId = startId;

                        while (true) {
                            const parentEdge = edges.find(e => e.target === currentId);
                            if (!parentEdge) break;

                            ancestors.push(parentEdge.source);
                            currentId = parentEdge.source;
                        }
                        return ancestors;
                    };

                    const ancestors = getAncestors(id, state.edges);

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

                // Helper to find all ancestors of a node
                const getAncestors = (startId: string, edges: Edge[]): Set<string> => {
                    const ancestors = new Set<string>();
                    let currentId = startId;

                    while (true) {
                        const parentEdge = edges.find(e => e.target === currentId);
                        if (!parentEdge) break;

                        ancestors.add(parentEdge.source);
                        currentId = parentEdge.source;
                    }
                    return ancestors;
                };

                const nodesToUpdate = getAncestors(state.activeNodeId, state.edges);
                nodesToUpdate.add(state.activeNodeId);

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

        }),
        {
            name: 'revision-tracker-storage',
        }
    )
);
