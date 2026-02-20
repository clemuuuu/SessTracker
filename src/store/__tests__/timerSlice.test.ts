import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createNodeSlice } from '../slices/nodeSlice';
import { createTimerSlice } from '../slices/timerSlice';
import { createHistorySlice } from '../slices/historySlice';
import { createTodoSlice } from '../slices/todoSlice';
import { createUiSlice } from '../slices/uiSlice';
import { create } from 'zustand';
import type { RevisionState } from '../slices/types';

// Mock getAncestorIds/getAncestorSet since we're testing slice logic in isolation
vi.mock('../../utils/graphHelpers', () => ({
    getAncestorIds: () => [],
    getAncestorSet: () => new Set(['node-1'])
}));

const useTestStore = create<RevisionState>()((...a) => ({
    ...createNodeSlice(...a),
    ...createTimerSlice(...a),
    ...createHistorySlice(...a),
    ...createTodoSlice(...a),
    ...createUiSlice(...a),
    history: [],
    historyIndex: 0,
    undo: () => { },
    redo: () => { },
    canUndo: () => false,
    canRedo: () => false,
    pushHistory: () => ({})
}));

describe('timerSlice', () => {
    beforeEach(() => {
        useTestStore.setState({
            activeNodeId: null,
            activeAncestorIds: [],
            lastTick: null,
            nodes: [
                {
                    id: 'node-1',
                    type: 'revision',
                    position: { x: 0, y: 0 },
                    data: { label: 'Test Node', type: 'subject', totalTime: 0, sessions: [], isRunning: false }
                }
            ],
            edges: []
        });
    });

    it('should start a session when timer is toggled on', () => {
        const store = useTestStore.getState();
        store.toggleTimer('node-1');

        const updatedNode = useTestStore.getState().nodes.find(n => n.id === 'node-1');
        expect(updatedNode?.data.isRunning).toBe(true);
        expect(updatedNode?.data.sessions).toHaveLength(1);
        expect(updatedNode?.data.sessions[0].startTime).toBeDefined();
        expect(updatedNode?.data.sessions[0].endTime).toBeUndefined();
    });

    it('should end a session when timer is toggled off', () => {
        const store = useTestStore.getState();
        // Start
        store.toggleTimer('node-1');

        // Advance time slightly (mock if needed, but for logic check immediate stop is fine)
        // Stop
        store.toggleTimer('node-1');

        const updatedNode = useTestStore.getState().nodes.find(n => n.id === 'node-1');
        expect(updatedNode?.data.isRunning).toBe(false);
        expect(updatedNode?.data.sessions).toHaveLength(1);
        expect(updatedNode?.data.sessions[0].endTime).toBeDefined();
    });
});
