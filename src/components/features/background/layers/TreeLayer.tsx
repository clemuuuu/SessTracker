import { memo, useRef, useCallback } from 'react';
import { useRevisionStore } from '../../../../store/useRevisionStore';
import { useAnimationLoop } from '../../../../hooks/useAnimationLoop';
import { createSpringManager } from '../../../../animation/springManager';
import { breathe } from '../../../../animation/easing';
import { glowToOpacity, timeToThickness, thicknessToColor, thicknessToInactiveColor, MIN_THICKNESS } from '../../../../animation/interpolation';
import { buildCumulativeTimeMap } from '../../../../utils/graphHelpers';
import type { RevisionNode } from '../../../../types';

interface TreeCanvasOptions {
    direction: 'up' | 'down';
    startPosition: 'bottom-center' | 'top-center';
    getBranchStyle: (isActive: boolean) => { stroke: string; shadow: string; blur: number; lineWidth: number };
    curveFactor: number;
    spreadFactor: number;
    lengthDecay: number;
    /** @deprecated Retained for backward compatibility with useTreeCanvas/RootsBackground. Ignored by data-driven thickness system. */
    widthDecay: number;
    initialLengthFactor: number;
    /** @deprecated Retained for backward compatibility with useTreeCanvas/RootsBackground. Ignored by data-driven thickness system. */
    initialWidth: number;
}

interface TreeLayerProps {
    options: TreeCanvasOptions;
}

/** Data cached per branch for wither animations after node deletion */
interface WitheringBranchData {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
    color: string;
    parentId: string;
    angle: number;
    depth: number;
}

/** Data cached per branch each frame for potential wither use */
interface BranchRenderData {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
    color: string;
    parentId: string;
    angle: number;
    depth: number;
}

/**
 * TreeLayer - Animated tree canvas with data-driven branch thickness, color taper,
 * sprout/wither animations, ambient sway, breathing glow, and activation wave.
 *
 * Uses useAnimationLoop for RAF rendering.
 * Zustand-RAF boundary: reads from refs, never from store in draw callback.
 *
 * Branch thickness is driven by cumulative study time (logarithmic curve):
 * - Trunk is thickest (sum of all descendants)
 * - Leaves are thinnest (own time only)
 * - Color deepens from light gold (thin) to deep amber (thick)
 * - Each branch tapers from thick base to thin tip
 * - Thickness spring-animates on every-minute growth pulse
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

    // Thickness tracking refs
    const lastThicknessUpdateRef = useRef(0);
    const targetThicknessMapRef = useRef(new Map<string, number>());
    const knownNodeIdsRef = useRef(new Set<string>());
    const witheringNodesRef = useRef(new Map<string, WitheringBranchData>());
    const lastBranchDataRef = useRef(new Map<string, BranchRenderData>());

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

        // Build children map (RevisionNode[] for rendering traversal)
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

        // Build children ID map (string[] for buildCumulativeTimeMap)
        const childrenIdMap = new Map<string, string[]>();
        for (const [parentId, children] of childrenMap) {
            childrenIdMap.set(parentId, children.map(c => c.id));
        }

        // --- Cumulative time computation ---
        const cumulativeMap = buildCumulativeTimeMap(currentNodes, childrenIdMap);

        // Compute VIRTUAL_ROOT cumulative time as sum of all root cumulative times
        let virtualRootCumulativeTime = 0;
        for (const root of roots) {
            virtualRootCumulativeTime += cumulativeMap.get(root.id) ?? 0;
        }

        // --- Detect node additions and removals ---
        const currentIds = new Set(currentNodes.map(n => n.id));
        let nodeSetChanged = false;

        // New nodes: sprout animation
        for (const id of currentIds) {
            if (!knownNodeIdsRef.current.has(id)) {
                nodeSetChanged = true;
                mgr.set('ext-' + id, 0, 1, { stiffness: 50, damping: 12, mass: 1 });
            }
        }

        // Removed nodes: wither animation — cache last-known rendering data
        for (const id of knownNodeIdsRef.current) {
            if (!currentIds.has(id)) {
                nodeSetChanged = true;
                const cachedData = lastBranchDataRef.current.get(id);
                if (cachedData) {
                    witheringNodesRef.current.set(id, {
                        startX: cachedData.startX,
                        startY: cachedData.startY,
                        endX: cachedData.endX,
                        endY: cachedData.endY,
                        thickness: cachedData.thickness,
                        color: cachedData.color,
                        parentId: cachedData.parentId,
                        angle: cachedData.angle,
                        depth: cachedData.depth,
                    });
                }
                const currentExtension = mgr.get('ext-' + id) ?? 1;
                mgr.set('ext-' + id, currentExtension, 0, { stiffness: 70, damping: 16, mass: 0.8 });
            }
        }

        knownNodeIdsRef.current = currentIds;

        // --- Every-minute throttle for thickness spring retargeting ---
        const now = Date.now();
        const shouldUpdateThickness = !lastThicknessUpdateRef.current || (now - lastThicknessUpdateRef.current) > 60000;

        if (shouldUpdateThickness || nodeSetChanged) {
            // Update thickness springs for all nodes
            for (const [nodeId, cumTime] of cumulativeMap) {
                const targetThickness = timeToThickness(cumTime);
                const prevTarget = targetThicknessMapRef.current.get(nodeId);

                if (prevTarget === undefined) {
                    // First appearance: set immediately (no animation on initial load)
                    mgr.set('thick-' + nodeId, targetThickness, targetThickness);
                    targetThicknessMapRef.current.set(nodeId, targetThickness);
                } else if (Math.abs(targetThickness - prevTarget) > 0.3) {
                    // Thickness changed significantly: retarget spring
                    const currentAnimatedThickness = mgr.get('thick-' + nodeId) ?? targetThickness;
                    mgr.set('thick-' + nodeId, currentAnimatedThickness, targetThickness, {
                        stiffness: 60,
                        damping: 14,
                        mass: 1.2,
                    });
                    targetThicknessMapRef.current.set(nodeId, targetThickness);
                }
            }

            // VIRTUAL_ROOT thickness
            const virtualRootTargetThickness = timeToThickness(virtualRootCumulativeTime);
            const prevVRTarget = targetThicknessMapRef.current.get('VIRTUAL_ROOT');

            if (prevVRTarget === undefined) {
                mgr.set('thick-VIRTUAL_ROOT', virtualRootTargetThickness, virtualRootTargetThickness);
                targetThicknessMapRef.current.set('VIRTUAL_ROOT', virtualRootTargetThickness);
            } else if (Math.abs(virtualRootTargetThickness - prevVRTarget) > 0.3) {
                const currentVRThickness = mgr.get('thick-VIRTUAL_ROOT') ?? virtualRootTargetThickness;
                mgr.set('thick-VIRTUAL_ROOT', currentVRThickness, virtualRootTargetThickness, {
                    stiffness: 60,
                    damping: 14,
                    mass: 1.2,
                });
                targetThicknessMapRef.current.set('VIRTUAL_ROOT', virtualRootTargetThickness);
            }

            if (shouldUpdateThickness) {
                lastThicknessUpdateRef.current = now;
            }
        }

        // Clean up thickness targets for removed nodes
        for (const id of targetThicknessMapRef.current.keys()) {
            if (id !== 'VIRTUAL_ROOT' && !currentIds.has(id)) {
                // Don't remove immediately — withering nodes still need their springs.
                // They'll be cleaned up when wither animation completes.
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

        // Build parent map for caching branch parentId
        const parentMap = new Map<string, string>();
        for (const edge of currentEdges) {
            parentMap.set(edge.target, edge.source);
        }

        // Clear last branch data for this frame (will be rebuilt during drawBranch)
        lastBranchDataRef.current.clear();

        const drawBranch = (
            startX: number,
            startY: number,
            angle: number,
            length: number,
            nodeId: string | 'VIRTUAL_ROOT',
            depth: number,
            parentTipWidth?: number
        ) => {
            const isActive = nodeId === 'VIRTUAL_ROOT'
                ? currentActiveNodeId !== null
                : activeSet.has(nodeId);

            // --- Data-driven thickness ---
            const animatedThickness = mgr.get('thick-' + nodeId) ?? MIN_THICKNESS;

            // --- Extension progress (sprout animation) ---
            const extensionProgress = mgr.get('ext-' + nodeId) ?? 1;
            const effectiveLength = length * extensionProgress;

            // --- Branch color from thickness ---
            const color = isActive
                ? thicknessToColor(animatedThickness)
                : thicknessToInactiveColor(animatedThickness);

            // --- Ambient sway (scaled inversely with thickness) ---
            const branchSeed = nodeId === 'VIRTUAL_ROOT'
                ? 42
                : nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const swayAmplitude = 0.02 * (1 + depth * 0.1) * (MIN_THICKNESS / Math.max(animatedThickness, MIN_THICKNESS));
            const swayPeriod = 2000 + pseudoRandom(branchSeed + 7) * 2000; // 2000-4000ms
            const swayOffset = swayAmplitude * Math.sin(totalMs / swayPeriod + branchSeed);
            const swayedAngle = angle + swayOffset;

            const endX = startX + Math.cos(swayedAngle) * effectiveLength;
            const endY = startY + Math.sin(swayedAngle) * effectiveLength;

            // --- Tapered branch rendering (filled polygon) ---
            // Smooth junction: if parent passed its tip width, blend into it so the
            // child's base width matches where the parent ended. This prevents abrupt
            // width jumps at branch junctions. The base smoothly transitions from the
            // parent's tip width to the child's own thickness over the first ~30% of
            // the branch, then tapers normally to the tip.
            const ownStartWidth = animatedThickness;
            const startWidth = parentTipWidth !== undefined
                ? Math.max(parentTipWidth, ownStartWidth * 0.6)
                : ownStartWidth;
            const endWidth = animatedThickness * 0.55;

            const branchAngle = Math.atan2(endY - startY, endX - startX);
            const perpAngle = branchAngle + Math.PI / 2;

            const halfStartW = startWidth / 2;
            const halfEndW = endWidth / 2;

            // Four corners of the tapered shape
            const x1 = startX + Math.cos(perpAngle) * halfStartW;
            const y1 = startY + Math.sin(perpAngle) * halfStartW;
            const x2 = startX - Math.cos(perpAngle) * halfStartW;
            const y2 = startY - Math.sin(perpAngle) * halfStartW;
            const x3 = endX - Math.cos(perpAngle) * halfEndW;
            const y3 = endY - Math.sin(perpAngle) * halfEndW;
            const x4 = endX + Math.cos(perpAngle) * halfEndW;
            const y4 = endY + Math.sin(perpAngle) * halfEndW;

            // Slight curve bulge for organic feel
            const bulgeFactor = startWidth * 0.05;

            const style = opts.getBranchStyle(isActive);

            // --- Breathing glow (active branches only) ---
            if (isActive && currentActiveNodeId !== null) {
                const glowAlpha = glowIntensity;
                ctx.shadowColor = style.shadow.replace(')', `, ${glowAlpha})`).replace('rgb(', 'rgba(');
                if (!style.shadow.includes('rgb')) {
                    ctx.shadowColor = style.shadow;
                }
                // Scale glow blur with thickness
                ctx.shadowBlur = style.blur * glowAlpha * (animatedThickness / MIN_THICKNESS) * 0.5;
            } else {
                ctx.shadowColor = style.shadow;
                ctx.shadowBlur = style.blur;
            }

            // --- Activation wave flash ---
            if (isActive && waveProgress !== undefined && !waveDone && totalAncestorDepth > 0) {
                const normalizedDepth = depth / totalAncestorDepth;
                const waveReaches = waveProgress > normalizedDepth;
                if (waveReaches) {
                    const distancePastNode = waveProgress - normalizedDepth;
                    const flashIntensity = Math.max(0, 1 - distancePastNode * 3);
                    ctx.shadowBlur = Math.max(ctx.shadowBlur, 30 * flashIntensity);
                }
            }

            // Draw tapered branch as filled polygon with smooth edges
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(
                (x1 + x4) / 2 + Math.cos(perpAngle) * bulgeFactor,
                (y1 + y4) / 2 + Math.sin(perpAngle) * bulgeFactor,
                x4, y4
            );
            ctx.lineTo(x3, y3);
            ctx.quadraticCurveTo(
                (x2 + x3) / 2 - Math.cos(perpAngle) * bulgeFactor,
                (y2 + y3) / 2 - Math.sin(perpAngle) * bulgeFactor,
                x2, y2
            );
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();

            // --- Junction knob: draw a filled circle at the base to smooth the
            //     connection with the parent branch. The radius is the average of
            //     the parent tip and the child base, creating a natural swelling. ---
            if (parentTipWidth !== undefined && depth > 0) {
                const junctionRadius = (startWidth * 0.5 + (parentTipWidth * 0.5)) / 2;
                ctx.beginPath();
                ctx.arc(startX, startY, junctionRadius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }

            ctx.shadowBlur = 0;

            // --- Cache branch rendering data for potential wither use ---
            if (nodeId !== 'VIRTUAL_ROOT') {
                lastBranchDataRef.current.set(nodeId, {
                    startX,
                    startY,
                    endX,
                    endY,
                    thickness: animatedThickness,
                    color,
                    parentId: parentMap.get(nodeId) ?? 'VIRTUAL_ROOT',
                    angle: swayedAngle,
                    depth,
                });
            }

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
                    effectiveLength * opts.lengthDecay,
                    child.id,
                    depth + 1,
                    endWidth
                );
            });
        };

        const startAngle = opts.direction === 'up' ? -Math.PI / 2 : Math.PI / 2;

        drawBranch(
            islandX,
            islandY + (opts.direction === 'up' ? 40 : 0),
            startAngle,
            height * opts.initialLengthFactor,
            'VIRTUAL_ROOT',
            0
        );

        // --- Draw withering branches (deleted nodes animating out) ---
        const witheringToClean: string[] = [];
        for (const [id, data] of witheringNodesRef.current) {
            const extProgress = mgr.get('ext-' + id) ?? 0;

            if (extProgress <= 0.01) {
                // Animation done: clean up
                witheringToClean.push(id);
                continue;
            }

            // Draw the cached branch with shrinking length
            const dx = data.endX - data.startX;
            const dy = data.endY - data.startY;
            const witherEndX = data.startX + dx * extProgress;
            const witherEndY = data.startY + dy * extProgress;

            const witherStartWidth = data.thickness * extProgress;
            const witherEndWidth = data.thickness * 0.55 * extProgress;

            const witherAngle = Math.atan2(witherEndY - data.startY, witherEndX - data.startX);
            const witherPerp = witherAngle + Math.PI / 2;

            const halfWS = witherStartWidth / 2;
            const halfWE = witherEndWidth / 2;

            const wx1 = data.startX + Math.cos(witherPerp) * halfWS;
            const wy1 = data.startY + Math.sin(witherPerp) * halfWS;
            const wx2 = data.startX - Math.cos(witherPerp) * halfWS;
            const wy2 = data.startY - Math.sin(witherPerp) * halfWS;
            const wx3 = witherEndX - Math.cos(witherPerp) * halfWE;
            const wy3 = witherEndY - Math.sin(witherPerp) * halfWE;
            const wx4 = witherEndX + Math.cos(witherPerp) * halfWE;
            const wy4 = witherEndY + Math.sin(witherPerp) * halfWE;

            const wBulge = witherStartWidth * 0.05;

            ctx.beginPath();
            ctx.moveTo(wx1, wy1);
            ctx.quadraticCurveTo(
                (wx1 + wx4) / 2 + Math.cos(witherPerp) * wBulge,
                (wy1 + wy4) / 2 + Math.sin(witherPerp) * wBulge,
                wx4, wy4
            );
            ctx.lineTo(wx3, wy3);
            ctx.quadraticCurveTo(
                (wx2 + wx3) / 2 - Math.cos(witherPerp) * wBulge,
                (wy2 + wy3) / 2 - Math.sin(witherPerp) * wBulge,
                wx2, wy2
            );
            ctx.closePath();
            ctx.fillStyle = data.color;
            // Fade out as it withers
            ctx.globalAlpha = extProgress;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Clean up completed wither animations
        for (const id of witheringToClean) {
            witheringNodesRef.current.delete(id);
            mgr.remove('ext-' + id);
            mgr.remove('thick-' + id);
            targetThicknessMapRef.current.delete(id);
            lastBranchDataRef.current.delete(id);
        }
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
