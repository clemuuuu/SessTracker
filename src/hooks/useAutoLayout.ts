import { useCallback } from 'react';
import { Position } from '@xyflow/react';
import dagre from 'dagre';
import { useRevisionStore } from '../store/useRevisionStore';
import { type RevisionNode } from '../types';

// Node size (width/height) + spacing
const NODE_WIDTH = 250;
const NODE_HEIGHT = 180;

export function useAutoLayout() {
    const onLayout = useCallback(() => {
        const { nodes, edges, setNodes, setEdges } = useRevisionStore.getState();
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 80 }); // Top to Bottom, increased spacing

        nodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        });

        edges.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        const layoutedNodes = nodes.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);

            return {
                ...node,
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom,
                position: {
                    x: nodeWithPosition.x - NODE_WIDTH / 2,
                    y: nodeWithPosition.y - NODE_HEIGHT / 2,
                },
            };
        });

        setNodes(layoutedNodes as RevisionNode[]);
        setEdges([...edges]); // Trigger update

    }, []);

    return { onLayout };
}
