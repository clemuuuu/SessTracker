import { useRef, useEffect } from 'react';
import { useRevisionStore } from '../../../store/useRevisionStore';
import { type RevisionNode } from '../../../types';

export function BackgroundTree() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { nodes, edges, activeNodeId, activeAncestorIds } = useRevisionStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // -------------------------
        // Organic Drawing Logic (single draw, no animation loop)
        // -------------------------
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Center bottom of screen
        const islandX = canvas.width / 2;
        const islandY = canvas.height;

        // Identify Roots (Subjects)
        const targetIds = new Set(edges.map(e => e.target));
        const roots = nodes.filter(n => !targetIds.has(n.id));

        // Build children map for O(1) child lookups
        const childrenMap = new Map<string, RevisionNode[]>();
        for (const edge of edges) {
            const node = nodes.find(n => n.id === edge.target);
            if (node) {
                const children = childrenMap.get(edge.source) || [];
                children.push(node);
                childrenMap.set(edge.source, children);
            }
        }

        // Active set for O(1) lookups
        const activeSet = new Set(activeAncestorIds);
        if (activeNodeId) activeSet.add(activeNodeId);

        // Helper for styles
        const getBranchStyle = (isActive: boolean) => {
            if (isActive) {
                return { stroke: '#FCD34D', shadow: '#F59E0B', blur: 20 }; // Gold
            }
            return { stroke: 'rgba(51, 65, 85, 0.4)', shadow: 'transparent', blur: 0 }; // Slate-700
        };

        // Deterministic pseudo-random based on inputs
        const pseudoRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        // Recursive Organic Branch
        const drawOrganicBranch = (
            startX: number,
            startY: number,
            angle: number,
            length: number,
            width: number,
            nodeId: string | 'VIRTUAL_ROOT',
            depth: number
        ) => {
            let isActive = false;
            if (nodeId === 'VIRTUAL_ROOT') {
                isActive = activeNodeId !== null;
            } else {
                isActive = activeSet.has(nodeId);
            }

            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const curveOffset = length * 0.1 * (depth % 2 === 0 ? 1 : -1);
            const cp1X = midX + Math.cos(angle + Math.PI / 2) * curveOffset;
            const cp1Y = midY + Math.sin(angle + Math.PI / 2) * curveOffset;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cp1X, cp1Y, endX, endY);

            // Style
            const style = getBranchStyle(isActive);
            ctx.lineCap = 'round';
            ctx.lineWidth = width;
            ctx.strokeStyle = style.stroke;
            ctx.shadowColor = style.shadow;
            ctx.shadowBlur = style.blur;

            ctx.stroke();
            ctx.shadowBlur = 0;

            // Find children
            let children: RevisionNode[];

            if (nodeId === 'VIRTUAL_ROOT') {
                children = [...roots].sort((a, b) => a.position.x - b.position.x);
            } else {
                children = (childrenMap.get(nodeId) || [])
                    .sort((a, b) => a.position.x - b.position.x);
            }

            if (children.length === 0) return;

            const baseSpread = Math.PI / 1.5;
            const currentSpread = Math.min(baseSpread, children.length * 0.6);

            const startAngle = angle - currentSpread / 2;
            const angleStep = children.length > 1 ? currentSpread / (children.length - 1) : 0;

            children.forEach((child, i) => {
                // Use child ID string to generate a stable seed
                const seed = child.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + depth;
                const randomWiggle = (pseudoRandom(seed) * 0.2 - 0.1);

                const childAngle = children.length === 1
                    ? angle + randomWiggle
                    : startAngle + i * angleStep;

                drawOrganicBranch(
                    endX,
                    endY,
                    childAngle,
                    length * 0.8,
                    width * 0.65,
                    child.id,
                    depth + 1
                );
            });
        };

        drawOrganicBranch(
            islandX,
            islandY + 40,
            -Math.PI / 2,
            canvas.height * 0.3,
            40,
            'VIRTUAL_ROOT',
            0
        );

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [nodes, edges, activeNodeId, activeAncestorIds]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
                zIndex: 0,
                filter: 'blur(0.5px)'
            }}
        />
    );
}
