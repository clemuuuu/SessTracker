import { useRef, useEffect, type RefObject } from 'react';

/**
 * DPR-aware RAF canvas hook with delta-time accumulation and IntersectionObserver.
 *
 * Key differences from useAnimatedCanvas:
 * - Passes both deltaMs (clamped to 100ms) and totalMs (raw timestamp) to the draw callback
 * - Designed for the animated tree system where delta-time drives spring physics
 *
 * @param draw - Render callback receiving (ctx, width, height, deltaMs, totalMs)
 * @returns Ref to attach to a <canvas> element
 */
export function useAnimationLoop(
    draw: (ctx: CanvasRenderingContext2D, width: number, height: number, deltaMs: number, totalMs: number) => void
): RefObject<HTMLCanvasElement | null> {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previousTimeRef = useRef<number>(0);

    useEffect(() => {
        let animationFrameId: number;
        let isVisible = false;

        const render = (timestamp: number) => {
            if (isVisible && canvasRef.current) {
                const deltaMs = previousTimeRef.current ? timestamp - previousTimeRef.current : 16;
                previousTimeRef.current = timestamp;

                // Clamp delta to avoid huge jumps after tab switch
                const clampedDelta = Math.min(deltaMs, 100);

                const { clientWidth, clientHeight } = canvasRef.current.parentElement || { clientWidth: window.innerWidth, clientHeight: window.innerHeight };
                const dpr = window.devicePixelRatio || 1;

                // Resize canvas buffer if dimensions changed
                if (canvasRef.current.width !== clientWidth * dpr || canvasRef.current.height !== clientHeight * dpr) {
                    canvasRef.current.width = clientWidth * dpr;
                    canvasRef.current.height = clientHeight * dpr;
                }

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.save();
                    ctx.scale(dpr, dpr);
                    draw(ctx, clientWidth, clientHeight, clampedDelta, timestamp);
                    ctx.restore();
                }
            } else {
                // Update previousTimeRef even when not visible, so we don't get
                // a huge delta spike when becoming visible again
                previousTimeRef.current = timestamp;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        // Pause drawing when canvas is off-screen via IntersectionObserver
        const observer = new IntersectionObserver(
            ([entry]) => { isVisible = entry.isIntersecting; },
            { threshold: 0 }
        );

        if (canvasRef.current) {
            observer.observe(canvasRef.current);
        }

        animationFrameId = requestAnimationFrame(render);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [draw]);

    return canvasRef;
}
