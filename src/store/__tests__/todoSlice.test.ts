import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createTodoSlice } from '../slices/todoSlice';


describe('todoSlice', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let useStore: any;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useStore = create<any>()((...a) => ({
            ...createTodoSlice(...a)
        }));
    });

    it('should initialize with empty todos', () => {
        const state = useStore.getState();
        expect(state.todos).toEqual([]);
    });

    it('should add a todo', () => {
        useStore.getState().addTodo('Learn Vitest');
        const state = useStore.getState();
        expect(state.todos.length).toBe(1);
        expect(state.todos[0].text).toBe('Learn Vitest');
        expect(state.todos[0].completed).toBe(false);
    });

    it('should toggle a todo completion status', () => {
        useStore.getState().addTodo('Task 1');
        const todoId = useStore.getState().todos[0].id;

        useStore.getState().toggleTodo(todoId);
        expect(useStore.getState().todos[0].completed).toBe(true);

        useStore.getState().toggleTodo(todoId);
        expect(useStore.getState().todos[0].completed).toBe(false);
    });

    it('should delete a todo', () => {
        useStore.getState().addTodo('Task to delete');
        const todoId = useStore.getState().todos[0].id;

        useStore.getState().deleteTodo(todoId);
        expect(useStore.getState().todos.length).toBe(0);
    });
});
