import { memo, useRef, useCallback } from 'react';
import { useRevisionStore } from '../../../../store/useRevisionStore';
import { useAnimationLoop } from '../../../../hooks/useAnimationLoop';
import { createSpringManager } from '../../../../animation/springManager';
import { breathe } from '../../../../animation/easing';
import { glowToOpacity } from '../../../../animation/interpolation';
import type { RevisionNode } from '../../../../types';

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

interface TreeLayerProps {
    options: TreeCanvasOptions;
}

/**
 * TreeLayer - Animated tree canvas with ambient sway, breathing glow, and activation wave.
 *
 * Uses useAnimationLoop for RAF rendering.
 * Zustand-RAF boundary: reads from refs, never from store in draw callback.
 */
export const TreeLayer = memo(function TreeLayer({ options }: TreeLayerProps) {
    // Zustand-RAF boundary: read store via selectors, cache into refs
    const nodes = useRevisionStore((s) => s.nodes);
    const edges = useRevisionStore((s) => s.edges);
    const activeNodeId = useRevisionStore((s) => s.activeNodeId);
    const activeAncestorIds = useRevisionStore((s) => s.activeAncestorIds);

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const activeNodeIdRef = useRef(activeNodeId);
    const activeAncestorIdsRef = useRef(activeAncestorIds);
    const optionsRef = useRef(options);

    // Sync refs on every render
    nodesRef.current = nodes;
    edgesRef.current = edges;
    activeNodeIdRef.current = activeNodeId;
    activeAncestorIdsRef.current = activeAncestorIds;
    optionsRef.current = options;

    // Activation wave tracking
    const prevActiveNodeIdRef = useRef<string | null>(null);
    const springManagerRef = useRef(createSpringManager());
    const waveAncestorDepthRef = useRef(0);

    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, deltaMs: number, totalMs: number) => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const currentActiveNodeId = activeNodeIdRef.current;
        const currentActiveAncestorIds = activeAncestorIdsRef.current;
        const opts = optionsRef.current;
        const mgr = springManagerRef.current;

        // Clear the canvas
        ctx.clearRect(0, 0, width, height);

        // --- Activation wave detection ---
        if (currentActiveNodeId !== prevActiveNodeIdRef.current) {
            const wasNull = prevActiveNodeIdRef.current === null;
            prevActiveNodeIdRef.current = currentActiveNodeId;

            if (currentActiveNodeId !== null) {
                // Timer started or switched: trigger activation wave
                const ancestorCount = currentActiveAncestorIds.length;
                waveAncestorDepthRef.current = ancestorCount + 1; // +1 for the node itself
                mgr.set('activation-wave', 0, 1, {
                    stiffness: 60,
                    damping: 18,
                    mass: 1,
                });
            } else if (!wasNull) {
                // Timer stopped: remove wave
                mgr.remove('activation-wave');
            }
        }

        // Tick spring manager
        mgr.tick(deltaMs);
        const waveProgress = mgr.get('activation-wave');
        const waveDone = !mgr.has('activation-wave') ? true : (waveProgress !== undefined && waveProgress >= 0.99);

        // Clean up completed wave
        if (waveDone && mgr.has('activation-wave')) {
            mgr.remove('activation-wave');
        }

        // --- Tree structure ---
        const islandX = width / 2;
        const islandY = opts.startPosition === 'bottom-center' ? height : 0;

        // Identify roots (nodes with no incoming edges)
        const targetIds = new Set(currentEdges.map(e => e.target));
        const roots = currentNodes.filter(n => !targetIds.has(n.id));

        // Build children map
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

        // --- Breathing glow parameters ---
        const glowCycleMs = 2500;
        const glowProgress = (totalMs % glowCycleMs) / glowCycleMs;
        const easedGlowProgress = breathe(glowProgress);
        const glowIntensity = glowToOpacity(easedGlowProgress);

        const totalAncestorDepth = waveAncestorDepthRef.current;

        const drawBranch = (
            startX: number,
            startY: number,
            angle: number,
            length: number,
            branchWidth: number,
            nodeId: string | 'VIRTUAL_ROOT',
            depth: number
        ) => {
            const isActive = nodeId === 'VIRTUAL_ROOT'
                ? currentActiveNodeId !== null
                : activeSet.has(nodeId);

            // --- Ambient sway ---
            const branchSeed = nodeId === 'VIRTUAL_ROOT'
                ? 42
                : nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const swayAmplitude = 0.02 * (1 + depth * 0.1);
            const swayPeriod = 2000 + pseudoRandom(branchSeed + 7) * 2000; // 2000-4000ms
            const swayOffset = swayAmplitude * Math.sin(totalMs / swayPeriod + branchSeed);
            const swayedAngle = angle + swayOffset;

            const endX = startX + Math.cos(swayedAngle) * length;
            const endY = startY + Math.sin(swayedAngle) * length;

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            const curveOffset = length * opts.curveFactor * (depth % 2 === 0 ? 1 : -1);
            const cp1X = midX + Math.cos(swayedAngle + Math.PI / 2) * curveOffset;
            const cp1Y = midY + Math.sin(swayedAngle + Math.PI / 2) * curveOffset;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(cp1X, cp1Y, endX, endY);

            const style = opts.getBranchStyle(isActive);
            ctx.lineCap = 'round';
            ctx.lineWidth = branchWidth;
            ctx.strokeStyle = style.stroke;

            // --- Breathing glow (active branches only) ---
            if (isActive && currentActiveNodeId !== null) {
                const glowAlpha = glowIntensity;
                ctx.shadowColor = style.shadow.replace(')', `, ${glowAlpha})`).replace('rgb(', 'rgba(');
                // If shadow color is already in a named/hex format, use it with blur
                if (!style.shadow.includes('rgb')) {
                    ctx.shadowColor = style.shadow;
                }
                ctx.shadowBlur = style.blur * glowAlpha;
            } else {
                ctx.shadowColor = style.shadow;
                ctx.shadowBlur = style.blur;
            }

            // --- Activation wave flash ---
            if (isActive && waveProgress !== undefined && !waveDone && totalAncestorDepth > 0) {
                const normalizedDepth = depth / totalAncestorDepth;
                const waveReaches = waveProgress > normalizedDepth;
                if (waveReaches) {
                    // Brief bright flash that fades as wave passes
                    const distancePastNode = waveProgress - normalizedDepth;
                    const flashIntensity = Math.max(0, 1 - distancePastNode * 3);
                    ctx.shadowBlur = Math.max(ctx.shadowBlur, 30 * flashIntensity);
                    // Brighten the stroke slightly during flash
                    if (flashIntensity > 0.1) {
                        ctx.strokeStyle = `rgba(253, 230, 138, ${0.5 + flashIntensity * 0.5})`; // amber-200
                    }
                }
            }

            ctx.stroke();
            ctx.shadowBlur = 0;

            // --- Draw children ---
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

            const startAngle = swayedAngle - currentSpread / 2;
            const angleStep = children.length > 1 ? currentSpread / (children.length - 1) : 0;

            children.forEach((child, i) => {
                const seed = child.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + depth;
                const randomWiggle = (pseudoRandom(seed) * 0.2 - 0.1);

                const childAngle = children.length === 1
                    ? swayedAngle + randomWiggle
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

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none',
                filter: 'blur(0.5px)',
            }}
        />
    );
});

TreeLayer.displayName = 'TreeLayer';
