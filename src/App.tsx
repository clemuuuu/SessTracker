import { useEffect } from 'react';
import { ReactFlow, Background, Controls, type NodeTypes, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Layout } from 'lucide-react';

import { useRevisionStore } from './store/useRevisionStore';
import { RevisionNode } from './components/nodes/RevisionNode';
import { FloatingControls } from './components/FloatingControls';
import { useAutoLayout } from './hooks/useAutoLayout';

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
    tickCallback
  } = useRevisionStore();

  const { onLayout } = useAutoLayout();

  // Timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      tickCallback();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickCallback]);

  return (
    <div className="w-screen h-screen bg-gray-900 text-white overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900"
      >
        <FloatingControls />
        <Background gap={20} size={1} color="#444" />
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

      {/* Background Gradient Mesh (Visual Flair) */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900"></div>
    </div>
  );
}

export default App;
