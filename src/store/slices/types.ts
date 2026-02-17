import type { Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react';
import type { RevisionNode, SubjectType } from '../../types';

export interface HistoryEntry {
    nodes: RevisionNode[];
    edges: Edge[];
}

export interface NodeSlice {
    nodes: RevisionNode[];
    edges: Edge[];
    addNode: (parentId: string | null, type: SubjectType, label: string) => void;
    updateNodeLabel: (id: string, label: string) => void;
    deleteNode: (id: string) => void;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    setNodes: (nodes: RevisionNode[]) => void;
    setEdges: (edges: Edge[]) => void;
}

export interface TimerSlice {
    activeNodeId: string | null;
    activeAncestorIds: string[];
    lastTick: number | null;
    toggleTimer: (id: string) => void;
    tickCallback: () => void;
}

export interface HistorySlice {
    history: HistoryEntry[];
    historyIndex: number;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    pushHistory: (state: RevisionState) => Partial<RevisionState>;
}

export type RevisionState = NodeSlice & TimerSlice & HistorySlice;
