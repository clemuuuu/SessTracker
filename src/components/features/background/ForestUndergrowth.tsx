import React, { useRef, useEffect, useState } from 'react';
import { pseudoRandom } from '../../../utils/canvasGeometricUtils';

export const ForestUndergrowth: React.FC = React.memo(() => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                const { clientWidth, clientHeight } = canvasRef.current;
                setDimensions({ width: clientWidth, height: clientHeight });

                const dpr = window.devicePixelRatio || 1;
                canvasRef.current.width = clientWidth * dpr;
                canvasRef.current.height = clientHeight * dpr;

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.scale(dpr, dpr);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Drawing Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        const horizonY = dimensions.height * 0.85;
        const groundHeight = dimensions.height - horizonY;

        // --- 1. Ground Base (Deep Green Gradient) ---
        const groundGradient = ctx.createLinearGradient(0, horizonY, 0, dimensions.height);
        groundGradient.addColorStop(0, '#0f172a'); // Match background slate-900 at horizon
        groundGradient.addColorStop(0.3, '#064e3b'); // emerald-900
        groundGradient.addColorStop(1, '#022c22');   // emerald-950

        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, horizonY, dimensions.width, groundHeight);

        // --- 2. Paths & Stream (Perspective) ---
        // Helper to draw a tapering path
        const drawPath = (seed: string, type: 'dirt' | 'water') => {
            const startX = pseudoRandom(seed + 'start') * dimensions.width;
            const endX = pseudoRandom(seed + 'end') * dimensions.width;

            // Central control point for curve
            const cpX = (startX + endX) / 2 + (pseudoRandom(seed + 'curve') - 0.5) * 400;
            const cpY = horizonY + groundHeight * 0.5;

            ctx.beginPath();
            ctx.moveTo(startX, dimensions.height + 20); // Start below bottom
            ctx.quadraticCurveTo(cpX, cpY, endX, horizonY); // Curve to horizon

            // Perspective width
            const startWidth = type === 'water' ? 80 : 120;
            const endWidth = type === 'water' ? 10 : 20;

            // Draw simply with line width? No, variable width needs a custom polygon or multiple lines.
            // Let's use multiple lines with decreasing width and slightly offset position for a filled look?
            // Or just a thick line that tapers? Canvas doesn't support tapering line width natively easily.
            // Easy trick: Draw a filled shape.

            // Calculate parallel curves (approximate)
            // Left edge

            // Right edge


            // Actually, simpler: just draw a very thick line and clip it?
            // Let's try drawing a filled polygon by manually offsetting points.
            // A simple trapezoid-like bezier shape.

            ctx.beginPath();
            // Bottom Left
            ctx.moveTo(startX - startWidth / 2, dimensions.height + 20);
            // Curve to Top Left
            ctx.quadraticCurveTo(cpX - 20, cpY, endX - endWidth / 2, horizonY);
            // Top Edge
            ctx.lineTo(endX + endWidth / 2, horizonY);
            // Curve to Bottom Right
            ctx.quadraticCurveTo(cpX + 20, cpY, startX + startWidth / 2, dimensions.height + 20);
            ctx.closePath();

            if (type === 'dirt') {
                ctx.fillStyle = '#451a03'; // amber-950/brown
                // Texture for dirt

                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'; // cyan-500/40 opacity
                ctx.fill();
                // Water reflection
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };

        // Draw 2 Dirt Paths
        drawPath('path-1', 'dirt');
        drawPath('path-2', 'dirt');
        // Draw 1 Stream
        drawPath('stream-1', 'water');


        // --- 3. Grass Texture (Noise) ---
        for (let i = 0; i < 300; i++) {
            const seed = `grass-${i}`;
            const x = pseudoRandom(seed + 'x') * dimensions.width;
            const y = horizonY + pseudoRandom(seed + 'y') * groundHeight;
            const size = 2 + pseudoRandom(seed + 's') * 3;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(x, y, 1, size); // Tiny grass blades
        }


        // --- 4. Undergrowth (Bushes & Flowers) - Original Logic ---
        const numItems = 40;
        const segmentWidth = dimensions.width / numItems;

        for (let i = 0; i < numItems; i++) {
            const seed = `undergrowth-${i}`;
            const rnd = pseudoRandom(seed);
            const rnd2 = pseudoRandom(seed + '-2');
            const rndColor = pseudoRandom(seed + '-color');

            const x = i * segmentWidth + (rnd * segmentWidth);
            const y = horizonY + (rnd2 * 10 - 5);

            const isBush = rnd < 0.6;

            if (isBush) {
                const size = 15 + rnd2 * 20;
                ctx.beginPath();
                ctx.arc(x, y, size, Math.PI, 0);
                ctx.fillStyle = rnd2 > 0.5 ? '#166534' : '#14532d';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x - size * 0.3, y - size * 0.5, size * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fill();

            } else {
                const stemHeight = 10 + rnd2 * 15;
                const flowerSize = 4 + rnd * 3;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y - stemHeight);
                ctx.strokeStyle = '#15803d';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(x, y - stemHeight, flowerSize, 0, Math.PI * 2);

                const colors = ['#f472b6', '#c084fc', '#60a5fa', '#fbbf24', '#f87171', '#2dd4bf'];
                const colorIndex = Math.floor(rndColor * colors.length);
                ctx.fillStyle = colors[colorIndex];
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x, y - stemHeight, flowerSize * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = '#fef3c7';
                ctx.fill();
            }
        }

    }, [dimensions]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10" // z-10 to sit above horizon but below UI
            style={{ width: '100%', height: '100%' }}
        />
    );
});
