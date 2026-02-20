import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createHistorySlice } from '../slices/historySlice';


describe('historySlice', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let useStore: any;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useStore = create<any>()((...a) => ({
            nodes: [],
            edges: [],
            activeNodeId: null,
            activeAncestorIds: [],
            lastTick: null,
            todos: [],
            windows: {},
            activeWindowId: null,
            maxZIndex: 10,
            calendarSessions: [],
            scrollTarget: null,
            scrollToArea: () => { },
            setNodes: () => { },
            setEdges: () => { },
            onNodesChange: () => { },
            onEdgesChange: () => { },
            onConnect: () => { },
            addNode: () => { },
            deleteNode: () => { },
            updateNodeLabel: () => { },
            toggleTimer: () => { },
            tickCallback: () => { },
            registerWindow: () => { },
            updateWindow: () => { },
            focusWindow: () => { },
            snapWindow: () => { },
            addTodo: () => { },
            toggleTodo: () => { },
            deleteTodo: () => { },
            reorderTodos: () => { },
            addSession: () => { },
            updateSession: () => { },
            deleteSession: () => { },
            ...createHistorySlice(...a),
        }));
    });

    it('should initialize with empty history', () => {
        const state = useStore.getState();
        expect(state.history).toEqual([]);
        expect(state.historyIndex).toBe(0);
    });

    it('should save history correctly', () => {
        const result = useStore.getState().pushHistory(useStore.getState());
        expect(result.history.length).toBe(1);
    });

    it('should undo and redo state correctly', () => {
        // Setup initial store state
        useStore.setState({ nodes: [{ id: 'node-1', type: 'revision', position: { x: 0, y: 0 }, data: { label: 'Initial', type: 'work', totalTime: 0, sessions: [], isRunning: false } }] });

        // Save state 1
        useStore.setState(useStore.getState().pushHistory(useStore.getState()));

        // Modify nodes
        useStore.setState({ nodes: [] });

        // Save state 2
        useStore.setState(useStore.getState().pushHistory(useStore.getState()));

        // Check undo
        useStore.getState().undo();
        expect(useStore.getState().nodes.length).toBe(1);
        expect(useStore.getState().nodes[0].data.label).toBe('Initial');

        // Check redo
        useStore.getState().redo();
        expect(useStore.getState().nodes.length).toBe(0);
    });
});
