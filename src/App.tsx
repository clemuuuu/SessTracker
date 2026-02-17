import { useEffect } from 'react';
import { ReactFlow, Background, Controls, type NodeTypes, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Layout } from 'lucide-react';

import { useRevisionStore } from './store/useRevisionStore';
import { RevisionNode } from './components/nodes/RevisionNode';
import { FloatingControls } from './components/FloatingControls';
import { useAutoLayout } from './hooks/useAutoLayout';
import { BackgroundTree } from './components/BackgroundTree';

const nodeTypes: NodeTypes = {
  revision: RevisionNode,
};

function App() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    tickCallback,
    undo,
    redo
  } = useRevisionStore();

  const { onLayout } = useAutoLayout();

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      tickCallback();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickCallback]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="relative w-screen h-screen text-white overflow-hidden bg-gray-900">
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
    </div>
  );

}

export default App;
