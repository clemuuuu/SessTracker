import type { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RevisionState, TodoSlice, TodoTask } from './types';

export const createTodoSlice: StateCreator<RevisionState, [], [], TodoSlice> = (set) => ({
    todos: [],
    addTodo: (text: string) => {
        if (!text.trim()) return;
        set((state) => ({
            todos: [
                ...state.todos,
                {
                    id: uuidv4(),
                    text: text.trim(),
                    completed: false,
                    createdAt: Date.now(),
                },
            ],
        }));
    },
    toggleTodo: (id: string) => set((state) => ({
        todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
    })),
    deleteTodo: (id: string) => set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
    })),
});
