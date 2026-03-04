import { memo, useRef, useCallback } from 'react';
import { useRevisionStore } from '../../../../store/useRevisionStore';
import { useAnimationLoop } from '../../../../hooks/useAnimationLoop';
import { createSpringManager } from '../../../../animation/springManager';
import { warmthToGradient } from '../../../../animation/interpolation';

/**
 * BackgroundLayer - Static gradient canvas that shifts warmer when a timer is active.
 *
 * Draws a linear gradient: warm amber/gold at top -> twilight purple -> deep night blue.
 * Uses a spring animation to smoothly transition the warmth value when activeNodeId changes.
 * Only redraws when the warmth spring is animating (skips frames when settled).
 */
export const BackgroundLayer = memo(function BackgroundLayer() {
    const activeNodeId = useRevisionStore((s) => s.activeNodeId);
    const activeNodeIdRef = useRef(activeNodeId);
    activeNodeIdRef.current = activeNodeId;

    // Spring manager for warmth animation
    const springManagerRef = useRef(createSpringManager());
    const lastDrawnWarmthRef = useRef(-1); // Force first draw
    const hasDrawnOnceRef = useRef(false);
    const prevActiveRef = useRef<string | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, deltaMs: number) => {
        const currentActiveNodeId = activeNodeIdRef.current;
        const mgr = springManagerRef.current;

        // Detect activeNodeId change and trigger warmth spring
        if (currentActiveNodeId !== prevActiveRef.current) {
            prevActiveRef.current = currentActiveNodeId;
            const targetWarmth = currentActiveNodeId ? 1 : 0;
            const currentWarmth = mgr.get('warmth') ?? 0;
            mgr.set('warmth', currentWarmth, targetWarmth, {
                stiffness: 40,
                damping: 20,
                mass: 1,
            });
            hasDrawnOnceRef.current = false; // Force redraw during spring
        }

        // Tick the spring
        mgr.tick(deltaMs);
        const warmth = mgr.get('warmth') ?? 0;

        // Skip redraw if warmth hasn't changed and we've drawn at least once
        if (hasDrawnOnceRef.current && Math.abs(warmth - lastDrawnWarmthRef.current) < 0.001) {
            return;
        }

        lastDrawnWarmthRef.current = warmth;
        hasDrawnOnceRef.current = true;

        // Draw the gradient
        const topColor = warmthToGradient(warmth);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `rgb(${topColor.r}, ${topColor.g}, ${topColor.b})`);
        gradient.addColorStop(0.4, 'rgb(80, 60, 100)');  // Twilight purple
        gradient.addColorStop(1, 'rgb(15, 15, 45)');      // Deep night blue

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
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
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    );
});

BackgroundLayer.displayName = 'BackgroundLayer';
