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

export interface TodoTask {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

export interface TodoSlice {
    todos: TodoTask[];
    addTodo: (text: string) => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
}

export interface WindowState {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex: number;
    isSnapped: 'float' | 'maximize' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
}

export interface UiSlice {
    windows: Record<string, WindowState>;
    activeWindowId: string | null;
    maxZIndex: number;
    registerWindow: (id: string, config: { x: number; y: number; w: number; h: number }) => void;
    updateWindow: (id: string, updates: Partial<WindowState>) => void;
    focusWindow: (id: string) => void;
    snapWindow: (id: string, input: 'left' | 'right' | 'up' | 'down') => void;
}

export type RevisionState = NodeSlice & TimerSlice & HistorySlice & TodoSlice & UiSlice;
