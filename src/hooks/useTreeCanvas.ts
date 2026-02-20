
import { useRef, useEffect } from 'react';
import { useRevisionStore } from '../store/useRevisionStore';
import type { RevisionNode } from '../types';

interface TreeCanvasOptions {
    direction: 'up' | 'down';
    startPosition: 'bottom-center' | 'top-center';
    getBranchStyle: (isActive: boolean) => { stroke: string; shadow: string; blur: number; lineWidth: number };
    curveFactor: number;
    spreadFactor: number;
    lengthDecay: number;
    widthDecay: number;
    initialLengthFactor: number;
    initialWidth: number;
}

export function useTreeCanvas(options: TreeCanvasOptions, isVisible: boolean = true) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { nodes, edges, activeNodeId, activeAncestorIds } = useRevisionStore();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;

            const ctx = canvas.getContext('2d');
            if (ctx) ctx.scale(dpr, dpr);

            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isVisible) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and set transform for DPR
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

        const islandX = window.innerWidth / 2;
        const islandY = options.startPosition === 'bottom-center' ? window.innerHeight : 0;

        // Identify Roots
        const targetIds = new Set(edges.map(e => e.target));
        const roots = nodes.filter(n => !targetIds.has(n.id));

        // Build Optimised Children Map (O(n))
        const childrenMap = new Map<string, RevisionNode[]>();
        // First pass: put all nodes in a map by ID for O(1) lookup
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        for (const edge of edges) {
            const node = nodeMap.get(edge.target);
            if (node) {
                const children = childrenMap.get(edge.source) || [];
                children.push(node);
                childrenMap.set(edge.source, children);
            }
        }

        const activeSet = new Set(activeAncestorIds);
        if (activeNodeId) activeSet.add(activeNodeId);

        const pseudoRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const drawBranch = (
            startX: number,
            startY: number,
            angle: number,
            length: number,
            width: number,
            nodeId: string | 'VIRTUAL_ROOT',
            depth: number
        ) => {
            const isActive = nodeId === 'VIRTUAL_ROOT' ? activeNodeId !== null : activeSet.has(nodeId);

            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const curveOffset = length * options.curveFactor * (depth % 2 === 0 ? 1 : -1);
            const cp1X = midX + Math.cos(angle + Math.PI / 2) * curveOffset;
            const cp1Y = midY + Math.sin(angle + Math.PI / 2) * curveOffset;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cp1X, cp1Y, endX, endY);

            const style = options.getBranchStyle(isActive);
            ctx.lineCap = 'round';
            ctx.lineWidth = width;
            ctx.strokeStyle = style.stroke;
            ctx.shadowColor = style.shadow;
            ctx.shadowBlur = style.blur;

            ctx.stroke();
            ctx.shadowBlur = 0;

            let children: RevisionNode[];
            if (nodeId === 'VIRTUAL_ROOT') {
                children = [...roots].sort((a, b) => a.position.x - b.position.x);
            } else {
                children = (childrenMap.get(nodeId) || [])
                    .sort((a, b) => a.position.x - b.position.x);
            }

            if (children.length === 0) return;

            const baseSpread = Math.PI / options.spreadFactor;
            const currentSpread = Math.min(baseSpread, children.length * 0.6);

            const startAngle = angle - currentSpread / 2;
            const angleStep = children.length > 1 ? currentSpread / (children.length - 1) : 0;

            children.forEach((child, i) => {
                const seed = child.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + depth;
                const randomWiggle = (pseudoRandom(seed) * 0.2 - 0.1);

                const childAngle = children.length === 1
                    ? angle + randomWiggle
                    : startAngle + i * angleStep;

                drawBranch(
                    endX,
                    endY,
                    childAngle,
                    length * options.lengthDecay,
                    width * options.widthDecay,
                    child.id,
                    depth + 1
                );
            });
        };

        const startAngle = options.direction === 'up' ? -Math.PI / 2 : Math.PI / 2;

        drawBranch(
            islandX,
            islandY + (options.direction === 'up' ? 40 : 0), // Small offset for up tree
            startAngle,
            canvas.height * options.initialLengthFactor,
            options.initialWidth,
            'VIRTUAL_ROOT',
            0
        );

    }, [nodes, edges, activeNodeId, activeAncestorIds, options, isVisible]);

    return canvasRef;
}
