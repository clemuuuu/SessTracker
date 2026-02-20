import type { StateCreator } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { RevisionState, NodeSlice } from './types';
import type { RevisionNode } from '../../types';
import { getNodeDepth } from '../../utils/graphHelpers';

const MAX_DEPTH = 10;

const DEFAULT_NODES: RevisionNode[] = [
    {
        id: 'root-1',
        type: 'revision',
        position: { x: 250, y: 50 },
        data: { label: 'My Studies', type: 'subject', totalTime: 0, sessions: [], isRunning: false },
    },
];

export const createNodeSlice: StateCreator<RevisionState, [], [], NodeSlice> = (set, get) => ({
    nodes: DEFAULT_NODES,
    edges: [],

    addNode: (parentId, type, label) => {
        const state = get();
        // Depth limit check
        if (parentId) {
            const depth = getNodeDepth(parentId, state.edges);
            if (depth >= MAX_DEPTH) return;
        }

        const id = uuidv4();
        const newNode: RevisionNode = {
            id,
            type: 'revision',
            position: { x: 100 + (state.nodes.length * 30) % 300, y: 150 + (state.nodes.length * 20) % 200 },
            data: { label, type, totalTime: 0, sessions: [], isRunning: false },
        };

        const newEdges = parentId
            ? [
                ...state.edges,
                { id: `e-${parentId}-${id}`, source: parentId, target: id, animated: true },
            ]
            : state.edges;

        const nextState = {
            ...state,
            nodes: [...state.nodes, newNode],
            edges: newEdges,
        };

        set({
            ...nextState,
            ...state.pushHistory(nextState),
        });
    },

    updateNodeLabel: (id, label) => {
        const trimmed = label.trim();
        if (!trimmed) return;

        set((state) => {
            const newNodes = state.nodes.map((node) =>
                node.id === id ? { ...node, data: { ...node.data, label: trimmed } } : node
            );

            const nextState = { ...state, nodes: newNodes };

            return {
                ...nextState,
                ...state.pushHistory(nextState),
            };
        });
    },

    deleteNode: (id) => {
        set((state) => {
            const { nodes, edges } = state;
            const nodeToDelete = nodes.find((n) => n.id === id);

            if (!nodeToDelete) return state;

            // Build children map for O(n) traversal
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

            const nextState = {
                ...state,
                nodes: newNodes,
                edges: newEdges,
                activeNodeId: idsToDelete.has(state.activeNodeId || '') ? null : state.activeNodeId,
                activeAncestorIds: idsToDelete.has(state.activeNodeId || '') ? [] : state.activeAncestorIds,
            };

            return {
                ...nextState,
                ...state.pushHistory(nextState),
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

    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
});
