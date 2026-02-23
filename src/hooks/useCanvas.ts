import { useRef, useEffect } from 'react';

export function useCanvas(draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const { clientWidth, clientHeight } = canvasRef.current.parentElement || { clientWidth: window.innerWidth, clientHeight: window.innerHeight };
                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = clientWidth * dpr;
                canvasRef.current.height = clientHeight * dpr;

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.scale(dpr, dpr);
                    draw(ctx, clientWidth, clientHeight);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial draw

        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    return canvasRef;
}
