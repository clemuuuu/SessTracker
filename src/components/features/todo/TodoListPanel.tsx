import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react';
import { useRevisionStore } from '../../../store/useRevisionStore';

export function TodoListPanel() {
    const { todos, addTodo, toggleTodo, deleteTodo } = useRevisionStore();
    const [newItemText, setNewItemText] = useState('');

    const handleAdd = () => {
        if (newItemText.trim()) {
            addTodo(newItemText);
            setNewItemText('');
        }
    };

    return (
        <div className="flex flex-col h-full p-4 text-white">
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Add a new goal..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-2 transition-colors cursor-pointer"
                >
                    <Plus size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {todos.length === 0 && (
                    <div className="text-gray-500 text-center mt-10 text-sm">
                        No objectives yet. Set your goals!
                    </div>
                )}
                {todos.map((todo) => (
                    <div
                        key={todo.id}
                        className="group flex items-center gap-3 bg-gray-800/50 p-3 rounded hover:bg-gray-800 transition-colors border border-gray-700/30"
                    >
                        <button
                            data-testid={`toggle-todo-${todo.id}`}
                            onClick={() => toggleTodo(todo.id)}
                            className={`flex-shrink-0 transition-colors ${todo.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-indigo-400'}`}
                        >
                            {todo.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                        </button>
                        <span className={`text-sm flex-1 transition-all ${todo.completed ? 'opacity-50 line-through text-slate-400' : 'text-slate-200'}`}>
                            {todo.text}
                        </span>
                        <button
                            data-testid={`delete-todo-${todo.id}`}
                            onClick={() => deleteTodo(todo.id)}
                            className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
