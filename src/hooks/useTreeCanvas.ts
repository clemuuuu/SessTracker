import { useRef, useCallback } from 'react';
import { useRevisionStore } from '../store/useRevisionStore';
import { useAnimationLoop } from './useAnimationLoop';
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
    // ---- Zustand-RAF boundary: read store via selectors, cache into refs ----
    // React re-renders update the refs. The RAF draw callback reads refs only, never the store.
    const nodes = useRevisionStore((s) => s.nodes);
    const edges = useRevisionStore((s) => s.edges);
    const activeNodeId = useRevisionStore((s) => s.activeNodeId);
    const activeAncestorIds = useRevisionStore((s) => s.activeAncestorIds);

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const activeNodeIdRef = useRef(activeNodeId);
    const activeAncestorIdsRef = useRef(activeAncestorIds);
    const optionsRef = useRef(options);
    const isVisibleRef = useRef(isVisible);

    // Sync refs on every render
    nodesRef.current = nodes;
    edgesRef.current = edges;
    activeNodeIdRef.current = activeNodeId;
    activeAncestorIdsRef.current = activeAncestorIds;
    optionsRef.current = options;
    isVisibleRef.current = isVisible;

    // ---- Draw callback: empty dependency array, reads from refs ----
    // deltaMs and totalMs are received but not yet used for animation (Plan 02 will use them).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _deltaMs: number, _totalMs: number) => {
        // Skip drawing if not visible
        if (!isVisibleRef.current) return;

        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const currentActiveNodeId = activeNodeIdRef.current;
        const currentActiveAncestorIds = activeAncestorIdsRef.current;
        const opts = optionsRef.current;

        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        const islandX = width / 2;
        const islandY = opts.startPosition === 'bottom-center' ? height : 0;

        // Identify roots (nodes with no incoming edges)
        const targetIds = new Set(currentEdges.map(e => e.target));
        const roots = currentNodes.filter(n => !targetIds.has(n.id));

        // Build optimised children map (O(n))
        const childrenMap = new Map<string, RevisionNode[]>();
        const nodeMap = new Map(currentNodes.map(n => [n.id, n]));

        for (const edge of currentEdges) {
            const node = nodeMap.get(edge.target);
            if (node) {
                const children = childrenMap.get(edge.source) || [];
                children.push(node);
                childrenMap.set(edge.source, children);
            }
        }

        const activeSet = new Set(currentActiveAncestorIds);
        if (currentActiveNodeId) activeSet.add(currentActiveNodeId);

        const pseudoRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const drawBranch = (
            startX: number,
            startY: number,
            angle: number,
            length: number,
            branchWidth: number,
            nodeId: string | 'VIRTUAL_ROOT',
            depth: number
        ) => {
            const isActive = nodeId === 'VIRTUAL_ROOT' ? currentActiveNodeId !== null : activeSet.has(nodeId);

            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const curveOffset = length * opts.curveFactor * (depth % 2 === 0 ? 1 : -1);
            const cp1X = midX + Math.cos(angle + Math.PI / 2) * curveOffset;
            const cp1Y = midY + Math.sin(angle + Math.PI / 2) * curveOffset;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cp1X, cp1Y, endX, endY);

            const style = opts.getBranchStyle(isActive);
            ctx.lineCap = 'round';
            ctx.lineWidth = branchWidth;
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

            const baseSpread = Math.PI / opts.spreadFactor;
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
                    length * opts.lengthDecay,
                    branchWidth * opts.widthDecay,
                    child.id,
                    depth + 1
                );
            });
        };

        const startAngle = opts.direction === 'up' ? -Math.PI / 2 : Math.PI / 2;

        drawBranch(
            islandX,
            islandY + (opts.direction === 'up' ? 40 : 0),
            startAngle,
            height * opts.initialLengthFactor,
            opts.initialWidth,
            'VIRTUAL_ROOT',
            0
        );
    }, []);

    const canvasRef = useAnimationLoop(draw);

    return canvasRef;
}
