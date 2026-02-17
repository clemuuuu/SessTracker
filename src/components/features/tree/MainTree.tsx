import { ReactFlow, Background, Controls, Panel, type NodeTypes } from '@xyflow/react';
import { Layout } from 'lucide-react';
import { useRevisionStore } from '../../../store/useRevisionStore';
import { useAutoLayout } from '../../../hooks/useAutoLayout';
import { BackgroundTree } from '../background/BackgroundTree';
import { FloatingControls } from '../controls/FloatingControls';
import { RevisionNode } from '../../nodes/RevisionNode';

const nodeTypes: NodeTypes = {
    revision: RevisionNode,
};

export function MainTree() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
    } = useRevisionStore();

    const { onLayout } = useAutoLayout();

    return (
        <div className="relative w-screen h-screen min-h-screen text-white overflow-hidden bg-gray-900 snap-start">
            {/* Background Layers */}
            <div className="absolute inset-0 z-0">
                {/* Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900"></div>
                {/* Fractal Tree */}
                <BackgroundTree />
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="relative z-10 bg-transparent"
            >
                <FloatingControls />
                <Background gap={20} size={1} color="#444" className="opacity-20" />
                <Controls className="bg-white/10 border-white/20 text-white" />
                <Panel position="top-right">
                    <button
                        onClick={onLayout}
                        className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-600 shadow-lg transition-colors flex items-center gap-2"
                    >
                        <Layout size={16} />
                        Auto Layout
                    </button>
                </Panel>
            </ReactFlow>

            {/* Scroll Hint */}
            <div
                onClick={() => {
                    const rootsView = document.getElementById('roots-view');
                    if (rootsView) {
                        rootsView.scrollIntoView({ behavior: 'smooth' });
                    }
                }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce opacity-50 text-indigo-300 z-20 cursor-pointer hover:opacity-100 transition-opacity"
            >
                <span className="text-xs">Scroll for Roots & Stats</span>
                <div className="w-6 h-6 border-2 border-indigo-300 rounded-full border-t-0 border-l-0 rotate-45 mx-auto mt-1"></div>
            </div>
        </div>
    );
}
