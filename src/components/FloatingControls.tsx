import { Plus, Layout, Save } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useRevisionStore } from '../store/useRevisionStore';

export function FloatingControls() {
    const { addNode } = useRevisionStore();
    const { fitView } = useReactFlow();

    return (
        <div className="absolute top-4 left-4 z-50 flex gap-2">
            <button
                onClick={() => addNode(null, 'subject', 'New Subject')}
                className="
          flex items-center gap-2 px-4 py-2 
          bg-indigo-600 hover:bg-indigo-700 
          text-white rounded-lg shadow-lg 
          transition-all hover:scale-105 active:scale-95
          font-medium
          cursor-pointer
        "
            >
                <Plus size={20} />
                Add Subject
            </button>

            <button
                onClick={() => fitView({ duration: 800 })}
                className="
          px-4 py-2 bg-gray-800 hover:bg-gray-700 
          text-gray-300 hover:text-white
          rounded-lg shadow-lg border border-gray-700 
          flex items-center gap-2
          transition-all hover:scale-105 active:scale-95
          cursor-pointer
        "
                title="Reset & Fit View"
            >
                <Layout size={18} />
                <span className="text-sm font-medium">Reset View</span>
            </button>


            <div className="px-4 py-2 bg-green-900/40 text-green-300 rounded-lg border border-green-800 flex items-center gap-2 select-none shadow-lg backdrop-blur-sm">
                <Save size={16} />
                <span className="text-xs font-semibold">Auto-saved</span>
            </div>
        </div >
    );
}
