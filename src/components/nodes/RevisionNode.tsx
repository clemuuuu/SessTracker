import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { Play, Pause, Plus, Trash2 } from 'lucide-react';
import { useRevisionStore } from '../../store/useRevisionStore';
import { type RevisionNode as RevisionNodeType } from '../../types';

// Helper to format seconds into HH:MM:SS
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export function RevisionNode({ id, data }: NodeProps<RevisionNodeType>) {
    const { toggleTimer, addNode, deleteNode, updateNodeLabel, activeAncestorIds } = useRevisionStore();
    const isSubject = data.type === 'subject';
    // Check if this node is an ancestor of the currently running node
    const isAccumulating = activeAncestorIds.includes(id);

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className={`
        relative min-w-[200px] p-4 rounded-xl shadow-lg border-2 
        ${data.isRunning ? 'border-green-400 shadow-green-400/50' :
                    isAccumulating ? 'border-blue-400 shadow-blue-400/50' : 'border-gray-700 shadow-gray-900/50'}
        ${isSubject ? 'bg-indigo-900/90' : 'bg-gray-800/90'}
        backdrop-blur-sm transition-colors duration-300
      `}
        >
            <Handle type="target" position={Position.Top} className="!bg-gray-400" />

            <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isSubject ? 'text-indigo-300' : 'text-gray-400'}`}>
                    {data.type} {isAccumulating && <span className="text-blue-400 ml-1">(Accumulating)</span>}
                </span>
                <button
                    onClick={() => deleteNode(id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                    title="Delete Node"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="mb-3">
                <input
                    className="bg-transparent text-lg font-bold text-white w-full outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    defaultValue={data.label}
                    maxLength={60}
                    onBlur={(e) => {
                        const trimmed = e.target.value.trim();
                        if (!trimmed) {
                            // Restore original label if empty
                            e.target.value = data.label;
                            return;
                        }
                        if (trimmed !== data.label) {
                            updateNodeLabel(id, trimmed);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                />
            </div>

            <div className="flex items-center justify-between bg-black/30 rounded-lg p-2 mb-3">
                <span className={`font-mono text-xl font-bold ${isAccumulating ? 'text-blue-300' : 'text-yellow-400'}`}>
                    {formatTime(data.totalTime || 0)}
                </span>
                <button
                    onClick={() => toggleTimer(id)}
                    className={`
            p-2 rounded-full transition-all
            ${data.isRunning
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/40'}
          `}
                >
                    {data.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => addNode(id, 'topic', 'New Topic')}
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/10"
                >
                    <Plus size={14} />
                    Add Sub-topic
                </button>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />

            {/* Animated glow when running */}
            {data.isRunning && (
                <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-green-500/50 -z-10"
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}

            {/* Animated glow when accumulating (blue) */}
            {isAccumulating && !data.isRunning && (
                <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-blue-500/30 -z-10"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            )}
        </motion.div>
    );
}
