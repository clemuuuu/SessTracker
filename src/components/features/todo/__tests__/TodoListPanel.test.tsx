import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TodoListPanel } from '../TodoListPanel';
import { useRevisionStore } from '../../../../store/useRevisionStore';

// Mock the Zustand store entirely for isolated component testing
vi.mock('../../../../store/useRevisionStore', () => ({
    useRevisionStore: vi.fn(),
}));

describe('TodoListPanel Component', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockStore: any;

    beforeEach(() => {
        mockStore = {
            todos: [
                { id: '1', text: 'Test Todo 1', completed: false, createdAt: Date.now() },
                { id: '2', text: 'Completed Todo', completed: true, createdAt: Date.now() },
            ],
            addTodo: vi.fn(),
            toggleTodo: vi.fn(),
            deleteTodo: vi.fn(),
            reorderTodos: vi.fn(),
        };

        // Make the hook return our mock
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useRevisionStore as any).mockReturnValue(mockStore);
    });

    it('renders the todo list', () => {
        render(<TodoListPanel />);
        expect(screen.getByText('Test Todo 1')).toBeDefined();
        expect(screen.getByText('Completed Todo')).toBeDefined();
    });

    it('calls addTodo when form is submitted', () => {
        render(<TodoListPanel />);
        const input = screen.getByPlaceholderText('Add a new goal...');

        fireEvent.change(input, { target: { value: 'New Goal' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        expect(mockStore.addTodo).toHaveBeenCalledWith('New Goal');
    });

    it('calls toggleTodo when a checkbox is clicked', () => {
        render(<TodoListPanel />);
        // The first button in the todo item is the toggle (Circle or CheckCircle2)
        const toggleBtn = screen.getByTestId('toggle-todo-1');

        fireEvent.click(toggleBtn);
        expect(mockStore.toggleTodo).toHaveBeenCalledWith('1');
    });

    it('calls deleteTodo when trash icon is clicked', () => {
        render(<TodoListPanel />);
        const deleteBtn = screen.getByTestId('delete-todo-1');

        fireEvent.click(deleteBtn);
        expect(mockStore.deleteTodo).toHaveBeenCalledWith('1');
    });
});
