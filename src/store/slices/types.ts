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
    scrollTarget: 'roots' | 'tree' | 'calendar' | 'treeHorizontal' | null;
    scrollToArea: (area: 'roots' | 'tree' | 'calendar' | 'treeHorizontal' | null) => void;
}

export interface CalendarSession {
    id: string;
    dayIndex: number; // 0-6 (Lun-Dim)
    date?: string; // YYYY-MM-DD (ISO) - Optional for migration
    title: string;
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    color?: string; // Hex code or Tailwind class
    type: 'work' | 'break' | 'other';
}

export interface CalendarSlice {
    calendarSessions: CalendarSession[];
    addSession: (session: Omit<CalendarSession, 'id'>) => void;
    updateSession: (id: string, updates: Partial<CalendarSession>) => void;
    deleteSession: (id: string) => void;
}

export type RevisionState = NodeSlice & TimerSlice & HistorySlice & TodoSlice & UiSlice & CalendarSlice;
