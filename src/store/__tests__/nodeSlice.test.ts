import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createNodeSlice } from '../slices/nodeSlice';


describe('nodeSlice', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let useStore: any;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useStore = create<any>()((...a) => ({
            activeNodeId: null,
            activeAncestorIds: [],
            lastTick: null,
            todos: [],
            windows: {},
            past: [],
            future: [],
            activeWindowId: null,
            maxZIndex: 10,
            calendarSessions: [],
            scrollTarget: null,
            scrollToArea: () => { },
            toggleTimer: () => { },
            tickCallback: () => { },
            addTodo: () => { },
            toggleTodo: () => { },
            deleteTodo: () => { },
            reorderTodos: () => { },
            addSession: () => { },
            updateSession: () => { },
            deleteSession: () => { },
            registerWindow: () => { },
            updateWindow: () => { },
            focusWindow: () => { },
            snapWindow: () => { },
            saveHistory: () => { },
            pushHistory: () => { },
            undo: () => { },
            redo: () => { },
            ...createNodeSlice(...a),
            nodes: [],
        }));
    });

    it('should add a node correctly', () => {
        useStore.getState().addNode(null, 'work', 'New Node');
        const state = useStore.getState();
        expect(state.nodes.length).toBe(1);
        expect(state.nodes[0].data.label).toBe('New Node');
        expect(state.nodes[0].data.type).toBe('work');
    });

    it('should delete a node and its edges', () => {
        useStore.getState().addNode(null, 'work', 'Node 1');
        const nodeId = useStore.getState().nodes[0].id;
        useStore.getState().deleteNode(nodeId);

        expect(useStore.getState().nodes.length).toBe(0);
    });

    it('should update a node label', () => {
        useStore.getState().addNode(null, 'work', 'Old Label');
        const nodeId = useStore.getState().nodes[0].id;

        useStore.getState().updateNodeLabel(nodeId, 'Updated Label');
        expect(useStore.getState().nodes[0].data.label).toBe('Updated Label');
    });
});
